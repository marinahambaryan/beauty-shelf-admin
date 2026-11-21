import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/fields";
import { Pager } from "@/components/pager";
import { ProductImage } from "@/components/product-image";
import { Empty } from "@/components/shelf";
import { CATEGORIES, categoryLabel, catalogImageUrl, pageNumber, textParam } from "@/lib/format";
import { offsetFor } from "@/lib/page";
import { rpc } from "@/lib/rpc";
import type { Page, ProductRow } from "@/lib/types";

export const metadata: Metadata = { title: "Products" };

export default async function Products({ searchParams }: PageProps<"/products">) {
  const params = await searchParams;
  const q = textParam(params.q);
  const category = CATEGORIES.find((c) => c === params.category);
  const status = params.status === "archived" ? "archived" : params.status === "all" ? null : "active";
  const page = pageNumber(params.page);
  const { total, rows } = await rpc<Page<ProductRow>>("admin_list_products", {
    p_query: q ?? null,
    p_category: category ?? null,
    p_status: status,
    p_limit: 50,
    p_offset: offsetFor(page),
  });

  const hrefFor = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (category) s.set("category", category);
    if (status !== "active") s.set("status", status ?? "all");
    s.set("page", String(p));
    return `/products?${s}`;
  };

  return (
    <>
      <PageTitle action={<Link href="/products/new" className="button button-primary">Add product</Link>}>
        Products
      </PageTitle>
      <form className="filters" role="search">
        <input type="search" name="q" defaultValue={q} placeholder="Search products or brands" aria-label="Search products or brands" />
        <select name="category" defaultValue={category ?? ""} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
        </select>
        <select name="status" defaultValue={status ?? "all"} aria-label="Status">
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">Active and archived</option>
        </select>
        <button type="submit" className="button button-quiet">Search</button>
      </form>

      {rows.length > 0 ? (
        <table>
          <thead>
            <tr><th colSpan={2}>Product</th><th>Category</th><th>Shades and sizes</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="thumb"><ProductImage src={catalogImageUrl(p.image_url)} alt="" /></td>
                <td>
                  <Link href={`/products/${p.id}`}>{p.name}</Link>
                  <small>{p.brand_name}</small>
                </td>
                <td>{categoryLabel(p.category)}</td>
                <td>{p.variant_count}</td>
                <td>{p.catalog_status === "active" ? "Active" : "Archived"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty action={<Link href="/products/new" className="button button-primary">Add product</Link>}>
          {q ? `No matches for “${q}”.` : "No products match these filters."}
        </Empty>
      )}
      <Pager page={page} total={total} href={hrefFor} />
    </>
  );
}
