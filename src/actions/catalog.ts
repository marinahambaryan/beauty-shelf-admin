"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadImage } from "@/lib/images";
import { rpc } from "@/lib/rpc";
import { attempt, field } from "./run";
import type { ActionState } from "./state";

export async function saveProduct(id: string | null, _: ActionState, form: FormData): Promise<ActionState> {
  let savedId = id;
  const result = await attempt(id ? "Saved" : "Product added", async () => {
    const name = field(form, "name");
    savedId = await rpc<string>("admin_save_product", {
      p_id: id,
      p_brand_name: field(form, "brand"),
      p_name: name,
      p_category: field(form, "category"),
      p_description: field(form, "description") || null,
      p_image_url: await uploadImage(form, name),
    });
  });
  if (result.error) return result;
  revalidatePath("/products", "layout");
  if (!id) redirect(`/products/${savedId}`);
  return result;
}

export async function setProductStatus(id: string, status: "active" | "archived"): Promise<ActionState> {
  const result = await attempt(status === "archived" ? "Archived" : "Restored", () =>
    rpc("admin_set_product_status", { p_id: id, p_status: status }),
  );
  revalidatePath("/products", "layout");
  return result;
}

export async function clearProductImage(id: string): Promise<ActionState> {
  const result = await attempt("Image removed", () => rpc("admin_clear_product_image", { p_id: id }));
  revalidatePath(`/products/${id}`);
  return result;
}

export async function saveVariant(
  productId: string,
  variantId: string | null,
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const result = await attempt("Saved", () =>
    rpc("admin_save_variant", {
      p_id: variantId,
      p_product_id: productId,
      p_label: field(form, "label") || null,
      p_kind: field(form, "kind") || "shade",
      p_barcode: field(form, "barcode") || null,
    }),
  );
  revalidatePath(`/products/${productId}`);
  return result;
}

export async function deleteVariant(productId: string, variantId: string): Promise<ActionState> {
  const result = await attempt("Deleted", () => rpc("admin_delete_variant", { p_id: variantId }));
  revalidatePath(`/products/${productId}`);
  return result;
}

export async function saveBrand(id: string | null, _: ActionState, form: FormData): Promise<ActionState> {
  const result = await attempt(id ? "Saved" : "Brand added", () =>
    rpc("admin_save_brand", { p_id: id, p_name: field(form, "name") }),
  );
  revalidatePath("/brands");
  return result;
}

export async function deleteBrand(id: string): Promise<ActionState> {
  const result = await attempt("Deleted", () => rpc("admin_delete_brand", { p_id: id }));
  revalidatePath("/brands");
  return result;
}
