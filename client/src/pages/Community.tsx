import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  ChevronDown,
  Flag,
  Globe2,
  Lightbulb,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  ShieldAlert,
  Target,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

const categories = [
  { value: "all", label: "All discussions", icon: UsersRound },
  { value: "trade_ideas", label: "Trade Ideas", icon: Lightbulb },
  { value: "execution_review", label: "Execution Review", icon: Target },
  { value: "psychology", label: "Psychology", icon: Brain },
  { value: "market_context", label: "Market Context", icon: Globe2 },
] as const;

const categoryMeta = Object.fromEntries(categories.slice(1).map(category => [category.value, category]));

function formatTime(value: Date | string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Community() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]["value"]>("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]["value"]>("trade_ideas");
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [reportingPostId, setReportingPostId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");

  const { data: posts = [], isLoading, isFetching } = trpc.community.list.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const isModerator = user?.role === "admin";
  const { data: openReports = [] } = trpc.community.moderation.listOpenReports.useQuery(undefined, {
    enabled: isModerator,
  });

  const createPost = trpc.community.createPost.useMutation({
    onSuccess: () => {
      setTitle("");
      setBody("");
      setCategory("trade_ideas");
      setComposerOpen(false);
      void utils.community.list.invalidate();
      toast.success("Discussion published to Trader’s Room.");
    },
    onError: error => toast.error(error.message),
  });

  const addComment = trpc.community.addComment.useMutation({
    onSuccess: (_, variables) => {
      setCommentDrafts(current => ({ ...current, [variables.postId]: "" }));
      setExpandedComments(current => ({ ...current, [variables.postId]: true }));
      void utils.community.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const reportPost = trpc.community.reportPost.useMutation({
    onSuccess: result => {
      toast.success(result.alreadyReported ? "You have already reported this discussion." : "Report sent to moderation.");
      setReportingPostId(null);
      setReportReason("");
    },
    onError: error => toast.error(error.message),
  });

  const removePost = trpc.community.removePost.useMutation({
    onSuccess: () => {
      void utils.community.list.invalidate();
      toast.success("Discussion removed.");
    },
    onError: error => toast.error(error.message),
  });

  const resolveReport = trpc.community.moderation.resolveReport.useMutation({
    onSuccess: () => {
      void utils.community.list.invalidate();
      void utils.community.moderation.listOpenReports.invalidate();
      toast.success("Moderation action completed.");
    },
    onError: error => toast.error(error.message),
  });

  const visiblePosts = useMemo(
    () => (activeCategory === "all" ? posts : posts.filter(post => post.category === activeCategory)),
    [activeCategory, posts]
  );

  const submitPost = (event: FormEvent) => {
    event.preventDefault();
    if (category === "all") return;
    createPost.mutate({ category, title, body });
  };

  const submitComment = (event: FormEvent, postId: number) => {
    event.preventDefault();
    const draft = commentDrafts[postId]?.trim();
    if (!draft) return;
    addComment.mutate({ postId, body: draft });
  };

  return (
    <div className="min-h-full bg-[#07101f] text-white">
      <section className="border-b border-blue-200/[0.08] bg-[radial-gradient(circle_at_75%_0%,oklch(0.54_0.16_250_/_0.16),transparent_28rem)] px-5 py-9 sm:px-7 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-300/[0.18] bg-blue-400/[0.10] shadow-[0_8px_22px_oklch(0.45_0.18_250_/_0.18)]"><UsersRound className="h-5 w-5 text-[oklch(0.70_0.16_250)]" /></div><div><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[oklch(0.70_0.16_250)]">Member discussion space</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Trader’s Room</h1></div></div>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-400">Discuss trade ideas, execution, psychology, and market context with authenticated Trade Fusion members.</p>
            </div>
            <Button onClick={() => setComposerOpen(true)} className="h-11 rounded-xl bg-[oklch(0.66_0.18_250)] px-4 text-white shadow-[0_10px_24px_oklch(0.45_0.18_250_/_0.30)] hover:bg-[oklch(0.72_0.18_250)]"><Plus className="mr-2 h-4 w-4" /> Start a discussion</Button>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {categories.map(item => {
              const Icon = item.icon;
              const selected = activeCategory === item.value;
              return <button key={item.value} onClick={() => setActiveCategory(item.value)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${selected ? "border-blue-300/[0.18] bg-blue-400/[0.13] text-white" : "border-white/[0.08] bg-white/[0.025] text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>;
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-7 sm:px-7 lg:px-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/[0.14] bg-amber-300/[0.06] px-4 py-3 text-xs text-amber-100/80"><span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-300" /> Educational discussion only—not financial advice. Never share private account or personal information.</span><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-amber-200/70">Member content</span></div>
        {isModerator && openReports.length > 0 && <Card className="mb-5 border-red-300/[0.16] bg-red-400/[0.05] p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-300" /><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-red-200">Moderator queue · {openReports.length} open</p></div><span className="text-xs text-red-100/60">Only visible to the project owner</span></div><div className="space-y-2">{openReports.map(report => <div key={report.id} className="flex flex-col gap-3 rounded-xl border border-red-200/[0.10] bg-[#0a1427]/80 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-slate-200">{report.postTitle}</p><p className="mt-1 text-xs text-slate-500">Reported by {report.reporterName || "Trader"} · {report.reason}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" disabled={resolveReport.isPending} onClick={() => resolveReport.mutate({ reportId: report.id, action: "dismiss" })} className="border-white/[0.10] text-slate-300 hover:bg-white/[0.06]">Dismiss</Button><Button size="sm" disabled={resolveReport.isPending} onClick={() => resolveReport.mutate({ reportId: report.id, action: "remove_post" })} className="bg-red-500 text-white hover:bg-red-400">Remove post</Button></div></div>)}</div></Card>}
        <div className="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600"><span>{visiblePosts.length} {visiblePosts.length === 1 ? "discussion" : "discussions"}</span><span className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${isFetching ? "bg-amber-300" : "bg-blue-400"}`} /> Refreshes every 60s</span></div>

        {isLoading ? <Card className="border-blue-200/[0.10] bg-gradient-to-b from-[#152647] to-[#101c33] p-0">{[0, 1, 2].map(row => <div key={row} className="border-b border-white/[0.05] p-6 last:border-0"><div className="h-3 w-24 rounded-full bg-blue-200/[0.08]" /><div className="mt-4 h-5 w-2/3 rounded-full bg-white/[0.08]" /><div className="mt-3 h-3 w-full rounded-full bg-white/[0.05]" /></div>)}</Card> : visiblePosts.length === 0 ? <Card className="border-blue-200/[0.10] bg-gradient-to-b from-[#152647] to-[#101c33] p-10 text-center"><MessageCircle className="mx-auto h-7 w-7 text-blue-300" /><h2 className="mt-4 text-lg font-semibold text-white">Start the first discussion</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Share a market observation, an execution lesson, or a question for the room. Your private journal is not shared automatically.</p><Button onClick={() => setComposerOpen(true)} className="mt-6 bg-[oklch(0.66_0.18_250)] text-white hover:bg-[oklch(0.72_0.18_250)]">Create discussion</Button></Card> : <div className="space-y-4">{visiblePosts.map(post => {
          const meta = categoryMeta[post.category];
          const Icon = meta.icon;
          const commentsOpen = expandedComments[post.id];
          const canRemove = post.isOwner || user?.role === "admin";
          return <article key={post.id} className="overflow-hidden rounded-2xl border border-blue-200/[0.10] bg-gradient-to-b from-[#152647] to-[#101c33] shadow-[0_14px_30px_rgba(1,8,24,0.18)]"><div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em]"><span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/[0.12] bg-blue-400/[0.07] px-2 py-1 text-blue-200"><Icon className="h-3 w-3" />{meta.label}</span><span className="text-slate-600">{formatTime(post.createdAt)}</span></div><h2 className="text-lg font-semibold tracking-[-0.025em] text-white sm:text-xl">{post.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">{post.body}</p></div><button onClick={() => setReportingPostId(reportingPostId === post.id ? null : post.id)} className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-300" aria-label="Report discussion"><MoreHorizontal className="h-4 w-4" /></button></div><div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4 text-xs"><span className="font-medium text-slate-300">{post.authorName}</span><span className="text-slate-600">{post.comments.length} {post.comments.length === 1 ? "reply" : "replies"}</span><button onClick={() => setExpandedComments(current => ({ ...current, [post.id]: !commentsOpen }))} className="inline-flex items-center gap-1.5 text-blue-300 hover:text-blue-200"><MessageCircle className="h-3.5 w-3.5" />{commentsOpen ? "Hide replies" : "Reply"}</button>{canRemove && <button onClick={() => removePost.mutate({ postId: post.id })} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" />Remove</button>}</div>
          {reportingPostId === post.id && <form onSubmit={event => { event.preventDefault(); reportPost.mutate({ postId: post.id, reason: reportReason }); }} className="mt-4 rounded-xl border border-amber-300/[0.13] bg-amber-300/[0.04] p-3"><div className="flex gap-3"><Flag className="mt-1 h-4 w-4 shrink-0 text-amber-300" /><div className="min-w-0 flex-1"><label className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber-200/70">Report to moderation</label><input value={reportReason} onChange={event => setReportReason(event.target.value)} required minLength={4} maxLength={500} placeholder="Briefly explain the issue" className="mt-2 h-9 w-full rounded-lg border border-amber-300/[0.16] bg-[#0a1427] px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-amber-300/50" /></div><Button type="submit" size="sm" disabled={reportPost.isPending} className="self-end bg-amber-300 text-slate-950 hover:bg-amber-200">Send</Button></div></form>}
          {commentsOpen && <div className="mt-5 border-t border-white/[0.06] pt-4"><div className="space-y-3">{post.comments.map(comment => <div key={comment.id} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-slate-300">{comment.authorName}</span><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">{formatTime(comment.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{comment.body}</p></div>)}</div><form onSubmit={event => submitComment(event, post.id)} className="mt-4 flex gap-2"><input value={commentDrafts[post.id] ?? ""} onChange={event => setCommentDrafts(current => ({ ...current, [post.id]: event.target.value }))} maxLength={2000} placeholder="Add a constructive reply" className="h-10 min-w-0 flex-1 rounded-xl border border-blue-200/[0.10] bg-[#0a1427] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-blue-300/50" /><Button type="submit" size="icon" disabled={addComment.isPending || !(commentDrafts[post.id] ?? "").trim()} className="h-10 w-10 rounded-xl bg-blue-500 text-white hover:bg-blue-400"><Send className="h-4 w-4" /></Button></form></div>}
          </div></article>;
        })}</div>}
      </section>

      <AnimatePresence>{composerOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-[#040914]/80 p-4 backdrop-blur-sm"><motion.form initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }} onSubmit={submitPost} className="w-full max-w-2xl overflow-hidden rounded-2xl border border-blue-200/[0.16] bg-[#0d1b33] shadow-2xl"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-blue-300">Trader’s Room</p><h2 className="mt-1 text-lg font-semibold text-white">Start a discussion</h2></div><button type="button" onClick={() => setComposerOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-white" aria-label="Close composer"><X className="h-4 w-4" /></button></div><div className="space-y-4 p-5"><div className="rounded-xl border border-amber-300/[0.14] bg-amber-300/[0.06] px-3 py-2.5 text-xs leading-5 text-amber-100/80">Educational discussion only—not financial advice. Never include account credentials, personal details, or a member’s private journal data.</div><div className="grid gap-4 sm:grid-cols-[185px_1fr]"><label className="block"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Category</span><div className="relative mt-2"><select value={category} onChange={event => setCategory(event.target.value as typeof category)} className="h-10 w-full appearance-none rounded-xl border border-blue-200/[0.10] bg-[#0a1427] px-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-300/50">{categories.slice(1).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" /></div></label><label className="block"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Discussion title</span><input value={title} onChange={event => setTitle(event.target.value)} required minLength={4} maxLength={140} placeholder="What would you like to discuss?" className="mt-2 h-10 w-full rounded-xl border border-blue-200/[0.10] bg-[#0a1427] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-blue-300/50" /></label></div><label className="block"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Your analysis</span><textarea value={body} onChange={event => setBody(event.target.value)} required minLength={12} maxLength={5000} rows={7} placeholder="Share your reasoning, execution lesson, or market context…" className="mt-2 w-full resize-y rounded-xl border border-blue-200/[0.10] bg-[#0a1427] px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-blue-300/50" /></label></div><div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-4"><span className="text-xs text-slate-600">Visible to authenticated Trade Fusion members</span><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setComposerOpen(false)} className="border-white/[0.10] text-slate-300 hover:bg-white/[0.06]">Cancel</Button><Button type="submit" disabled={createPost.isPending} className="bg-[oklch(0.66_0.18_250)] text-white hover:bg-[oklch(0.72_0.18_250)]">{createPost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Publish discussion</Button></div></div></motion.form></motion.div>}</AnimatePresence>
    </div>
  );
}
