import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/fields";
import { Pager } from "@/components/pager";
import { Empty } from "@/components/shelf";
import { formatTime, pageNumber } from "@/lib/format";
import { offsetFor } from "@/lib/page";
import { rpc } from "@/lib/rpc";
import type { Activity as Entry, Page } from "@/lib/types";

export const metadata: Metadata = { title: "Activity" };

const HREF: Record<string, (id: string) => string> = {
  product: (id) => `/products/${id}`,
  submission: (id) => `/review/${id}`,
  user: (id) => `/users/${id}`,
};

export default async function Activity({ searchParams }: PageProps<"/activity">) {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const { total, rows } = await rpc<Page<Entry>>("admin_list_activity", { p_limit: 50, p_offset: offsetFor(page) });

  return (
    <>
      <PageTitle>Activity</PageTitle>
      {rows.length > 0 ? (
        <ul className="rows">
          {rows.map((a) => {
            const href = a.target_id && a.action !== "user.deleted" ? HREF[a.target_type]?.(a.target_id) : undefined;
            return (
              <li key={a.id} className="row">
                {href ? <Link href={href}>{a.summary}</Link> : <span>{a.summary}</span>}
                <small>{a.actor ?? "Former admin"}, {formatTime(a.created_at)}</small>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty>Every change made here is recorded on this page.</Empty>
      )}
      <Pager page={page} total={total} href={(p) => `/activity?page=${p}`} />
    </>
  );
}
