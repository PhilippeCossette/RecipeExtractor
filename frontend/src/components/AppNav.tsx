import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const LINKS = [
  { to: "/home", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/lists", label: "Lists" },
  { to: "/profile", label: "Profile" },
] as const;

/** Top navigation for signed-in pages. Admins also get "Admin". */
export function AppNav({ showAdmin }: { showAdmin: boolean }) {
  const links = showAdmin ? [...LINKS, { to: "/admin", label: "Admin" } as const] : LINKS;
  return (
    <header className="border-b">
      <nav className="mx-auto flex w-full max-w-3xl items-center gap-1 p-2">
        <span className="mr-auto px-2 font-semibold">Recipe Extractor</span>
        {links.map((link) => (
          <Button key={link.to} variant="ghost" size="sm" asChild>
            <Link to={link.to} activeProps={{ className: "bg-muted" }}>
              {link.label}
            </Link>
          </Button>
        ))}
      </nav>
    </header>
  );
}
