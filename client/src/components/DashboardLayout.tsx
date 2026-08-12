import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CalendarDays, ChartNoAxesCombined, ChevronRight, CircleUserRound, LogOut, MessagesSquare, PanelLeft, ShieldCheck, UserRound } from "lucide-react";
import { type CSSProperties } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { appRoutes } from "@/lib/appRoutes";
import { trpc } from "@/lib/trpc";
import { NotificationMenu } from "./NotificationMenu";

const menuItems = [
  { icon: ChartNoAxesCombined, label: "Journal", subtitle: "Trade performance", path: appRoutes.journal },
  { icon: CalendarDays, label: "Market Calendar", subtitle: "Macro events", path: appRoutes.calendar },
  { icon: MessagesSquare, label: "Trader’s Room", subtitle: "Member discussion", path: appRoutes.community },
  { icon: UserRound, label: "Account", subtitle: "Profile and privacy", path: appRoutes.account },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: profile } = trpc.account.profile.useQuery(undefined, { enabled: Boolean(user) });

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#07101f] px-6 text-white">
        <div className="tf-blue-glow w-full max-w-sm rounded-[1.25rem] border border-blue-300/10 bg-[#101d35]/90 p-8 text-center shadow-2xl"><div className="mb-7 flex items-center justify-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.66_0.18_250)] text-sm font-black text-slate-950">TF</span><span className="text-sm font-bold tracking-[-0.04em] text-white">TRADE<span className="text-[oklch(0.70_0.16_250)]">FUSION</span></span></div>
          <ShieldCheck className="mx-auto h-7 w-7 text-[oklch(0.70_0.16_250)]" />
          <h1 className="mt-4 text-xl font-semibold">Secure workspace</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Sign in to access your private Trade Fusion journal.</p>
          <Button onClick={startLogin} className="mt-6 w-full bg-[oklch(0.66_0.18_250)] text-white hover:bg-[oklch(0.72_0.18_250)]">Sign in to continue</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "258px" } as CSSProperties}>
      <Sidebar collapsible="icon" className="border-r border-blue-200/[0.08] bg-[#0a1427] text-slate-300">
        <SidebarHeader className="h-[76px] border-b border-blue-200/[0.08] px-3 py-0">
          <div className="flex h-full items-center gap-3 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.66_0.18_250)] shadow-[0_8px_24px_oklch(0.45_0.18_250_/_0.38)]">
              <ChartNoAxesCombined className="h-4 w-4 text-white" strokeWidth={2.6} />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="text-sm font-bold tracking-[-0.04em] text-white">TRADE<span className="text-[oklch(0.70_0.16_250)]">FUSION</span></div>
              <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.26em] text-slate-500">Trading workspace</div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-5">
          <p className="mb-2 px-2 font-mono text-[9px] uppercase tracking-[0.22em] text-slate-600 group-data-[collapsible=icon]:hidden">Workspace</p>
          <SidebarMenu>
            {menuItems.map((item) => {
              const isActive = location === item.path;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className={`relative h-[52px] rounded-xl px-3 text-slate-400 transition-colors hover:bg-blue-400/[0.07] hover:text-white data-[active=true]:bg-blue-500/[0.15] data-[active=true]:text-white ${isActive ? "before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-[oklch(0.66_0.18_250)]" : ""}`}
                  >
                    <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-[oklch(0.70_0.16_250)]" : ""}`} />
                    <span className="flex min-w-0 flex-1 flex-col text-left group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-medium leading-4">{item.label}</span>
                      <span className="mt-0.5 text-[10px] font-normal text-slate-600">{item.subtitle}</span>
                    </span>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-[oklch(0.70_0.16_250)] group-data-[collapsible=icon]:hidden" />}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>

          <div className="mt-8 rounded-xl border border-blue-200/[0.09] bg-gradient-to-br from-blue-400/[0.09] to-transparent p-3 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300"><ShieldCheck className="h-3.5 w-3.5 text-[oklch(0.70_0.16_250)]" /> Private data</div>
            <p className="mt-1.5 text-[11px] leading-4 text-slate-600">Your executions and notes remain account-specific.</p>
          </div>
        </SidebarContent>

        <SidebarFooter className="border-t border-blue-200/[0.08] p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar className="h-8 w-8 border border-white/10 bg-slate-800">
              <AvatarImage src={profile?.avatarUrl ?? undefined} alt={`${profile?.name || user.name || "Trader"} profile`} />
              <AvatarFallback className="bg-slate-800 text-xs text-[oklch(0.70_0.16_250)]">{user.name?.charAt(0).toUpperCase() ?? <CircleUserRound className="h-4 w-4" />}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-xs font-medium text-slate-200">{user.name || "Trader"}</p>
              <p className="mt-0.5 truncate text-[10px] text-slate-600">Private account</p>
            </div>
            <button onClick={() => void logout()} className="rounded-md p-1.5 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-200 group-data-[collapsible=icon]:hidden" aria-label="Sign out"><LogOut className="h-3.5 w-3.5" /></button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-screen bg-[#07101f]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-blue-200/[0.08] bg-[#07101f]/88 px-5 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-9 w-9 rounded-lg border border-blue-200/[0.10] bg-blue-400/[0.05] text-slate-400 hover:bg-blue-400/[0.10] hover:text-white" />
            <div className="hidden h-5 w-px bg-blue-200/[0.10] sm:block" />
            <div className="hidden sm:block">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">Live workspace</p>
              <p className="mt-0.5 text-xs text-slate-400">Private performance journal</p>
            </div>
          </div>
          <div className="flex items-center gap-2"><NotificationMenu /><div className="flex items-center gap-2 rounded-full border border-blue-300/[0.16] bg-blue-400/[0.08] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-blue-200"><span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_oklch(0.66_0.18_250)]" /> Secure sync</div></div>
        </header>
        <main className="min-w-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
