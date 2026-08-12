import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  COMMUNITY_ATTACHMENT_RULES,
  COMMUNITY_REACTIONS,
  TRADING_STYLE_LABELS,
  TRADING_STYLES,
  type CommunityReaction,
  type TradingStyle,
} from "@shared/communityConfig";
import { trpc } from "@/lib/trpc";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  CircleHelp,
  ChevronDown,
  Flag,
  Heart,
  ImagePlus,
  Globe2,
  Lightbulb,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Target,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import React, { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

const categories = [
  { value: "all", label: "All discussions", icon: UsersRound },
  { value: "trade_ideas", label: "Trade Ideas", icon: Lightbulb },
  { value: "execution_review", label: "Execution Review", icon: Target },
  { value: "psychology", label: "Psychology", icon: Brain },
  { value: "market_context", label: "Market Context", icon: Globe2 },
] as const;

const categoryMeta = Object.fromEntries(categories.slice(1).map(category => [category.value, category]));

const reactionMeta: Record<CommunityReaction, { label: string; icon: typeof Lightbulb }> = {
  insightful: { label: "Insightful", icon: Lightbulb },
  support: { label: "Support", icon: Heart },
  question: { label: "Question", icon: CircleHelp },
};

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read image"));
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

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

function CommunityIdentityBadge({ tradingStyle, isFounder, compact = false }: { tradingStyle?: string | null; isFounder?: boolean; compact?: boolean }) {
  if (isFounder) {
    return <span className={`inline-flex items-center gap-1 rounded-full border border-blue-300/[0.22] bg-blue-400/[0.12] font-mono uppercase text-blue-100 ${compact ? "px-1.5 py-0.5 text-[8px] tracking-[0.10em]" : "px-2 py-1 text-[9px] tracking-[0.12em]"}`}><ShieldCheck className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />Founder · Moderator</span>;
  }
  if (!tradingStyle) return null;
  return <span className={`rounded-full border border-emerald-300/[0.16] bg-emerald-400/[0.08] font-mono uppercase text-emerald-200 ${compact ? "px-1.5 py-0.5 text-[8px] tracking-[0.10em]" : "px-2 py-1 text-[9px] tracking-[0.12em]"}`}>{TRADING_STYLE_LABELS[tradingStyle as TradingStyle]}</span>;
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
  const [attachmentDrafts, setAttachmentDrafts] = useState<Array<{ fileName: string; mimeType: "image/jpeg" | "image/png" | "image/webp"; dataUrl: string }>>([]);
  const [badgeOpen, setBadgeOpen] = useState(false);

  const { data: posts = [], isLoading, isFetching } = trpc.community.list.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const { data: profile } = trpc.community.profile.get.useQuery();
  const isModerator = user?.role === "admin";
  const { data: openReports = [] } = trpc.community.moderation.listOpenReports.useQuery(undefined, {
    enabled: isModerator,
  });

  const uploadAttachment = trpc.community.uploadAttachment.useMutation({
    onError: error => toast.error(error.message),
  });

  const createPost = trpc.community.createPost.useMutation({
    onSuccess: async post => {
      try {
        await Promise.all(
          attachmentDrafts.map(attachment => uploadAttachment.mutateAsync({ postId: post.id, ...attachment }))
        );
      } catch {
        toast.error("Discussion published, but one or more attachments could not be uploaded.");
      }
      setTitle("");
      setBody("");
      setCategory("trade_ideas");
      setAttachmentDrafts([]);
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

  const reactToPost = trpc.community.reactToPost.useMutation({
    onSuccess: () => void utils.community.list.invalidate(),
    onError: error => toast.error(error.message),
  });

  const reactToComment = trpc.community.reactToComment.useMutation({
    onSuccess: () => void utils.community.list.invalidate(),
    onError: error => toast.error(error.message),
  });

  const setTradingStyle = trpc.community.profile.setTradingStyle.useMutation({
    onSuccess: () => {
      void utils.community.profile.get.invalidate();
      void utils.community.list.invalidate();
      setBadgeOpen(false);
      toast.success("Trading style badge updated.");
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

  const selectAttachments = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const remaining = COMMUNITY_ATTACHMENT_RULES.maxFilesPerPost - attachmentDrafts.length;
    if (files.length > remaining) {
      toast.error(`You can attach up to ${COMMUNITY_ATTACHMENT_RULES.maxFilesPerPost} images to a discussion.`);
    }
    const accepted = files.slice(0, Math.max(0, remaining));
    const valid = accepted.filter(file => {
      const allowed = COMMUNITY_ATTACHMENT_RULES.acceptedMimeTypes.includes(file.type as (typeof COMMUNITY_ATTACHMENT_RULES.acceptedMimeTypes)[number]);
      if (!allowed || file.size > COMMUNITY_ATTACHMENT_RULES.maxBytesPerFile) {
        toast.error(`${file.name} must be a PNG, JPG, or WebP image under 3 MB.`);
        return false;
      }
      return true;
    });
    try {
      const drafts = await Promise.all(valid.map(async file => ({
        fileName: file.name,
        mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
        dataUrl: await readImageFile(file),
      })));
      setAttachmentDrafts(current => [...current, ...drafts]);
    } catch {
      toast.error("One or more images could not be read.");
    }
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
            <div className="flex flex-wrap items-center gap-2">{profile?.isFounder ? <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-300/[0.22] bg-blue-400/[0.12] px-3 text-xs font-medium text-blue-100"><ShieldCheck className="h-4 w-4" />Founder · Moderator</span> : <div className="relative"><button onClick={() => setBadgeOpen(open => !open)} className="h-11 rounded-xl border border-blue-200/[0.12] bg-blue-400/[0.06] px-3 text-xs text-slate-300 transition-colors hover:bg-blue-400/[0.12]">{profile?.tradingStyle ? TRADING_STYLE_LABELS[profile.tradingStyle as TradingStyle] : "Set trading style"}<ChevronDown className="ml-2 inline h-3.5 w-3.5" /></button>{badgeOpen && <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-blue-200/[0.14] bg-[#0d1b33] p-2 shadow-2xl"><p className="px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Your badge</p><button onClick={() => setTradingStyle.mutate({ tradingStyle: null })} className="w-full rounded-lg px-2 py-2 text-left text-xs text-slate-400 hover:bg-white/[0.06]">No public badge</button>{TRADING_STYLES.map(style => <button key={style} onClick={() => setTradingStyle.mutate({ tradingStyle: style })} className="w-full rounded-lg px-2 py-2 text-left text-xs text-slate-300 hover:bg-blue-400/[0.10]">{TRADING_STYLE_LABELS[style]}</button>)}</div>}</div>}<Button onClick={() => setComposerOpen(true)} className="h-11 rounded-xl bg-[oklch(0.66_0.18_250)] px-4 text-white shadow-[0_10px_24px_oklch(0.45_0.18_250_/_0.30)] hover:bg-[oklch(0.72_0.18_250)]"><Plus className="mr-2 h-4 w-4" /> Start a discussion</Button></div>
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
          return <article key={post.id} className="overflow-hidden rounded-2xl border border-blue-200/[0.10] bg-gradient-to-b from-[#152647] to-[#101c33] shadow-[0_14px_30px_rgba(1,8,24,0.18)]"><div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="mb-4 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/[0.12] bg-blue-400/[0.07] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-blue-200"><Icon className="h-3 w-3" />{meta.label}</span><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">{formatTime(post.createdAt)}</span></div><div className="mb-5 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0a1427]/50 px-3 py-2.5">{post.authorAvatarUrl ? <img src={post.authorAvatarUrl} alt={`${post.authorName} profile`} className="h-9 w-9 shrink-0 rounded-full border border-blue-300/[0.18] object-cover" /> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-blue-300/[0.18] bg-blue-400/[0.10] text-xs font-semibold text-blue-100">{post.authorInitial ?? post.authorName.charAt(0).toUpperCase()}</span>}<div className="min-w-0"><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-500">Posted by</p><div className="mt-0.5 flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-white">{post.authorName}</span><CommunityIdentityBadge tradingStyle={post.authorTradingStyle} isFounder={post.isFounder} /></div></div></div><h2 className="text-lg font-semibold tracking-[-0.025em] text-white sm:text-xl">{post.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">{post.body}</p>{post.attachments.length > 0 && <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">{post.attachments.map(attachment => <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-xl border border-blue-200/[0.10] bg-[#0a1427]"><img src={attachment.url} alt={attachment.fileName} className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.03]" /><span className="absolute bottom-0 left-0 right-0 bg-[#07101f]/78 px-2 py-1.5 text-[10px] text-slate-300 backdrop-blur-sm">{attachment.fileName}</span></a>)}</div>}</div><button onClick={() => setReportingPostId(reportingPostId === post.id ? null : post.id)} className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-300" aria-label="Report discussion"><MoreHorizontal className="h-4 w-4" /></button></div><div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4 text-xs"><span className="text-slate-600">{post.comments.length} {post.comments.length === 1 ? "reply" : "replies"}</span><button onClick={() => setExpandedComments(current => ({ ...current, [post.id]: !commentsOpen }))} className="ml-1 inline-flex items-center gap-1.5 text-blue-300 hover:text-blue-200"><MessageCircle className="h-3.5 w-3.5" />{commentsOpen ? "Hide replies" : "Reply"}</button>{COMMUNITY_REACTIONS.map(type => { const reaction = reactionMeta[type]; const ReactionIcon = reaction.icon; const active = post.reactions.viewerReaction === type; const count = post.reactions.counts[type]; return <button key={type} onClick={() => reactToPost.mutate({ postId: post.id, reaction: type })} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 transition-colors ${active ? "border-blue-300/[0.26] bg-blue-400/[0.16] text-blue-100" : "border-white/[0.08] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"}`} aria-label={`${reaction.label} reaction`}><ReactionIcon className="h-3 w-3" />{count > 0 && count}</button>})}{canRemove && <button onClick={() => removePost.mutate({ postId: post.id })} className="ml-auto inline-flex items-center gap-1.5 text-slate-600 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" />Remove</button>}</div>
          {reportingPostId === post.id && <form onSubmit={event => { event.preventDefault(); reportPost.mutate({ postId: post.id, reason: reportReason }); }} className="mt-4 rounded-xl border border-amber-300/[0.13] bg-amber-300/[0.04] p-3"><div className="flex gap-3"><Flag className="mt-1 h-4 w-4 shrink-0 text-amber-300" /><div className="min-w-0 flex-1"><label className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber-200/70">Report to moderation</label><input value={reportReason} onChange={event => setReportReason(event.target.value)} required minLength={4} maxLength={500} placeholder="Briefly explain the issue" className="mt-2 h-9 w-full rounded-lg border border-amber-300/[0.16] bg-[#0a1427] px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-amber-300/50" /></div><Button type="submit" size="sm" disabled={reportPost.isPending} className="self-end bg-amber-300 text-slate-950 hover:bg-amber-200">Send</Button></div></form>}
          {commentsOpen && <div className="mt-5 border-t border-white/[0.06] pt-4"><div className="space-y-3">{post.comments.map(comment => <div key={comment.id} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2.5">{comment.authorAvatarUrl ? <img src={comment.authorAvatarUrl} alt={`${comment.authorName} profile`} className="h-7 w-7 shrink-0 rounded-full border border-blue-300/[0.14] object-cover" /> : <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-blue-300/[0.14] bg-blue-400/[0.08] text-[10px] font-semibold text-blue-100">{comment.authorInitial ?? comment.authorName.charAt(0).toUpperCase()}</span>}<div className="min-w-0"><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-slate-500">Reply from</p><div className="mt-0.5 flex flex-wrap items-center gap-1.5"><span className="text-xs font-semibold text-slate-200">{comment.authorName}</span><CommunityIdentityBadge tradingStyle={comment.authorTradingStyle} isFounder={comment.isFounder} compact /></div></div></div><span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">{formatTime(comment.createdAt)}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">{comment.body}</p><div className="mt-3 flex flex-wrap gap-1.5">{COMMUNITY_REACTIONS.map(type => { const reaction = reactionMeta[type]; const ReactionIcon = reaction.icon; const active = comment.reactions.viewerReaction === type; const count = comment.reactions.counts[type]; return <button key={type} onClick={() => reactToComment.mutate({ commentId: comment.id, reaction: type })} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] transition-colors ${active ? "border-blue-300/[0.26] bg-blue-400/[0.16] text-blue-100" : "border-white/[0.08] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"}`} aria-label={`${reaction.label} reaction`}><ReactionIcon className="h-3 w-3" />{count > 0 && count}</button>})}</div></div>)}</div><form onSubmit={event => submitComment(event, post.id)} className="mt-4 flex gap-2"><input value={commentDrafts[post.id] ?? ""} onChange={event => setCommentDrafts(current => ({ ...current, [post.id]: event.target.value }))} maxLength={2000} placeholder="Add a constructive reply" className="h-10 min-w-0 flex-1 rounded-xl border border-blue-200/[0.10] bg-[#0a1427] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-blue-300/50" /><Button type="submit" size="icon" disabled={addComment.isPending || !(commentDrafts[post.id] ?? "").trim()} className="h-10 w-10 rounded-xl bg-blue-500 text-white hover:bg-blue-400"><Send className="h-4 w-4" /></Button></form></div>}
          </div></article>;
        })}</div>}
      </section>

      <AnimatePresence>{composerOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-[#040914]/80 p-4 backdrop-blur-sm"><motion.form initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }} onSubmit={submitPost} className="w-full max-w-2xl overflow-hidden rounded-2xl border border-blue-200/[0.16] bg-[#0d1b33] shadow-2xl"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-blue-300">Trader’s Room</p><h2 className="mt-1 text-lg font-semibold text-white">Start a discussion</h2></div><button type="button" onClick={() => setComposerOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-white" aria-label="Close composer"><X className="h-4 w-4" /></button></div><div className="space-y-4 p-5"><div className="rounded-xl border border-amber-300/[0.14] bg-amber-300/[0.06] px-3 py-2.5 text-xs leading-5 text-amber-100/80">Educational discussion only—not financial advice. Never include account credentials, personal details, or a member’s private journal data.</div><div className="grid gap-4 sm:grid-cols-[185px_1fr]"><label className="block"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Category</span><div className="relative mt-2"><select value={category} onChange={event => setCategory(event.target.value as typeof category)} className="h-10 w-full appearance-none rounded-xl border border-blue-200/[0.10] bg-[#0a1427] px-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-300/50">{categories.slice(1).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" /></div></label><label className="block"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Discussion title</span><input value={title} onChange={event => setTitle(event.target.value)} required minLength={4} maxLength={140} placeholder="What would you like to discuss?" className="mt-2 h-10 w-full rounded-xl border border-blue-200/[0.10] bg-[#0a1427] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-blue-300/50" /></label></div><label className="block"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Your analysis</span><textarea value={body} onChange={event => setBody(event.target.value)} required minLength={12} maxLength={5000} rows={7} placeholder="Share your reasoning, execution lesson, or market context…" className="mt-2 w-full resize-y rounded-xl border border-blue-200/[0.10] bg-[#0a1427] px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-blue-300/50" /></label><div><div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Charts or images</span><span className="text-[10px] text-slate-600">PNG, JPG, WebP · up to 3 MB each · 2 max</span></div><label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200/[0.18] bg-blue-400/[0.04] px-4 py-3 text-sm text-blue-200 transition-colors hover:bg-blue-400/[0.10]"><ImagePlus className="h-4 w-4" /> Add chart or image<input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={selectAttachments} className="sr-only" /></label>{attachmentDrafts.length > 0 && <div className="mt-2 grid grid-cols-2 gap-2">{attachmentDrafts.map((attachment, index) => <div key={`${attachment.fileName}-${index}`} className="relative overflow-hidden rounded-xl border border-blue-200/[0.10] bg-[#0a1427]"><img src={attachment.dataUrl} alt={attachment.fileName} className="aspect-[16/9] w-full object-cover" /><div className="flex items-center justify-between gap-2 p-2"><span className="truncate text-[10px] text-slate-400">{attachment.fileName}</span><button type="button" onClick={() => setAttachmentDrafts(current => current.filter((_, draftIndex) => draftIndex !== index))} className="rounded-md p-1 text-slate-500 hover:bg-white/[0.06] hover:text-red-300" aria-label={`Remove ${attachment.fileName}`}><X className="h-3.5 w-3.5" /></button></div></div>)}</div>}</div></div><div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-4"><span className="text-xs text-slate-600">Visible to authenticated Trade Fusion members</span><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setComposerOpen(false)} className="border-white/[0.10] text-slate-300 hover:bg-white/[0.06]">Cancel</Button><Button type="submit" disabled={createPost.isPending} className="bg-[oklch(0.66_0.18_250)] text-white hover:bg-[oklch(0.72_0.18_250)]">{createPost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Publish discussion</Button></div></div></motion.form></motion.div>}</AnimatePresence>
    </div>
  );
}
