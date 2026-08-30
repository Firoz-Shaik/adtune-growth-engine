import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, PlusCircle, Image as ImageIcon, Settings, ExternalLink, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/adtune-logo.jpg";
import { useAuth } from "@/features/auth/AuthProvider";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/blogs", label: "Blogs", icon: FileText },
  { to: "/admin/blogs/new", label: "New post", icon: PlusCircle },
  { to: "/admin/media", label: "Media", icon: ImageIcon },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();

  const Sidebar = (
    <aside className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-sidebar-border">
          <img src={logo} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-base font-semibold text-sidebar-foreground">AdTune</div>
          <div className="text-[10px] tracking-caps text-muted-foreground">Admin</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Link to="/" className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
          View site <ExternalLink className="h-4 w-4" />
        </Link>
        <button onClick={() => void signOut()} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
          Sign out <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">{Sidebar}</div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className={cn("absolute inset-y-0 left-0 w-64 transition-transform", open ? "translate-x-0" : "-translate-x-full")}>
          {Sidebar}
        </div>
      </div>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="rounded-lg border border-border p-2 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="font-display text-lg font-medium">
              {pathname === "/admin" && "Dashboard"}
              {pathname.startsWith("/admin/blogs/new") && "New post"}
              {pathname.startsWith("/admin/blogs/edit") && "Edit post"}
              {pathname === "/admin/blogs" && "All blogs"}
              {pathname === "/admin/media" && "Media library"}
              {pathname === "/admin/settings" && "Settings"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <div className="text-xs text-muted-foreground">Signed in as</div>
              <div className="max-w-48 truncate text-sm font-medium">{user?.email}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-primary" />
          </div>
        </header>

        <main className={pathname.startsWith("/admin/blogs/new") || pathname.startsWith("/admin/blogs/edit") ? "px-4 py-4 md:px-6 lg:px-8" : "p-4 md:p-8"}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
