import { saveProduct } from "@/actions/catalog";
import { ActionForm, SubmitButton } from "@/components/form";
import { BrandField, Category, LongText, Text } from "@/components/fields";
import type { Brand, Product } from "@/lib/types";

export function ProductForm({ product, brands }: { product?: Product; brands: Brand[] }) {
  return (
    <ActionForm action={saveProduct.bind(null, product?.id ?? null)} className="stack">
      <BrandField brands={brands} defaultValue={product?.brand_name} />
      <Text label="Name" name="name" defaultValue={product?.name} required maxLength={200} />
      <Category defaultValue={product?.category} />
      <LongText label="Description" name="description" defaultValue={product?.description ?? ""} maxLength={2000}
        hint="Say what it is, not what it does: “Face oil.”" />
      {!product && (
        <label className="field">
          <span>Image</span>
          <input type="file" name="image" accept="image/webp,image/png,image/jpeg" />
          <small>WebP, PNG or JPG, up to 2 MB. Use images you have the rights to.</small>
        </label>
      )}
      <SubmitButton>{product ? "Save changes" : "Add product"}</SubmitButton>
    </ActionForm>
  );
}
