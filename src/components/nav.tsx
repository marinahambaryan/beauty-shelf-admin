"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Review" },
  { href: "/products", label: "Products" },
  { href: "/brands", label: "Brands" },
  { href: "/users", label: "People" },
  { href: "/activity", label: "Activity" },
];

export function Nav({ pending }: { pending: number }) {
  const path = usePathname();
  const isCurrent = (href: string) =>
    href === "/" ? path === "/" || path.startsWith("/review") : path.startsWith(href);

  return (
    <nav aria-label="Main">
      {LINKS.map(({ href, label }) => (
        <Link key={href} href={href} aria-current={isCurrent(href) ? "page" : undefined}>
          {label}
          {href === "/" && pending > 0 && (
            <span className="count" aria-label={`${pending} waiting`}>{pending}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
