import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isStaffRole } from "@/lib/supabase/types";
import { useAuth } from "./AuthProvider";

export default function AdminLogin() {
  const { signIn, user, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const requestedDestination = (location.state as { from?: string } | null)?.from;
  const destination = requestedDestination?.startsWith("/")
    && !requestedDestination.startsWith("//")
    && !requestedDestination.includes("\\")
    ? requestedDestination
    : "/admin";

  if (!loading && user && isStaffRole(role)) return <Navigate to={destination} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(destination, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background p-5">
      <form onSubmit={submit} className="surface-card w-full max-w-md space-y-5 p-7">
        <div><div className="text-xs tracking-caps text-primary-glow">AdTune admin</div><h1 className="mt-2 font-display text-3xl">Welcome back</h1></div>
        <Input aria-label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
        <Input aria-label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="hero" className="w-full" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</Button>
      </form>
    </main>
  );
}
