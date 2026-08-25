import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RouteScrollManager } from "@/features/marketing/components/layout/RouteScrollManager";
import Index from "@/routes/Index.tsx";
import NotFound from "@/routes/NotFound.tsx";
import Contact from "@/routes/Contact.tsx";
import Blog from "@/routes/Blog.tsx";
import BlogPost from "@/routes/BlogPost.tsx";
import ServicePage from "@/routes/ServicePage.tsx";
import { AdminLayout } from "@/features/admin/layout/AdminLayout.tsx";
import AdminDashboard from "@/features/admin/pages/AdminDashboard.tsx";
import AdminBlogs from "@/features/admin/pages/AdminBlogs.tsx";
import AdminBlogEditor from "@/features/admin/pages/AdminBlogEditor.tsx";
import AdminLogin from "@/features/auth/AdminLogin";
import { AdminGuard } from "@/features/auth/AdminGuard";

export function AppRouter() {
  return (
    <BrowserRouter>
      <RouteScrollManager />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/services/:slug" element={<ServicePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="blogs/new" element={<AdminBlogEditor />} />
            <Route path="blogs/edit/:id" element={<AdminBlogEditor />} />
            <Route path="media" element={<AdminDashboard />} />
            <Route path="settings" element={<AdminDashboard />} />
          </Route>
        </Route>
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
