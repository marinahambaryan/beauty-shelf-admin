import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { approveSubmission, linkSubmission, rejectSubmission } from "@/actions/review";
import { ActionForm, SubmitButton } from "@/components/form";
import { ImageChoice } from "@/components/image-choice";
import { BrandField, Category, LongText, ShadeOrSize, Text } from "@/components/fields";
import { OnGlass } from "@/components/shelf";
import { categoryLabel, formatDate } from "@/lib/format";
import { rpc } from "@/lib/rpc";
import { createClient } from "@/lib/supabase/server";
import type { Brand, SimilarProduct, Submission } from "@/lib/types";

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export const metadata: Metadata = { title: "Review product" };

function Similar({ submissionId, product }: { submissionId: string; product: SimilarProduct }) {
  const action = linkSubmission.bind(null, submissionId);
  const only = product.variants.length === 1 ? product.variants[0] : null;
  return (
    <li>
      <div>
        <Link href={`/products/${product.id}`}>{product.name}</Link>
        <small>{product.brand_name}, {categoryLabel(product.category)}</small>
      </div>
      <ActionForm action={action} className="link-form">
        {only ? (
          <input type="hidden" name="variant" value={only.id} />
        ) : (
          <select name="variant" aria-label={`Shade or size of ${product.name}`} defaultValue="">
            <option value="" disabled>Choose a shade or size</option>
            {product.variants.map((v) => (
              <option key={v.id} value={v.id}>{v.label ?? "No shade or size"}</option>
            ))}
          </select>
        )}
        <SubmitButton variant="quiet">Link to this</SubmitButton>
      </ActionForm>
    </li>
  );
}

export default async function ReviewProduct({ params }: PageProps<"/review/[id]">) {
  const { id } = await params;
  const s = await rpc<Submission | null>("admin_get_submission", { p_id: id });
  if (!s) notFound();

  const pending = s.status === "pending";
  let photo: string | null = null;
  if (pending && s.image_path) {
    const supabase = await createClient();
    const { data } = await supabase.storage.from("product-photos").createSignedUrl(s.image_path, 600);
    photo = data?.signedUrl ?? null;
  }
  const brands = pending ? await rpc<Brand[]>("admin_list_brands") : [];
  const pagePhotos = s.page_image_urls ?? [];
  const brandKnown = brands.some((b) => b.name.toLowerCase() === s.brand_name.toLowerCase());

  return (
    <>
      <p className="back"><Link href="/">Review</Link></p>
      <div className="review">
        <section className="sent">
          <OnGlass src={photo} alt={`Photo of ${s.name}, sent by the person`} note={s.note} />
          <dl>
            <dt>From</dt>
            <dd><Link href={`/users/${s.submitter_id}`}>{s.submitted_by}</Link></dd>
            <dt>Sent</dt>
            <dd>{formatDate(s.created_at)}</dd>
            <dt>Brand</dt>
            <dd>{s.brand_name}{brands.length > 0 && !brandKnown ? " (new brand)" : ""}</dd>
            {s.variant_label && (<><dt>Shade or size</dt><dd>{s.variant_label}</dd></>)}
            {s.barcode && (<><dt>Barcode</dt><dd>{s.barcode}</dd></>)}
            {s.source_url && (
              <>
                <dt>Link</dt>
                <dd><a href={s.source_url} target="_blank" rel="noopener noreferrer">{hostOf(s.source_url)}</a></dd>
              </>
            )}
          </dl>
          {pending && s.source_url && (
            <p className="aside">Added from a shop link. On their shelf it&rsquo;s a drawing until you approve it with an image.</p>
          )}
          {pending && photo && (
            <p className="aside">Their photo is for reviewing only. It doesn&rsquo;t go into the catalogue.</p>
          )}
        </section>

        <section>
          <h1 className="title">{s.name}</h1>
          {!pending && (
            <p className="lede">
              {s.status === "approved" ? "Approved" : "Rejected"} on {formatDate(s.reviewed_at)}
              {s.reviewer ? ` by ${s.reviewer}` : ""}.{" "}
              {s.product_id && <Link href={`/products/${s.product_id}`}>{s.product_name}</Link>}
              {s.review_note && ` ${s.review_note}`}
            </p>
          )}

          {pending && (
            <>
              {s.similar.length > 0 && (
                <div className="block">
                  <h2>Already in the catalogue?</h2>
                  <ul className="similar">
                    {s.similar.map((p) => <Similar key={p.id} submissionId={s.id} product={p} />)}
                  </ul>
                  <p className="aside">Shade or size missing? Add it on the product&rsquo;s page, then link to it here.</p>
                </div>
              )}

              <div className="block">
                <h2>Add to catalogue</h2>
                <ActionForm action={approveSubmission.bind(null, s.id)} className="stack">
                  <BrandField brands={brands} defaultValue={s.brand_name} />
                  <Text label="Name" name="name" defaultValue={s.name} required maxLength={200} />
                  <Category defaultValue={s.category} />
                  <LongText label="Description" name="description" maxLength={2000}
                    hint="Say what it is, not what it does: “Face oil.”" />
                  <Text label="Shade or size" name="variant" defaultValue={s.variant_label ?? ""} maxLength={120}
                    hint="Leave empty if it comes in one version." />
                  <ShadeOrSize />
                  <ImageChoice pagePhotos={pagePhotos} name={s.name} />
                  <SubmitButton>Add to catalogue</SubmitButton>
                </ActionForm>
              </div>

              <div className="block">
                <h2>Reject</h2>
                <ActionForm action={rejectSubmission.bind(null, s.id)} className="stack">
                  <LongText label="Reason" name="reason" maxLength={500}
                    hint="Optional. Write it for the person who sent this." />
                  <SubmitButton variant="danger">Reject</SubmitButton>
                </ActionForm>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
