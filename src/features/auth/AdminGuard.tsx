import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isStaffRole } from "@/lib/supabase/types";
import { useAuth } from "./AuthProvider";

export function AdminGuard() {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Checking access…</div>;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (!isStaffRole(role)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <h1 className="font-display text-3xl">Admin access required</h1>
          <p className="mt-3 text-muted-foreground">This account does not have permission to manage the blog.</p>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
