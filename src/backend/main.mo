import Text "mo:core/Text";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Nat8 "mo:base/Nat8";
import Timer "mo:base/Timer";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // ─────────────────────────────────────────────
  // TYPES
  // ─────────────────────────────────────────────
  public type Provider = {
    id : Text;
    name : Text;
    address : Text;
    zip : Text;
    phone : Text;
    isLive : Bool;
    isVerified : Bool;
    lastVerified : Int;
  };

  public type ProviderInput = {
    name : Text;
    address : Text;
    zip : Text;
    phone : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  // ── Proof of Presence (PoP) Types ──────────────────
  // NO-PHI: Only volHash (one-way hash), zip, and timestamp stored
  public type HandoffStatus = { #Pending; #Completed };

  public type Handoff = {
    id : Text;
    volHash : Text; // one-way hash of caller principal — cannot identify person
    zip : Text;     // anonymous ZIP code only
    timestamp : Int;
    status : HandoffStatus;
  };

  public type HandoffStats = {
    total : Nat;
    recent : Nat;
  };

  public type CompleteHandoffResult = { #ok; #err : Text };

  // ── Contact Message Type ──────────────────────────
  // No PHI: name/org are voluntary identifiers for follow-up, not patient data
  public type ContactMessage = {
    id : Text;
    name : Text;
    organization : Text;
    message : Text;
    timestamp : Int;
  };

  module Provider {
    public func compare(provider1 : Provider, provider2 : Provider) : Order.Order {
      Text.compare(provider1.id, provider2.id);
    };
  };

  // ─────────────────────────────────────────────
  // AUTHORIZATION
  // ─────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  let providers = Map.empty<Text, Provider>();
  let providerOwners = Map.empty<Principal, Text>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Contact messages from partner orgs and vetted collaborators
  let contactMessages = Map.empty<Text, ContactMessage>();
  var contactMessageCounter : Nat = 0;

  // Sentinel Agent state (NO-PHI: only ZIP codes and timestamps)
  let searchVolume = Map.empty<Text, Nat>(); // zip -> anonymous search count
  var systemRiskLevel : Text = "GREEN"; // GREEN | RED

  var providerIdCounter = 0;

  // Proof of Presence state (NO-PHI: only volHash, zip, timestamp)
  let handoffs = Map.empty<Text, Handoff>(); // token -> Handoff record
  var handoffCounter : Nat = 0;

  // ─────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────
  // Hard Rule 2: 4-hour decay threshold (in nanoseconds)
  let FOUR_HOURS_NS : Int = 14_400_000_000_000;
  // 5-minute handoff token expiry
  let FIVE_MINUTES_NS : Int = 300_000_000_000;
  // 24-hour window for "recent" handoff stats
  let TWENTY_FOUR_HOURS_NS : Int = 86_400_000_000_000;
  let SEARCH_DEMAND_THRESHOLD : Nat = 100;

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  func getUniqueProviderId() : Text {
    providerIdCounter += 1;
    providerIdCounter.toText();
  };

  // Compute a one-way hash of a Principal's identity for anonymous audit trails.
  // Uses a polynomial rolling hash over the principal's binary representation.
  // NO-PHI: The original principal cannot be recovered from this value.
  func hashPrincipal(p : Principal) : Text {
    let blob = p.toBlob();
    var h : Nat = 5381;
    for (b in blob.vals()) {
      h := (h * 33 + Nat8.toNat(b)) % 999_999_937;
    };
    "vh_" # h.toText();
  };

  // ─────────────────────────────────────────────
  // SENTINEL AGENT
  // Heartbeat: every 5 minutes
  // Auto-Decay: isLive -> false if lastVerified > 4 hours
  // Risk Alert: systemRiskLevel -> RED if ZIP searchVolume > 100 && activeProviders == 0
  // Privacy: only anonymous ZIP codes and timestamps processed — NO PHI
  // ─────────────────────────────────────────────
  func sentinelHeartbeat() : async () {
    let now = Time.now();

    // AUTO-DECAY: enforce 4-hour maximum live window
    for (provider in providers.values()) {
      if (provider.isLive and (now - provider.lastVerified) > FOUR_HOURS_NS) {
        let decayed = { provider with isLive = false };
        providers.add(provider.id, decayed);
      };
    };

    // RISK ALERT: detect high-demand ZIPs with zero active providers
    var riskDetected = false;
    for ((zip, volume) in searchVolume.entries()) {
      if (volume > SEARCH_DEMAND_THRESHOLD) {
        var activeCount : Nat = 0;
        for (p in providers.values()) {
          if (p.zip == zip and p.isLive and p.isVerified) {
            activeCount += 1;
          };
        };
        if (activeCount == 0) {
          riskDetected := true;
        };
      };
    };
    systemRiskLevel := if (riskDetected) { "RED" } else { "GREEN" };
  };

  // Initialize Sentinel heartbeat: runs every 5 minutes (300 seconds)
  ignore Timer.recurringTimer<system>(#seconds(300), sentinelHeartbeat);

  // ─────────────────────────────────────────────
  // SEARCH INTENT (anonymous ZIP tracking — NO PHI)
  // ─────────────────────────────────────────────
  public func recordSearchIntent(zip : Text) : async () {
    if (zip.isEmpty()) return;
    let current = switch (searchVolume.get(zip)) {
      case (null) { 0 };
      case (?v) { v };
    };
    searchVolume.add(zip, current + 1);
  };

  public query func getSystemRiskLevel() : async Text {
    systemRiskLevel;
  };

  // ─────────────────────────────────────────────
  // PROOF OF PRESENCE — HANDOFF SYSTEM
  // Security contract:
  //   - volHash: one-way hash of caller Principal (cannot identify person)
  //   - zip: anonymous geographic area only
  //   - token: opaque URL-safe string, valid for 5 minutes only
  //   - NO PHI ever stored, passed, or logged
  // ─────────────────────────────────────────────

  // requestHandoff: called by authenticated volunteer from DashboardPage.
  // Returns a 5-minute opaque token to be encoded in a QR code.
  public shared ({ caller }) func requestHandoff(zip : Text) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Authentication required to generate a handoff token");
    };
    if (zip.isEmpty()) {
      Runtime.trap("ZIP code is required");
    };

    let now = Time.now();
    handoffCounter += 1;

    // Token: opaque, unique, URL-safe. Counter ensures uniqueness; timestamp
    // adds entropy. Not guessable without knowing both values at generation time.
    let token = "pop_" # handoffCounter.toText() # "_" # now.toText();

    // volHash: irreversible one-way hash of caller principal.
    // NO-PHI: cannot be reversed to identify the volunteer.
    let volHash = hashPrincipal(caller);

    let handoff : Handoff = {
      id = token;
      volHash;
      zip;
      timestamp = now;
      status = #Pending;
    };

    handoffs.add(token, handoff);
    token;
  };

  // completeHandoff: called by the clinic's browser after scanning the QR code.
  // No authentication required — the token itself is the proof of presence.
  public func completeHandoff(token : Text) : async CompleteHandoffResult {
    switch (handoffs.get(token)) {
      case (null) { #err("not_found") };
      case (?h) {
        switch (h.status) {
          case (#Completed) { #err("already_completed") };
          case (#Pending) {
            let now = Time.now();
            if ((now - h.timestamp) > FIVE_MINUTES_NS) {
              return #err("expired");
            };
            let completed = { h with status = #Completed };
            handoffs.add(token, completed);
            #ok;
          };
        };
      };
    };
  };

  // getHandoffStatus: query used by VolunteerQR to poll pending token state.
  public query func getHandoffStatus(token : Text) : async ?Handoff {
    handoffs.get(token);
  };

  // getHandoffStats: public query for the admin "Total Lives Bridged" counter.
  public query func getHandoffStats() : async HandoffStats {
    let now = Time.now();
    var total : Nat = 0;
    var recent : Nat = 0;
    for (h in handoffs.values()) {
      switch (h.status) {
        case (#Completed) {
          total += 1;
          if ((now - h.timestamp) <= TWENTY_FOUR_HOURS_NS) {
            recent += 1;
          };
        };
        case (_) {};
      };
    };
    { total; recent };
  };

  // getRecentHandoffs: polled by admin Impact Pulse map every 5 seconds.
  // Returns all completed handoffs after a given timestamp.
  public query func getRecentHandoffs(since : Int) : async [Handoff] {
    handoffs.values().toArray().filter(
      func(h : Handoff) : Bool {
        switch (h.status) {
          case (#Completed) { h.timestamp > since };
          case (_) { false };
        };
      }
    );
  };

  // ─────────────────────────────────────────────
  // USER PROFILE FUNCTIONS
  // ─────────────────────────────────────────────
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ─────────────────────────────────────────────
  // ADD PROVIDER (SELF-REGISTRATION)
  // ─────────────────────────────────────────────
  public shared ({ caller }) func addProvider(input : ProviderInput) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only providers can register");
    };

    if (input.name.isEmpty() or input.address.isEmpty() or input.zip.isEmpty() or input.phone.isEmpty()) {
      Runtime.trap("All fields are required!");
    };

    switch (providerOwners.get(caller)) {
      case (null) {};
      case (?providerId) { Runtime.trap("Provider already registered with id: " # providerId) };
    };

    let id = getUniqueProviderId();
    let provider : Provider = {
      id;
      name = input.name;
      address = input.address;
      zip = input.zip;
      phone = input.phone;
      isLive = false;
      isVerified = false;
      lastVerified = Time.now();
    };

    providerOwners.add(caller, id);
    providers.add(id, provider);
    id;
  };

  // ─────────────────────────────────────────────
  // TOGGLE LIVE STATUS
  // ─────────────────────────────────────────────
  public shared ({ caller }) func toggleLiveStatus(id : Text) : async () {
    let provider = switch (providers.get(id)) {
      case (null) { Runtime.trap("Provider not found") };
      case (?p) { p };
    };

    let isOwner = switch (providerOwners.get(caller)) {
      case (null) { false };
      case (?ownerId) { ownerId == id };
    };

    if (not (isOwner or AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only the provider or an admin can toggle status");
    };

    let updatedProvider = {
      provider with
      isLive = not provider.isLive;
      lastVerified = Time.now();
    };

    providers.add(id, updatedProvider);
  };

  // ─────────────────────────────────────────────
  // ADMIN VERIFY PROVIDER
  // ─────────────────────────────────────────────
  public shared ({ caller }) func verifyProvider(id : Text, verified : Bool) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can verify providers");
    };

    let provider = switch (providers.get(id)) {
      case (null) { Runtime.trap("Provider not found") };
      case (?p) { p };
    };

    let updatedProvider = {
      provider with
      isVerified = verified;
    };

    providers.add(id, updatedProvider);
  };

  // ─────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────
  public query func getProvider(id : Text) : async Provider {
    switch (providers.get(id)) {
      case (null) { Runtime.trap("Provider not found") };
      case (?p) { p };
    };
  };

  public query ({ caller }) func getProviders() : async [Provider] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all providers");
    };
    providers.values().toArray().sort();
  };

  public query func getActiveProviders() : async [Provider] {
    providers.values().toArray().sort().filter(
      func(p) { p.isLive and p.isVerified }
    );
  };

  // ─────────────────────────────────────────────
  // CONTACT MESSAGES
  // ─────────────────────────────────────────────
  public func submitContactMessage(name : Text, organization : Text, message : Text) : async () {
    if (name.isEmpty() or organization.isEmpty() or message.isEmpty()) {
      Runtime.trap("All fields are required");
    };
    contactMessageCounter += 1;
    let id = "msg_" # contactMessageCounter.toText();
    let msg : ContactMessage = {
      id;
      name;
      organization;
      message;
      timestamp = Time.now();
    };
    contactMessages.add(id, msg);
  };

  public query ({ caller }) func getContactMessages() : async [ContactMessage] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view contact messages");
    };
    let arr = contactMessages.values().toArray();
    arr.sort(func(a : ContactMessage, b : ContactMessage) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
  };

  public query ({ caller }) func getProviderByPrincipal() : async ?Provider {
    switch (providerOwners.get(caller)) {
      case (null) { null };
      case (?id) { providers.get(id) };
    };
  };
};
