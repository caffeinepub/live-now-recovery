import Text "mo:core/Text";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Buffer "mo:base/Buffer";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import Int "mo:core/Int";
import Nat8 "mo:base/Nat8";
import Nat64 "mo:core/Nat64";
import Timer "mo:base/Timer";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import IC "ic:aaaaa-aa";

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

  public type HandoffStatus = { #Pending; #Completed };

  public type Handoff = {
    id : Text;
    volHash : Text;
    zip : Text;
    timestamp : Int;
    status : HandoffStatus;
  };

  public type HandoffStats = {
    total : Nat;
    recent : Nat;
  };

  public type CompleteHandoffResult = { #ok; #err : Text };

  public type ContactMessage = {
    id : Text;
    name : Text;
    organization : Text;
    message : Text;
    timestamp : Int;
  };

  public type HelperStatus = { #Active; #Offline };

  public type Helper = {
    id : Text;
    status : HelperStatus;
    assignedZip : Text;
    lastCheckIn : Int;
  };

  public type SystemConfig = {
    sid : Text;
    authToken : Text;
    fromNumber : Text;
  };

  public type AuditLogEntry = {
    timestamp : Int;
    zip : Text;
    outcome : Text;
  };

  // RBAC types
  public type UserRole = { #User; #Helper; #Clinic; #Admin };

  public type RoleProfile = {
    alias : Text;
    zip : Text;
    role : UserRole;
    registeredAt : Int;
  };

  public type RegistryEntry = {
    hashedId : Text;
    role : Text;
  };

  // Blog types
  public type BlogPost = {
    id : Text;
    title : Text;
    slug : Text;
    content : Text;
    excerpt : Text;
    publishedAt : Int;
    isPublished : Bool;
    author : Text;
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
  let contactMessages = Map.empty<Text, ContactMessage>();
  var contactMessageCounter : Nat = 0;
  let searchVolume = Map.empty<Text, Nat>();
  var systemRiskLevel : Text = "GREEN";
  var providerIdCounter = 0;
  let handoffs = Map.empty<Text, Handoff>();
  var handoffCounter : Nat = 0;
  let helpers = Map.empty<Text, Helper>();

  // Twilio config + audit log
  var twilioConfig : ?SystemConfig = null;
  var smsAuditLog : [AuditLogEntry] = [];

  // RBAC registry
  let registry = Map.empty<Principal, RoleProfile>();

  // Blog posts
  let blogPosts = Map.empty<Text, BlogPost>();
  var blogPostCounter : Nat = 0;

  // ─────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────
  let FOUR_HOURS_NS : Int = 14_400_000_000_000;
  let FIVE_MINUTES_NS : Int = 300_000_000_000;
  let TWENTY_FOUR_HOURS_NS : Int = 86_400_000_000_000;
  let SEARCH_DEMAND_THRESHOLD : Nat = 100;

  // ─────────────────────────────────────────────
  // UTILITY HELPERS
  // ─────────────────────────────────────────────
  func getUniqueProviderId() : Text {
    providerIdCounter += 1;
    providerIdCounter.toText();
  };

  func hashPrincipal(p : Principal) : Text {
    let blob = p.toBlob();
    var h : Nat = 5381;
    for (b in blob.vals()) {
      h := (h * 33 + Nat8.toNat(b)) % 999_999_937;
    };
    "vh_" # h.toText();
  };

  func countLiveHelpersForZip(zip : Text) : Nat {
    let now = Time.now();
    var count : Nat = 0;
    for (helper in helpers.values()) {
      switch (helper.status) {
        case (#Active) {
          if (helper.assignedZip == zip and (now - helper.lastCheckIn) <= FOUR_HOURS_NS) {
            count += 1;
          };
        };
        case (#Offline) {};
      };
    };
    count;
  };

  func roleToText(role : UserRole) : Text {
    switch (role) {
      case (#User) { "User" };
      case (#Helper) { "Helper" };
      case (#Clinic) { "Clinic" };
      case (#Admin) { "Admin" };
    };
  };

  // RBAC guards
  func isRegisteredHelper(caller : Principal) : Bool {
    switch (registry.get(caller)) {
      case (?p) {
        switch (p.role) {
          case (#Helper) { true };
          case (_) { false };
        };
      };
      case (null) { false };
    };
  };

  func isRegisteredClinic(caller : Principal) : Bool {
    switch (registry.get(caller)) {
      case (?p) {
        switch (p.role) {
          case (#Clinic) { true };
          case (_) { false };
        };
      };
      case (null) { false };
    };
  };

  // Base64 alphabet
  let BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  func base64Encode(input : Text) : Text {
    let bytes = input.encodeUtf8().toArray();
    let buf = Buffer.Buffer<Char>(bytes.size() * 4 / 3 + 4);
    var i = 0;
    let n = bytes.size();
    let chars = BASE64_CHARS.toArray();
    while (i < n) {
      let b0 = Nat8.toNat(bytes[i]);
      let b1 = if (i + 1 < n) Nat8.toNat(bytes[i + 1]) else 0;
      let b2 = if (i + 2 < n) Nat8.toNat(bytes[i + 2]) else 0;
      buf.add(chars[b0 / 4]);
      buf.add(chars[(b0 % 4) * 16 + b1 / 16]);
      buf.add(if (i + 1 < n) chars[(b1 % 16) * 4 + b2 / 64] else '=');
      buf.add(if (i + 2 < n) chars[b2 % 64] else '=');
      i += 3;
    };
    Text.fromArray(Buffer.toArray(buf));
  };

  func urlEncodeChar(c : Char) : Text {
    let code = c.toNat32().toNat();
    if ((code >= 65 and code <= 90) or
        (code >= 97 and code <= 122) or
        (code >= 48 and code <= 57) or
        code == 45 or code == 95 or code == 46 or code == 126) {
      Text.fromChar(c)
    } else if (code == 32) {
      "+"
    } else {
      let hex = "0123456789ABCDEF";
      let hexChars = hex.toArray();
      "%" # Text.fromChar(hexChars[code / 16]) # Text.fromChar(hexChars[code % 16])
    }
  };

  func urlEncode(s : Text) : Text {
    var result = "";
    for (c in s.toArray().vals()) {
      result #= urlEncodeChar(c);
    };
    result;
  };

  func formatE164(phone : Text) : ?Text {
    let digitBuf = Buffer.Buffer<Char>(12);
    for (c in phone.toArray().vals()) {
      let code = c.toNat32().toNat();
      if (code >= 48 and code <= 57) {
        digitBuf.add(c);
      };
    };
    let digits = Buffer.toArray(digitBuf);
    let n = digits.size();
    if (n == 10) {
      ?("+1" # Text.fromArray(digits))
    } else if (n == 11 and digits[0] == '1') {
      let rest = Buffer.Buffer<Char>(10);
      var j = 1;
      while (j < 11) {
        rest.add(digits[j]);
        j += 1;
      };
      ?("+1" # Text.fromArray(Buffer.toArray(rest)))
    } else {
      null
    }
  };

  // ─────────────────────────────────────────────
  // SENTINEL AGENT
  // ─────────────────────────────────────────────
  func sentinelHeartbeat() : async () {
    let now = Time.now();
    for (provider in providers.values()) {
      if (provider.isLive and (now - provider.lastVerified) > FOUR_HOURS_NS) {
        providers.add(provider.id, { provider with isLive = false });
      };
    };
    var riskDetected = false;
    for ((zip, volume) in searchVolume.entries()) {
      if (volume > SEARCH_DEMAND_THRESHOLD) {
        var activeCount : Nat = 0;
        for (p in providers.values()) {
          if (p.zip == zip and p.isLive and p.isVerified) { activeCount += 1; };
        };
        if (activeCount == 0) { riskDetected := true; };
      };
    };
    systemRiskLevel := if (riskDetected) { "RED" } else { "GREEN" };
  };

  ignore Timer.recurringTimer<system>(#seconds(300), sentinelHeartbeat);

  // ─────────────────────────────────────────────
  // RBAC — REGISTRY
  // ─────────────────────────────────────────────

  public shared ({ caller }) func registerRole(role : UserRole, alias : Text, zip : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Authentication required to register");
    };
    switch (role) {
      case (#Admin) { Runtime.trap("Admin role cannot be self-assigned"); };
      case (_) {};
    };
    switch (registry.get(caller)) {
      case (?_) { Runtime.trap("Already registered. One role per identity."); };
      case (null) {};
    };
    if (alias.isEmpty()) { Runtime.trap("Alias is required"); };
    if (zip.isEmpty()) { Runtime.trap("ZIP code is required"); };
    registry.add(caller, { alias; zip; role; registeredAt = Time.now() });
  };

  public query ({ caller }) func getMyRole() : async ?UserRole {
    if (caller.isAnonymous()) { return null; };
    // Admin check via AccessControl takes precedence
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return ?#Admin;
    };
    switch (registry.get(caller)) {
      case (?p) { ?p.role };
      case (null) { null };
    };
  };

  public query ({ caller }) func getMyRoleProfile() : async ?RoleProfile {
    if (caller.isAnonymous()) { return null; };
    registry.get(caller);
  };

  public query ({ caller }) func getAllRegisteredUsers() : async [RegistryEntry] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view the registry");
    };
    let buf = Buffer.Buffer<RegistryEntry>(0);
    for ((principal, profile) in registry.entries()) {
      buf.add({ hashedId = hashPrincipal(principal); role = roleToText(profile.role) });
    };
    Buffer.toArray(buf);
  };

  // ─────────────────────────────────────────────
  // CLINIC — NALOXONE & AVAILABILITY
  // ─────────────────────────────────────────────

  public type NaloxoneStock = { #Available; #LimitedStock; #OutOfStock };

  public type ImpactData = {
    zip : Text;
    savingsPot : Float;
    livesProjected : Float;
    helperCount : Nat;
    searchIntents : Nat;
  };


  public type ClinicStatus = {
    naloxone : NaloxoneStock;
    acceptingPatients : Bool;
    updatedAt : Int;
  };

  let clinicStatuses = Map.empty<Text, ClinicStatus>();

  public shared ({ caller }) func updateClinicStatus(naloxone : NaloxoneStock, acceptingPatients : Bool) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Authentication required"); };
    if (not isRegisteredClinic(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Only registered clinics can update status");
    };
    let providerId = switch (providerOwners.get(caller)) {
      case (null) { Runtime.trap("No provider registered for this account") };
      case (?id) { id };
    };
    clinicStatuses.add(providerId, { naloxone; acceptingPatients; updatedAt = Time.now() });
  };

  public query func getClinicStatus(providerId : Text) : async ?ClinicStatus {
    clinicStatuses.get(providerId);
  };

  // ─────────────────────────────────────────────
  // TWILIO SMS
  // ─────────────────────────────────────────────

  public shared ({ caller }) func updateTwilioConfig(sid : Text, authToken : Text, fromNumber : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update Twilio config");
    };
    if (sid.isEmpty() or authToken.isEmpty() or fromNumber.isEmpty()) {
      Runtime.trap("All Twilio config fields are required");
    };
    twilioConfig := ?{ sid; authToken; fromNumber };
  };

  public query ({ caller }) func getTwilioConfigured() : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (twilioConfig) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public shared ({ caller }) func sendVerificationSMS(targetPhone : Text, callerZip : Text) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Authentication required");
    };
    if (not isRegisteredHelper(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Only registered Helpers can send verification SMS");
    };
    let config = switch (twilioConfig) {
      case (null) { Runtime.trap("SMS not configured. Ask admin to set Twilio credentials.") };
      case (?c) { c };
    };
    let e164 = switch (formatE164(targetPhone)) {
      case (null) { Runtime.trap("Invalid US phone number. Use format: 216-555-1212") };
      case (?n) { n };
    };
    let msgBody = "LIVE NOW: Your device is now synced to the Recovery Bridge. 10-years in the program and building. We have your back.";
    let url = "https://api.twilio.com/2010-04-01/Accounts/" # config.sid # "/Messages.json";
    let authString = base64Encode(config.sid # ":" # config.authToken);
    let bodyStr = "From=" # urlEncode(config.fromNumber) # "&To=" # urlEncode(e164) # "&Body=" # urlEncode(msgBody);
    let bodyBlob = bodyStr.encodeUtf8();

    let request : IC.http_request_args = {
      url;
      max_response_bytes = ?(2000 : Nat64);
      method = #post;
      headers = [
        { name = "Content-Type"; value = "application/x-www-form-urlencoded" },
        { name = "Authorization"; value = "Basic " # authString },
      ];
      body = ?bodyBlob;
      transform = null;
      is_replicated = null;
    };

    var outcome = "success";
    try {
      let response = await IC.http_request(request);
      if (response.status < 200 or response.status >= 300) {
        outcome := "error_" # response.status.toText();
      };
    } catch (_) {
      outcome := "error_outcall_failed";
    };

    let entry : AuditLogEntry = {
      timestamp = Time.now();
      zip = callerZip;
      outcome;
    };
    let logBuf = Buffer.Buffer<AuditLogEntry>(smsAuditLog.size() + 1);
    for (e in smsAuditLog.vals()) { logBuf.add(e); };
    logBuf.add(entry);
    smsAuditLog := Buffer.toArray(logBuf);

    outcome;
  };

  public query ({ caller }) func getSmsAuditLog() : async [AuditLogEntry] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view the SMS audit log");
    };
    smsAuditLog;
  };

  // ─────────────────────────────────────────────
  // COMMUNITY HELPER FUNCTIONS (NO-PHI)
  // ─────────────────────────────────────────────

  public shared ({ caller }) func claimArea(zip : Text) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Authentication required to claim an area"); };
    if (not isRegisteredHelper(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Only registered Helpers can claim an area");
    };
    if (zip.isEmpty()) { Runtime.trap("ZIP code is required"); };
    helpers.add(hashPrincipal(caller), { id = hashPrincipal(caller); status = #Active; assignedZip = zip; lastCheckIn = Time.now() });
  };

  public shared ({ caller }) func checkOutArea() : async () {
    if (caller.isAnonymous()) { Runtime.trap("Authentication required"); };
    let id = hashPrincipal(caller);
    switch (helpers.get(id)) {
      case (null) {};
      case (?h) { helpers.add(id, { h with status = #Offline }); };
    };
  };

  public query func getLiveHelpers(zip : Text) : async Nat {
    countLiveHelpersForZip(zip);
  };

  public query ({ caller }) func getHelperStatus() : async ?Helper {
    if (caller.isAnonymous()) { return null; };
    helpers.get(hashPrincipal(caller));
  };

  public query func getHighRiskAreas() : async [Text] {
    let now = Time.now();
    let buf = Buffer.Buffer<Text>(0);
    for ((zip, volume) in searchVolume.entries()) {
      if (volume > SEARCH_DEMAND_THRESHOLD) {
        var helperCount : Nat = 0;
        for (helper in helpers.values()) {
          switch (helper.status) {
            case (#Active) {
              if (helper.assignedZip == zip and (now - helper.lastCheckIn) <= FOUR_HOURS_NS) {
                helperCount += 1;
              };
            };
            case (#Offline) {};
          };
        };
        if (helperCount == 0) { buf.add(zip); };
      };
    };
    Buffer.toArray(buf);
  };

  public query func getActiveHelperZips() : async [Text] {
    let now = Time.now();
    let zipSet = Map.empty<Text, Bool>();
    for (helper in helpers.values()) {
      switch (helper.status) {
        case (#Active) {
          if ((now - helper.lastCheckIn) <= FOUR_HOURS_NS) {
            zipSet.add(helper.assignedZip, true);
          };
        };
        case (#Offline) {};
      };
    };
    zipSet.keys().toArray();
  };

  // ─────────────────────────────────────────────
  // SEARCH INTENT (anonymous ZIP tracking)
  // ─────────────────────────────────────────────
  public func recordSearchIntent(zip : Text) : async () {
    if (zip.isEmpty()) return;
    let current = switch (searchVolume.get(zip)) {
      case (null) { 0 };
      case (?v) { v };
    };
    searchVolume.add(zip, current + 1);
  };

  public query func getSystemRiskLevel() : async Text { systemRiskLevel };

  // ─────────────────────────────────────────────
  // PROOF OF PRESENCE — HANDOFF SYSTEM
  // ─────────────────────────────────────────────
  public shared ({ caller }) func requestHandoff(zip : Text) : async Text {
    if (caller.isAnonymous()) { Runtime.trap("Authentication required to generate a handoff token"); };
    if (zip.isEmpty()) { Runtime.trap("ZIP code is required"); };
    let now = Time.now();
    handoffCounter += 1;
    let token = "pop_" # handoffCounter.toText() # "_" # now.toText();
    let handoff : Handoff = {
      id = token;
      volHash = hashPrincipal(caller);
      zip;
      timestamp = now;
      status = #Pending;
    };
    handoffs.add(token, handoff);
    token;
  };

  public func completeHandoff(token : Text) : async CompleteHandoffResult {
    switch (handoffs.get(token)) {
      case (null) { #err("not_found") };
      case (?h) {
        switch (h.status) {
          case (#Completed) { #err("already_completed") };
          case (#Pending) {
            if ((Time.now() - h.timestamp) > FIVE_MINUTES_NS) { return #err("expired"); };
            handoffs.add(token, { h with status = #Completed });
            #ok;
          };
        };
      };
    };
  };

  public query func getHandoffStatus(token : Text) : async ?Handoff { handoffs.get(token) };

  public query func getHandoffStats() : async HandoffStats {
    let now = Time.now();
    var total : Nat = 0;
    var recent : Nat = 0;
    for (h in handoffs.values()) {
      switch (h.status) {
        case (#Completed) {
          total += 1;
          if ((now - h.timestamp) <= TWENTY_FOUR_HOURS_NS) { recent += 1; };
        };
        case (_) {};
      };
    };
    { total; recent };
  };

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
  // PROVIDER REGISTRATION & MANAGEMENT
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
    providers.add(id, { id; name = input.name; address = input.address; zip = input.zip; phone = input.phone; isLive = false; isVerified = false; lastVerified = Time.now() });
    providerOwners.add(caller, id);
    id;
  };

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
    providers.add(id, { provider with isLive = not provider.isLive; lastVerified = Time.now() });
  };

  public shared ({ caller }) func verifyProvider(id : Text, verified : Bool) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can verify providers");
    };
    let provider = switch (providers.get(id)) {
      case (null) { Runtime.trap("Provider not found") };
      case (?p) { p };
    };
    providers.add(id, { provider with isVerified = verified });
  };

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
    providers.values().toArray().sort().filter(func(p) { p.isLive and p.isVerified });
  };

  public query ({ caller }) func getProviderByPrincipal() : async ?Provider {
    switch (providerOwners.get(caller)) {
      case (null) { null };
      case (?id) { providers.get(id) };
    };
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
    contactMessages.add(id, { id; name; organization; message; timestamp = Time.now() });
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

  // ─────────────────────────────────────────────
  // IMPACT SHADOW DATA
  // ─────────────────────────────────────────────

  func getZipPopulation(zip : Text) : Nat {
    switch zip {
      case "44101" { 18000 };
      case "44102" { 22000 };
      case "44103" { 25000 };
      case "44104" { 20000 };
      case "44105" { 28000 };
      case "44106" { 30000 };
      case "44107" { 24000 };
      case "44108" { 26000 };
      case "44109" { 23000 };
      case "44110" { 19000 };
      case "44111" { 27000 };
      case "44112" { 21000 };
      case "44113" { 35000 };
      case "44114" { 16000 };
      case "44115" { 20000 };
      case "44120" { 29000 };
      case "44128" { 22000 };
      case "44130" { 31000 };
      case "44135" { 25000 };
      case "44139" { 18000 };
      case "44143" { 20000 };
      case "44146" { 17000 };
      case _ { 15000 };
    };
  };

  public query func getImpactData(zip : Text) : async ImpactData {
    let intents = switch (searchVolume.get(zip)) {
      case (null) { 0 };
      case (?v) { v };
    };
    let pop = getZipPopulation(zip);
    let savingsPot = intents.toFloat() * 120.0;
    let livesProjected = (pop.toFloat() / 500.0) * 0.088;
    let helperCount = countLiveHelpersForZip(zip);
    { zip; savingsPot; livesProjected; helperCount; searchIntents = intents };
  };

  public query func getAllZipImpactData() : async [ImpactData] {
    let knownZips = ["44101","44102","44103","44104","44105","44106","44107","44108","44109","44110","44111","44112","44113","44114","44115","44120","44128","44130","44135","44139","44143","44146"];
    knownZips.map(func(zip) {
      let intents = switch (searchVolume.get(zip)) {
        case (null) { 0 };
        case (?v) { v };
      };
      let pop = getZipPopulation(zip);
      let savingsPot = intents.toFloat() * 120.0;
      let livesProjected = (pop.toFloat() / 500.0) * 0.088;
      let helperCount = countLiveHelpersForZip(zip);
      { zip; savingsPot; livesProjected; helperCount; searchIntents = intents };
    });
  };

  // ─────────────────────────────────────────────
  // BLOG SYSTEM
  // ─────────────────────────────────────────────

  public shared ({ caller }) func createBlogPost(title : Text, slug : Text, content : Text, excerpt : Text, author : Text) : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create blog posts");
    };
    if (title.isEmpty() or slug.isEmpty() or content.isEmpty()) {
      Runtime.trap("Title, slug, and content are required");
    };
    blogPostCounter += 1;
    let id = "blog_" # blogPostCounter.toText();
    blogPosts.add(id, { id; title; slug; content; excerpt; publishedAt = 0; isPublished = false; author });
    id;
  };

  public shared ({ caller }) func updateBlogPost(id : Text, title : Text, content : Text, excerpt : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update blog posts");
    };
    let post = switch (blogPosts.get(id)) {
      case (null) { Runtime.trap("Blog post not found") };
      case (?p) { p };
    };
    blogPosts.add(id, { post with title; content; excerpt });
  };

  public shared ({ caller }) func publishBlogPost(id : Text, published : Bool) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can publish blog posts");
    };
    let post = switch (blogPosts.get(id)) {
      case (null) { Runtime.trap("Blog post not found") };
      case (?p) { p };
    };
    let publishedAt = if (published and post.publishedAt == 0) { Time.now() } else { post.publishedAt };
    blogPosts.add(id, { post with isPublished = published; publishedAt });
  };

  public shared ({ caller }) func deleteBlogPost(id : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete blog posts");
    };
    ignore blogPosts.remove(id);
  };

  public query func getBlogPost(slug : Text) : async ?BlogPost {
    for (post in blogPosts.values()) {
      if (post.slug == slug and post.isPublished) { return ?post; };
    };
    null;
  };

  public query func getPublishedBlogPosts() : async [BlogPost] {
    let published = blogPosts.values().toArray().filter(func(p : BlogPost) : Bool { p.isPublished });
    published.sort(func(a : BlogPost, b : BlogPost) : Order.Order { Int.compare(b.publishedAt, a.publishedAt) });
  };

  public query ({ caller }) func getAllBlogPosts() : async [BlogPost] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all blog posts");
    };
    blogPosts.values().toArray();
  };

};
