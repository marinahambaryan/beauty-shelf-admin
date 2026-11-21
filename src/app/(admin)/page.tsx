import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/fields";
import { Pager } from "@/components/pager";
import { Empty, OnGlass } from "@/components/shelf";
import { categoryLabel, formatDate, pageNumber } from "@/lib/format";
import { offsetFor } from "@/lib/page";
import { rpc } from "@/lib/rpc";
import { createClient } from "@/lib/supabase/server";
import type { Overview, Page, SubmissionRow, SubmissionStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Review" };

const DONE: Record<string, string> = {
  approved: "Added to catalogue",
  linked: "Linked to the catalogue",
  rejected: "Rejected",
};
const TABS: { status: SubmissionStatus; label: string }[] = [
  { status: "pending", label: "Waiting" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
];

async function signedPhotos(rows: SubmissionRow[]) {
  const paths = rows.flatMap((r) => (r.image_path ? [r.image_path] : []));
  if (paths.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data } = await supabase.storage.from("product-photos").createSignedUrls(paths, 600);
  return new Map((data ?? []).flatMap((d) => (d.signedUrl && d.path ? [[d.path, d.signedUrl]] : [])));
}

export default async function Review({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const status = TABS.find((t) => t.status === params.status)?.status ?? "pending";
  const page = pageNumber(params.page);
  const [{ total, rows }, overview] = await Promise.all([
    rpc<Page<SubmissionRow>>("admin_list_submissions", { p_status: status, p_limit: 50, p_offset: offsetFor(page) }),
    rpc<Overview>("admin_overview"),
  ]);
  const photos = status === "pending" ? await signedPhotos(rows) : new Map<string, string>();
  const done = typeof params.done === "string" ? DONE[params.done] : undefined;

  return (
    <>
      <PageTitle>Review</PageTitle>
      <p className="lede">
        {overview.pending === 1 ? "1 product is" : `${overview.pending} products are`} waiting.
        The catalogue has {overview.products} products, and {overview.people} people use Beauty Shelf.
      </p>
      {done && <p className="message" role="status">{done}</p>}

      <div className="chips">
        {TABS.map((t) => (
          <Link key={t.status} href={t.status === "pending" ? "/" : `/?status=${t.status}`}
            className="chip" aria-current={t.status === status ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      </div>

      {status === "pending" ? (
        rows.length > 0 ? (
          <ul className="shelf">
            {rows.map((s) => (
              <li key={s.id}>
                <Link href={`/review/${s.id}`}>
                  <OnGlass src={s.image_path ? photos.get(s.image_path) : null} alt="" note={s.note} />
                  <strong>{s.name}</strong>
                  <span>{s.brand_name}{s.variant_label ? `, ${s.variant_label}` : ""}</span>
                  <small>{s.submitted_by}, {formatDate(s.created_at)}</small>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="shelf-empty">
            <div className="glass" />
            <p>Products people send in for the catalogue wait here.</p>
          </div>
        )
      ) : rows.length > 0 ? (
        <table>
          <thead>
            <tr><th>Product</th><th>Category</th><th>From</th><th>Reviewed</th></tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/review/${s.id}`}>{s.name}</Link>
                  <small>{s.brand_name}</small>
                </td>
                <td>{categoryLabel(s.category)}</td>
                <td>{s.submitted_by}</td>
                <td>{formatDate(s.reviewed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty>Reviewed products will show up here.</Empty>
      )}
      <Pager page={page} total={total} href={(p) => `/?status=${status}&page=${p}`} />
    </>
  );
}
