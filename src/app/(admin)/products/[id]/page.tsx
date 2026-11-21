import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { clearProductImage, deleteVariant, saveVariant, setProductStatus } from "@/actions/catalog";
import { ActionButton, ActionForm, ConfirmButton, SubmitButton } from "@/components/form";
import { ShadeOrSize, Text } from "@/components/fields";
import { ProductForm } from "@/components/product-form";
import { PhotoPicker } from "@/components/photo-picker";
import { OnGlass } from "@/components/shelf";
import { ShopLinks } from "@/components/shop-links";
import { catalogImageUrl, textParam } from "@/lib/format";
import { obfPhotos, shopPagePhotos } from "@/lib/photo-sources";
import { rpc } from "@/lib/rpc";
import type { Brand, Product, Variant } from "@/lib/types";

export const metadata: Metadata = { title: "Product" };

function VariantRow({ productId, variant, canDelete }: { productId: string; variant: Variant; canDelete: boolean }) {
  const name = variant.label ?? "This product has no shade or size";
  const held = variant.in_libraries === 1 ? "In 1 library" : `In ${variant.in_libraries} libraries`;
  return (
    <details className="variant">
      <summary>
        <span>{name}</span>
        <small>{held}</small>
      </summary>
      <ActionForm action={saveVariant.bind(null, productId, variant.id)} className="stack">
        <Text label="Shade or size" name="label" defaultValue={variant.label ?? ""} maxLength={120} />
        <ShadeOrSize defaultValue={variant.size_label ? "size" : "shade"} />
        <Text label="Barcode" name="barcode" defaultValue={variant.barcode ?? ""} inputMode="numeric" />
        <div className="actions">
          <SubmitButton variant="quiet">Save changes</SubmitButton>
        </div>
      </ActionForm>
      {canDelete && (
        <ConfirmButton
          label="Delete"
          title={`Delete ${variant.label ?? "this entry"}?`}
          body="It leaves the catalogue. This only works if nobody has it in their library or shopping list."
          action={deleteVariant.bind(null, productId, variant.id)}
        />
      )}
    </details>
  );
}

async function pagePhotos(address: string | undefined) {
  if (!address) return null;
  let host = address;
  try {
    host = new URL(address).hostname.replace(/^www\./, "");
  } catch {
    return { url: address, host, photos: [], error: "That isn’t a full link. Paste the https:// address of the page." };
  }
  return { url: address, host, ...(await shopPagePhotos(address)) };
}

export default async function ProductPage({ params, searchParams }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const photosFrom = textParam((await searchParams).photosFrom);
  const [product, brands] = await Promise.all([
    rpc<Product | null>("admin_get_product", { p_id: id }),
    rpc<Brand[]>("admin_list_brands"),
  ]);
  if (!product) notFound();
  const [obf, page] = await Promise.all([
    obfPhotos(product.variants.map((v) => v.barcode).filter((b): b is string => Boolean(b))),
    pagePhotos(photosFrom),
  ]);
  const archived = product.catalog_status === "archived";
  const unnamed = product.variants.some((v) => v.is_default && !v.label);

  return (
    <>
      <p className="back"><Link href="/products">Products</Link></p>
      <div className="review">
        <section className="sent">
          <OnGlass src={catalogImageUrl(product.image_url)} alt={product.name} />
          {product.image_needs_review && <p className="aside">This photo was flagged as weak on import. Choose a better one below.</p>}
          {product.image_credit && <p className="aside">{product.image_credit}</p>}
          <PhotoPicker key={product.image_url} productId={id} name={product.name} obf={obf} page={page} open={Boolean(page) || product.image_needs_review || !product.image_url} />
          {product.image_url && (
            <ActionButton action={clearProductImage.bind(null, id)}>Remove image</ActionButton>
          )}
          <div className="block">
            {archived ? (
              <ActionButton action={setProductStatus.bind(null, id, "active")}>Restore</ActionButton>
            ) : (
              <ConfirmButton
                label="Archive"
                title={`Archive ${product.name}?`}
                body="It stops appearing in search. Anyone who has it keeps it in their library."
                action={setProductStatus.bind(null, id, "archived")}
              />
            )}
          </div>
        </section>

        <section>
          <h1 className="title">{product.name}</h1>
          {archived && <p className="lede">Archived. It doesn&rsquo;t appear in search.</p>}
          <div className="block">
            <ProductForm key={product.image_url} product={product} brands={brands} />
          </div>

          <div className="block">
            <h2>Where to buy</h2>
            <ShopLinks productId={id} links={product.links ?? []} />
          </div>

          <div className="block">
            <h2>Shades and sizes</h2>
            {product.variants.map((v) => (
              <VariantRow key={v.id} productId={id} variant={v} canDelete={product.variants.length > 1} />
            ))}
            {unnamed ? (
              <p className="aside">To add shades or sizes, name the entry above first, so people can tell them apart.</p>
            ) : (
              <ActionForm action={saveVariant.bind(null, id, null)} className="stack add-variant" resetOnSave>
                <Text label="Add a shade or size" name="label" required maxLength={120} />
                <ShadeOrSize />
                <Text label="Barcode" name="barcode" inputMode="numeric" hint="Optional. 8 to 14 digits." />
                <SubmitButton variant="quiet">Add</SubmitButton>
              </ActionForm>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
