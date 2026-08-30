import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminGuard } from "./AdminGuard";

const auth = vi.fn();
vi.mock("./AuthProvider", () => ({ useAuth: () => auth() }));

function subject() {
  return render(<MemoryRouter initialEntries={["/admin"]}><Routes><Route path="/admin/login" element={<div>Login</div>} /><Route element={<AdminGuard />}><Route path="/admin" element={<div>Dashboard</div>} /></Route></Routes></MemoryRouter>);
}

describe("AdminGuard", () => {
  beforeEach(() => auth.mockReset());
  it("redirects signed-out visitors", () => { auth.mockReturnValue({ loading: false, user: null, role: null }); subject(); expect(screen.getByText("Login")).toBeInTheDocument(); });
  it("allows admins", () => { auth.mockReturnValue({ loading: false, user: { id: "1" }, role: "admin" }); subject(); expect(screen.getByText("Dashboard")).toBeInTheDocument(); });
  it("allows editors", () => { auth.mockReturnValue({ loading: false, user: { id: "1" }, role: "editor" }); subject(); expect(screen.getByText("Dashboard")).toBeInTheDocument(); });
  it("blocks non-staff users", () => { auth.mockReturnValue({ loading: false, user: { id: "1" }, role: null }); subject(); expect(screen.getByText("Admin access required")).toBeInTheDocument(); });
});
