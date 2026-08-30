import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/adtune-logo.jpg";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Process", href: "/#process" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const serviceLinks = [
  { label: "Web Development", href: "/services/web-development" },
  { label: "SEO", href: "/services/seo" },
  { label: "Performance Marketing", href: "/services/performance-marketing" },
  { label: "Social Media Marketing", href: "/services/social-media-marketing" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [servicesOpenMobile, setServicesOpenMobile] = useState(false);
  const [servicesOpenDesktop, setServicesOpenDesktop] = useState(false);
  const [closeTimer, setCloseTimer] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setServicesOpenMobile(false);
    setServicesOpenDesktop(false);
  }, [pathname]);

  const clearCloseTimer = () => {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      setCloseTimer(null);
    }
  };

  const openDesktopServices = () => {
    clearCloseTimer();
    setServicesOpenDesktop(true);
  };

  const closeDesktopServices = () => {
    clearCloseTimer();
    const timer = window.setTimeout(() => setServicesOpenDesktop(false), 140);
    setCloseTimer(timer);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "py-2" : "py-4"
      )}
    >
      <div className="container">
        <nav
          className={cn(
            "flex items-center justify-between rounded-full px-3 py-2 transition-all duration-500",
            scrolled
              ? "glass border border-border shadow-card"
              : "border border-transparent"
          )}
        >
          <Link to="/" className="flex items-center gap-2.5 pl-2" aria-label="AdTune home">
            <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-border">
              <img src={logo} alt="" className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">AdTune</span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            <li className="relative">
              <div>
                <Link
                  to="/#services"
                  onMouseEnter={openDesktopServices}
                  onMouseLeave={closeDesktopServices}
                  className="flex items-center gap-1 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Services <ChevronDown className="h-4 w-4" />
                </Link>
                <div className="absolute left-0 top-full z-50 w-64 pt-2">
                  <div
                    onMouseEnter={openDesktopServices}
                    onMouseLeave={closeDesktopServices}
                    className={cn(
                      "rounded-2xl border border-border bg-surface/95 p-2 shadow-elevated backdrop-blur-xl transition-all duration-200",
                      servicesOpenDesktop ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
                    )}
                  >
                    {serviceLinks.map((service) => (
                      <Link
                        key={service.href}
                        to={service.href}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/40"
                      >
                        {service.label}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </li>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Button asChild variant="hero" size="default">
              <Link to="/#contact">
                Book free call <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <button
            className="rounded-full border border-border bg-surface p-2.5 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-x-0 top-[68px] z-40 mx-4 origin-top overflow-hidden rounded-2xl border border-border bg-surface/95 backdrop-blur-xl transition-all duration-300 md:hidden",
          open ? "max-h-[480px] opacity-100" : "pointer-events-none max-h-0 opacity-0"
        )}
      >
        <ul className="flex flex-col gap-1 p-3">
          <li>
            <button
              type="button"
              onClick={() => setServicesOpenMobile((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-base text-foreground transition-colors hover:bg-accent/40"
            >
              Services
              {servicesOpenMobile ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </li>
          {servicesOpenMobile
            ? serviceLinks.map((service) => (
                <li key={service.href}>
                  <Link
                    to={service.href}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                  >
                    {service.label}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))
            : null}
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base text-foreground transition-colors hover:bg-accent/40"
              >
                {item.label}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
          <li className="px-2 pb-2 pt-3">
            <Button asChild variant="hero" size="lg" className="w-full">
              <Link to="/#contact">Book free call</Link>
            </Button>
          </li>
        </ul>
      </div>
    </header>
  );
}
