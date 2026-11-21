import Link from "next/link";
import { PAGE_SIZE } from "@/lib/page";

export function Pager({
  page,
  total,
  href,
}: {
  page: number;
  total: number;
  href: (page: number) => string;
}) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pages">
      {page > 1 ? <Link href={href(page - 1)}>Previous</Link> : <span />}
      <span>Page {page} of {pages}</span>
      {page < pages ? <Link href={href(page + 1)}>Next</Link> : <span />}
    </nav>
  );
}
