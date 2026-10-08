import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { bookingUrl, contactEmail } from "@/lib/site";
export function Brand() {
  return (
    <Link
      className="brand"
      href="/"
      aria-label="Problem2App home"
      onClick={() => {
        if (window.location.pathname === "/")
          window.scrollTo({ top: 0, behavior: "instant" });
      }}
    >
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="m5 5 7 7-7 7M12 5l7 7-7 7" />
        </svg>
      </span>
      <span>
        problem2app<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
export function BookingLink({
  children = "Let's talk",
  small = false,
}: {
  children?: ReactNode;
  small?: boolean;
}) {
  return (
    <a
      className={`button button-primary ${small ? "button-small" : ""}`}
      href={bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight size={17} aria-hidden="true" />
      <span className="sr-only"> (opens booking in a new tab)</span>
    </a>
  );
}
const links = [
  { label: "What we build", href: "/#automations" },
  { label: "Try the demos", href: "/examples" },
  { label: "Why us", href: "/#approach" },
  { label: "About", href: "/about" },
];
export function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const resize = () => {
      if (innerWidth > 760) setOpen(false);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("resize", resize);
    };
  }, [open]);
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              aria-current={location === l.href ? "page" : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <BookingLink small />
          <button
            ref={toggle}
            className="icon-button menu-toggle"
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              aria-current={location === l.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {l.label}
              <ArrowUpRight size={18} />
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer container">
      <Brand />
      <a className="footer-email" href={`mailto:${contactEmail}`}>
        {contactEmail}
        <ArrowUpRight size={14} />
      </a>
      <span>© {new Date().getFullYear()} Problem2App</span>
      <a href="#main" className="back-top">
        Back to top ↑
      </a>
    </footer>
  );
}
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
