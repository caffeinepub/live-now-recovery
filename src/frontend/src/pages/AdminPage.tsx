import type { BlogPost } from "@/backend.d";
import ImpactPulse from "@/components/ImpactPulse";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ProviderWithCoords } from "@/constants/providers";
import { useActor } from "@/hooks/useActor";
import {
  useAllProvidersAdmin,
  useAllRegisteredUsers,
  useContactMessages,
  useIsAdmin,
  useSmsAuditLog,
  useSystemRiskLevel,
  useTwilioConfigured,
  useUpdateTwilioConfig,
  useVerifyProvider,
} from "@/hooks/useQueries";
import { isProviderStale } from "@/utils/emergency";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  SmartphoneNfc,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── User Registry Panel ────────────────────────────────────────────────────

function UserRegistryPanel() {
  const { data: users = [], isLoading } = useAllRegisteredUsers();

  function roleBadgeClass(role: string) {
    switch (role.toLowerCase()) {
      case "helper":
        return "bg-teal/10 text-teal border border-teal/20";
      case "clinic":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "admin":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  }

  return (
    <div className="mt-10" data-ocid="admin.registry.panel">
      <div className="flex items-center gap-3 mb-5">
        <UserCheck className="h-6 w-6 text-teal" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-extrabold">User Registry</h2>
          <p className="text-muted-foreground text-sm">
            All registered identities. Hashed IDs only — no raw principals
            stored.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div
          className="flex justify-center py-8"
          data-ocid="admin.registry.loading_state"
        >
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      ) : users.length === 0 ? (
        <div
          className="text-center py-10 border border-dashed border-border rounded-xl text-muted-foreground"
          data-ocid="admin.registry.empty_state"
        >
          <UserCheck
            className="h-7 w-7 mx-auto mb-2 opacity-40"
            aria-hidden="true"
          />
          <p className="text-sm">No users registered yet.</p>
        </div>
      ) : (
        <div
          className="rounded-xl border border-border overflow-hidden"
          data-ocid="admin.registry.table"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="font-bold">Hashed Identity</TableHead>
                <TableHead className="font-bold">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, i) => (
                <TableRow
                  key={user.hashedId}
                  data-ocid={`admin.registry.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                    {user.hashedId.slice(0, 20)}…
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleBadgeClass(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── SMS Settings Panel ──────────────────────────────────────────────────────

function SmsSettingsPanel() {
  const { data: isConfigured, isLoading: isLoadingConfigured } =
    useTwilioConfigured();
  const { data: auditLog = [], isLoading: isLoadingLog } = useSmsAuditLog();
  const updateConfig = useUpdateTwilioConfig();

  const [sid, setSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [fromNumber, setFromNumber] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!sid.trim() || !authToken.trim() || !fromNumber.trim()) {
      toast.error("All three fields are required.");
      return;
    }
    try {
      await updateConfig.mutateAsync({
        sid: sid.trim(),
        authToken: authToken.trim(),
        fromNumber: fromNumber.trim(),
      });
      toast.success("SMS configuration saved successfully.");
      setSid("");
      setAuthToken("");
      setFromNumber("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save config.",
      );
    }
  }

  return (
    <div className="mt-10" data-ocid="admin.sms.panel">
      <div className="flex items-center gap-3 mb-5">
        <SmartphoneNfc className="h-6 w-6 text-teal" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-extrabold">SMS Settings</h2>
          <p className="text-muted-foreground text-sm">
            Configure Twilio credentials for Helper device verification.
          </p>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mb-5">
        {isLoadingConfigured ? (
          <div
            className="inline-flex items-center gap-2 text-sm text-muted-foreground"
            data-ocid="admin.sms.loading_state"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Checking configuration...
          </div>
        ) : isConfigured ? (
          <div
            className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-full px-4 py-2 text-sm font-semibold"
            data-ocid="admin.sms.success_state"
          >
            <CheckCircle2
              className="h-4 w-4 text-green-600"
              aria-hidden="true"
            />
            SMS Configured ✓
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-full px-4 py-2 text-sm font-semibold"
            data-ocid="admin.sms.error_state"
          >
            <AlertCircle
              className="h-4 w-4 text-yellow-600"
              aria-hidden="true"
            />
            SMS Not Configured
          </div>
        )}
      </div>

      {/* Config form */}
      <form
        onSubmit={handleSave}
        className="bg-card border border-border rounded-xl p-6 space-y-4 mb-8"
        data-ocid="admin.sms.panel"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="twilio-sid"
              className="text-sm font-semibold flex items-center gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              Twilio Account SID
            </Label>
            <Input
              id="twilio-sid"
              type="text"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={sid}
              onChange={(e) => setSid(e.target.value)}
              autoComplete="off"
              className="font-mono text-sm"
              data-ocid="admin.sms.sid.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="twilio-auth"
              className="text-sm font-semibold flex items-center gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              Auth Token
            </Label>
            <Input
              id="twilio-auth"
              type="password"
              placeholder="••••••••••••••••••••••••••••••••"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              autoComplete="new-password"
              className="font-mono text-sm"
              data-ocid="admin.sms.auth.input"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="twilio-from"
            className="text-sm font-semibold flex items-center gap-1.5"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            From Number (E.164 format)
          </Label>
          <Input
            id="twilio-from"
            type="tel"
            placeholder="+12165551234"
            value={fromNumber}
            onChange={(e) => setFromNumber(e.target.value)}
            className="font-mono text-sm max-w-xs"
            data-ocid="admin.sms.from.input"
          />
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            disabled={updateConfig.isPending}
            className="h-11 px-6 text-white font-bold border-0 shadow"
            style={{ background: "var(--color-teal)" }}
            data-ocid="admin.sms.save.button"
          >
            {updateConfig.isPending ? (
              <Loader2
                className="h-4 w-4 animate-spin mr-2"
                aria-hidden="true"
              />
            ) : (
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            {updateConfig.isPending ? "Saving..." : "Save SMS Config"}
          </Button>
        </div>
      </form>

      {/* Audit log */}
      <div>
        <h3 className="font-bold text-base mb-3 text-foreground">
          SMS Audit Log
        </h3>
        {isLoadingLog ? (
          <div
            className="flex justify-center py-8"
            data-ocid="admin.sms.audit.loading_state"
          >
            <Loader2
              className="h-6 w-6 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        ) : auditLog.length === 0 ? (
          <div
            className="text-center py-10 border border-dashed border-border rounded-xl text-muted-foreground"
            data-ocid="admin.sms.audit.empty_state"
          >
            <SmartphoneNfc
              className="h-7 w-7 mx-auto mb-2 opacity-40"
              aria-hidden="true"
            />
            <p className="text-sm">No SMS events logged yet.</p>
          </div>
        ) : (
          <div
            className="rounded-xl border border-border overflow-hidden"
            data-ocid="admin.sms.audit.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="font-bold">Timestamp</TableHead>
                  <TableHead>ZIP</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((entry, i) => (
                  <TableRow
                    key={`${entry.timestamp}-${i}`}
                    data-ocid={`admin.sms.audit.item.${i + 1}`}
                  >
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(entry.timestamp)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry.zip}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          entry.outcome === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {entry.outcome === "success" ? (
                          <CheckCircle2
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                        ) : (
                          <XCircle className="h-3 w-3" aria-hidden="true" />
                        )}
                        {entry.outcome}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Blog Management Panel ──────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  author: "Dom, Founder",
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatBlogDate(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  if (!ms || ms <= 0) return "Draft";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BlogManagementPanel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["adminBlogPosts"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await (actor as any).getAllBlogPosts();
      } catch {
        return [];
      }
    },
    enabled: !!actor,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof EMPTY_FORM) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).createBlogPost(
        data.title,
        data.slug,
        data.content,
        data.excerpt,
        data.author,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBlogPosts"] });
      queryClient.invalidateQueries({ queryKey: ["publishedBlogPosts"] });
      toast.success("Post created.");
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to create post.",
      ),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: { id: string; data: typeof EMPTY_FORM }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).updateBlogPost(
        id,
        data.title,
        data.content,
        data.excerpt,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBlogPosts"] });
      queryClient.invalidateQueries({ queryKey: ["publishedBlogPosts"] });
      toast.success("Post updated.");
      setShowForm(false);
      setEditingPost(null);
      setForm(EMPTY_FORM);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to update post.",
      ),
  });

  const publishMutation = useMutation({
    mutationFn: async ({
      id,
      published,
    }: { id: string; published: boolean }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).publishBlogPost(id, published);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBlogPosts"] });
      queryClient.invalidateQueries({ queryKey: ["publishedBlogPosts"] });
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle publish.",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).deleteBlogPost(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBlogPosts"] });
      queryClient.invalidateQueries({ queryKey: ["publishedBlogPosts"] });
      toast.success("Post deleted.");
      setDeleteConfirm(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to delete post.",
      ),
  });

  function openNew() {
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(post: BlogPost) {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
    });
    setShowForm(true);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mt-10" data-ocid="admin.blog.panel">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-teal" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-extrabold">Blog Management</h2>
            <p className="text-muted-foreground text-sm">
              Publish and manage Recovery Insights posts.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={openNew}
          className="bg-teal hover:bg-teal-button text-white border-0 gap-1.5"
          data-ocid="admin.blog.open_modal_button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Post
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border p-5 bg-card"
          data-ocid="admin.blog.modal"
        >
          <h3 className="font-bold text-base mb-4">
            {editingPost ? "Edit Post" : "New Post"}
          </h3>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="blog-title">Title</Label>
                <Input
                  id="blog-title"
                  value={form.title}
                  onChange={(e) => {
                    const t = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      title: t,
                      slug: editingPost ? prev.slug : slugify(t),
                    }));
                  }}
                  placeholder="Post title"
                  required
                  data-ocid="admin.blog.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="blog-slug">Slug</Label>
                <Input
                  id="blog-slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="post-url-slug"
                  required
                  data-ocid="admin.blog.slug.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="blog-author">Author</Label>
              <Input
                id="blog-author"
                value={form.author}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, author: e.target.value }))
                }
                placeholder="Author name"
                required
                data-ocid="admin.blog.author.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea
                id="blog-excerpt"
                value={form.excerpt}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, excerpt: e.target.value }))
                }
                placeholder="Short summary shown on the blog index"
                rows={2}
                required
                data-ocid="admin.blog.excerpt.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="blog-content">Content</Label>
              <Textarea
                id="blog-content"
                value={form.content}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Full post content. Use **bold** for bold text. Separate paragraphs with blank lines."
                rows={10}
                required
                data-ocid="admin.blog.content.textarea"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingPost(null);
                  setForm(EMPTY_FORM);
                }}
                data-ocid="admin.blog.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-teal hover:bg-teal-button text-white border-0"
                data-ocid="admin.blog.submit_button"
              >
                {isPending ? (
                  <Loader2
                    className="h-4 w-4 animate-spin mr-2"
                    aria-hidden="true"
                  />
                ) : null}
                {editingPost ? "Save Changes" : "Create Post"}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Post list */}
      {isLoading ? (
        <div
          className="flex justify-center py-10"
          data-ocid="admin.blog.loading_state"
        >
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      ) : posts.length === 0 ? (
        <div
          className="text-center py-12 border border-dashed border-border rounded-xl text-muted-foreground"
          data-ocid="admin.blog.empty_state"
        >
          <BookOpen
            className="h-7 w-7 mx-auto mb-2 opacity-40"
            aria-hidden="true"
          />
          <p className="text-sm">No posts yet. Create one above.</p>
        </div>
      ) : (
        <div
          className="rounded-xl border border-border overflow-hidden"
          data-ocid="admin.blog.table"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="font-bold">Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post, i) => (
                <TableRow key={post.id} data-ocid={`admin.blog.row.${i + 1}`}>
                  <TableCell className="font-semibold max-w-[200px] truncate">
                    {post.title}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {post.author}
                  </TableCell>
                  <TableCell>
                    {post.isPublished ? (
                      <Badge className="bg-teal/10 text-teal border-teal/30 text-xs">
                        Published
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground text-xs"
                      >
                        Draft
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatBlogDate(post.publishedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(post)}
                        className="h-8 px-2"
                        data-ocid={`admin.blog.edit_button.${i + 1}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          publishMutation.mutate({
                            id: post.id,
                            published: !post.isPublished,
                          })
                        }
                        disabled={publishMutation.isPending}
                        className="h-8 px-2"
                        title={post.isPublished ? "Unpublish" : "Publish"}
                        data-ocid={`admin.blog.toggle.${i + 1}`}
                      >
                        {post.isPublished ? (
                          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </Button>
                      {deleteConfirm === post.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(post.id)}
                            disabled={deleteMutation.isPending}
                            className="h-8 px-2 text-xs"
                            data-ocid={`admin.blog.confirm_button.${i + 1}`}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirm(null)}
                            className="h-8 px-2 text-xs"
                            data-ocid={`admin.blog.cancel_button.${i + 1}`}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirm(post.id)}
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          data-ocid={`admin.blog.delete_button.${i + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: isCheckingAdmin } = useIsAdmin();
  const { data: providers = [], isLoading: isLoadingProviders } =
    useAllProvidersAdmin();
  const verifyMutation = useVerifyProvider();
  const { data: riskLevel = "GREEN" } = useSystemRiskLevel();
  const { data: contactMessages = [], isLoading: isLoadingMessages } =
    useContactMessages();

  useEffect(() => {
    if (!isCheckingAdmin && isAdmin === false) {
      navigate({ to: "/" });
    }
  }, [isAdmin, isCheckingAdmin, navigate]);

  async function handleVerify(provider: ProviderWithCoords) {
    try {
      await verifyMutation.mutateAsync({
        id: provider.id,
        verified: !provider.isVerified,
      });
      toast.success(
        provider.isVerified
          ? `${provider.name} has been unverified.`
          : `${provider.name} is now verified!`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    }
  }

  if (isCheckingAdmin) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center"
        data-ocid="admin.loading_state"
      >
        <Loader2
          className="h-10 w-10 animate-spin text-primary"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
        data-ocid="admin.error_state"
      >
        <AlertCircle
          className="h-12 w-12 text-destructive mb-4"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">
          You must be an admin to view this page.
        </p>
      </div>
    );
  }

  return (
    <div
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      data-ocid="admin.panel"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-7 w-7 text-teal" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Review and verify MAT provider listings.
            </p>
          </div>
        </div>

        {riskLevel === "RED" && (
          <div
            className="flex items-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-white font-semibold text-sm mb-4"
            data-ocid="admin.sentinel.error_state"
          >
            <AlertTriangle
              className="h-5 w-5 flex-shrink-0"
              aria-hidden="true"
            />
            <span>
              SENTINEL ALERT: High search demand in a ZIP with zero active
              providers. Immediate attention required.
            </span>
          </div>
        )}

        {isLoadingProviders ? (
          <div
            className="flex justify-center py-16"
            data-ocid="admin.table.loading_state"
          >
            <Loader2
              className="h-8 w-8 animate-spin text-primary"
              aria-hidden="true"
            />
          </div>
        ) : providers.length === 0 ? (
          <div
            className="text-center py-16 text-muted-foreground"
            data-ocid="admin.table.empty_state"
          >
            <p className="font-semibold text-foreground mb-1">
              No providers registered yet.
            </p>
            <p className="text-sm">
              Providers will appear here after they register.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border border-border overflow-hidden shadow-card"
            data-ocid="admin.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="font-bold">Clinic Name</TableHead>
                  <TableHead>ZIP</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Live</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider, i) => {
                  const stale = isProviderStale(provider.lastVerified);
                  const lastMs = Number(provider.lastVerified / 1000000n);
                  const lastDate = new Date(lastMs).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  );

                  return (
                    <TableRow
                      key={provider.id}
                      data-ocid={`admin.row.item.${i + 1}`}
                    >
                      <TableCell className="font-semibold">
                        {provider.name}
                      </TableCell>
                      <TableCell>{provider.zip}</TableCell>
                      <TableCell className="text-sm">
                        {provider.phone}
                      </TableCell>
                      <TableCell>
                        {provider.isLive ? (
                          <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                            <span className="h-2 w-2 rounded-full bg-live" />
                            Live
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Offline
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {provider.isVerified ? (
                          <Badge className="bg-teal/10 text-teal border-teal/30 text-xs">
                            <CheckCircle2
                              className="h-3 w-3 mr-1"
                              aria-hidden="true"
                            />
                            Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground text-xs"
                          >
                            <XCircle
                              className="h-3 w-3 mr-1"
                              aria-hidden="true"
                            />
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm ${
                            stale
                              ? "text-yellow-600 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {stale ? "\u26a0 " : ""}
                          {lastDate}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={provider.isVerified ? "outline" : "default"}
                          onClick={() => handleVerify(provider)}
                          disabled={verifyMutation.isPending}
                          className={
                            provider.isVerified
                              ? ""
                              : "bg-teal hover:bg-teal-button text-white border-0"
                          }
                          data-ocid={`admin.verify.button.${i + 1}`}
                        >
                          {verifyMutation.isPending ? (
                            <Loader2
                              className="h-3.5 w-3.5 animate-spin"
                              aria-hidden="true"
                            />
                          ) : provider.isVerified ? (
                            "Unverify"
                          ) : (
                            "Verify"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ── Impact Pulse — Proof of Presence live map ── */}
        <div className="mt-8">
          <ImpactPulse />
        </div>

        {/* ── User Registry ── */}
        <UserRegistryPanel />

        {/* ── SMS Settings ── */}
        <SmsSettingsPanel />

        {/* ── Contact Messages ── */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <MessageSquare className="h-6 w-6 text-teal" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-extrabold">Contact Messages</h2>
              <p className="text-muted-foreground text-sm">
                Partner inquiries submitted via the Contact page.
              </p>
            </div>
          </div>

          {isLoadingMessages ? (
            <div
              className="flex justify-center py-10"
              data-ocid="admin.contact.loading_state"
            >
              <Loader2
                className="h-7 w-7 animate-spin text-primary"
                aria-hidden="true"
              />
            </div>
          ) : contactMessages.length === 0 ? (
            <div
              className="text-center py-12 border border-dashed border-border rounded-xl text-muted-foreground"
              data-ocid="admin.contact.empty_state"
            >
              <Mail
                className="h-8 w-8 mx-auto mb-3 opacity-40"
                aria-hidden="true"
              />
              <p className="font-medium text-foreground mb-1">
                No messages yet.
              </p>
              <p className="text-sm">
                Partner inquiries will appear here after submission.
              </p>
            </div>
          ) : (
            <div className="space-y-4" data-ocid="admin.contact.list">
              {contactMessages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl p-5"
                  data-ocid={`admin.contact.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal/10 rounded-lg p-2">
                        <Building2
                          className="h-4 w-4 text-teal"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{msg.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {msg.organization}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatTimestamp(msg.timestamp)}
                    </p>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-lg px-4 py-3">
                    {msg.message}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        {/* ── Blog Management ── */}
        <BlogManagementPanel />
      </motion.div>
    </div>
  );
}
