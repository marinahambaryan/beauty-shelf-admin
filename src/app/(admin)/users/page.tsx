import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/fields";
import { Pager } from "@/components/pager";
import { Empty } from "@/components/shelf";
import { formatDate, pageNumber, textParam } from "@/lib/format";
import { offsetFor } from "@/lib/page";
import { rpc } from "@/lib/rpc";
import type { Page, UserRow } from "@/lib/types";

export const metadata: Metadata = { title: "People" };

const statusOf = (u: UserRow) => [u.is_admin && "Admin", u.is_suspended && "Suspended"].filter(Boolean).join(", ") || "Active";

export default async function People({ searchParams }: PageProps<"/users">) {
  const params = await searchParams;
  const q = textParam(params.q);
  const page = pageNumber(params.page);
  const { total, rows } = await rpc<Page<UserRow>>("admin_list_users", {
    p_query: q ?? null,
    p_limit: 50,
    p_offset: offsetFor(page),
  });

  return (
    <>
      <PageTitle>People</PageTitle>
      {params.done === "deleted" && <p className="message" role="status">Account deleted</p>}
      <form className="filters" role="search">
        <input type="search" name="q" defaultValue={q} placeholder="Search by email" aria-label="Search by email" />
        <button type="submit" className="button button-quiet">Search</button>
      </form>

      {rows.length > 0 ? (
        <table>
          <thead>
            <tr><th>Email</th><th>Joined</th><th>Last signed in</th><th>Library</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td><Link href={`/users/${u.id}`}>{u.email}</Link></td>
                <td>{formatDate(u.created_at)}</td>
                <td>{formatDate(u.last_sign_in_at)}</td>
                <td>{u.library_count}</td>
                <td>{statusOf(u)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty>{q ? `No matches for “${q}”.` : "People appear here when they sign up."}</Empty>
      )}
      <Pager page={page} total={total}
        href={(p) => `/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`} />
    </>
  );
}
