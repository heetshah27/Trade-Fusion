import { appRoutes } from "@/lib/appRoutes";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCheck, Heart, MessageCircle, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { useLocation } from "wouter";

function formatTime(value: Date | string) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1_440)}d ago`;
}

function notificationCopy(notification: { type: "post_reply" | "post_reaction" | "comment_reaction"; actorName: string; reaction: string | null }) {
  if (notification.type === "post_reply") return { icon: MessageCircle, text: `${notification.actorName} replied to your discussion` };
  if (notification.type === "comment_reaction") return { icon: Heart, text: `${notification.actorName} found your reply ${notification.reaction ?? "helpful"}` };
  return { icon: Sparkles, text: `${notification.actorName} marked your discussion ${notification.reaction ?? "helpful"}` };
}

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: notifications = [] } = trpc.notifications.list.useQuery(undefined, { refetchInterval: 60_000 });
  const { data: unread = { count: 0 } } = trpc.notifications.unreadCount.useQuery(undefined, { refetchInterval: 30_000 });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      void utils.notifications.list.invalidate();
      void utils.notifications.unreadCount.invalidate();
    },
  });
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      void utils.notifications.list.invalidate();
      void utils.notifications.unreadCount.invalidate();
    },
  });

  return <div className="relative">
    <button onClick={() => setOpen(current => !current)} aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-lg border border-blue-200/[0.10] bg-blue-400/[0.05] text-slate-400 transition-colors hover:bg-blue-400/[0.10] hover:text-white">
      <Bell className="h-4 w-4" />
      {unread.count > 0 && <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-blue-400 px-1 text-[9px] font-semibold text-slate-950">{unread.count > 9 ? "9+" : unread.count}</span>}
    </button>
    {open && <div className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-blue-200/[0.14] bg-[#0d1b33]/98 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3"><div><p className="text-sm font-semibold text-white">Notifications</p><p className="mt-0.5 text-[10px] text-slate-500">Private activity from Trader’s Room</p></div>{unread.count > 0 && <button disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()} className="inline-flex items-center gap-1 text-[11px] text-blue-300 hover:text-blue-200"><CheckCheck className="h-3.5 w-3.5" />Mark read</button>}</div>
      <div className="max-h-[24rem] overflow-y-auto">{notifications.length === 0 ? <div className="px-5 py-9 text-center"><Bell className="mx-auto h-5 w-5 text-slate-600" /><p className="mt-3 text-sm text-slate-300">You’re all caught up.</p><p className="mt-1 text-xs leading-5 text-slate-600">Replies and reactions to your discussions will appear here.</p></div> : notifications.map(notification => { const copy = notificationCopy(notification); const Icon = copy.icon; return <button key={notification.id} onClick={() => { if (!notification.readAt) markRead.mutate({ notificationId: notification.id }); setOpen(false); setLocation(appRoutes.community); }} className={`flex w-full gap-3 border-b border-white/[0.05] px-4 py-3 text-left transition-colors hover:bg-white/[0.05] ${notification.readAt ? "opacity-65" : "bg-blue-400/[0.04]"}`}><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-blue-200/[0.10] bg-blue-400/[0.08] text-blue-200"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs leading-5 text-slate-200">{copy.text}</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">{formatTime(notification.createdAt)}</span></span>{!notification.readAt && <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-400" />}</button>; })}</div>
    </div>}
  </div>;
}
