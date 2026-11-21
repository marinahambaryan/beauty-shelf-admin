"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { copyPageImage, uploadImage } from "@/lib/images";
import { rpc, RpcError } from "@/lib/rpc";
import type { Submission } from "@/lib/types";
import { attempt, field } from "./run";
import type { ActionState } from "./state";

const finish = (result: ActionState, done: string) => {
  if (result.error) return result;
  revalidatePath("/", "layout");
  redirect(`/?done=${done}`);
};

/**
 * The catalogue image: an upload, a photo from the shop page (only one the app recorded for this
 * submission, and only with the brand's permission), or none, so it shows as a drawing.
 */
async function chosenImage(id: string, form: FormData, name: string) {
  const choice = field(form, "photo");
  if (choice === "upload") {
    const path = await uploadImage(form, name);
    if (!path) throw new RpcError("Choose an image to upload, or pick another option.");
    return path;
  }
  if (choice.startsWith("page:")) {
    if (form.get("permission") !== "on") {
      throw new RpcError("Confirm the brand allows using this photo, or upload one instead.");
    }
    const s = await rpc<Submission | null>("admin_get_submission", { p_id: id });
    const address = s?.page_image_urls?.[Number(choice.slice(5))];
    if (!address) throw new RpcError("That photo is no longer on this submission.");
    return copyPageImage(address, name);
  }
  // A file chosen without picking "Upload" still counts: that's what they meant.
  return uploadImage(form, name);
}

export async function approveSubmission(id: string, _: ActionState, form: FormData) {
  const result = await attempt("Added to catalogue", async () => {
    const name = field(form, "name");
    return rpc("admin_approve_submission", {
      p_id: id,
      p_brand_name: field(form, "brand"),
      p_name: name,
      p_category: field(form, "category"),
      p_description: field(form, "description") || null,
      p_variant_label: field(form, "variant") || null,
      p_variant_kind: field(form, "kind") || "shade",
      p_image_url: await chosenImage(id, form, name),
    });
  });
  return finish(result, "approved");
}

export async function linkSubmission(id: string, _: ActionState, form: FormData) {
  const variantId = field(form, "variant");
  if (!variantId) return { error: "Choose a shade or size." };
  const result = await attempt("Linked", () =>
    rpc("admin_link_submission", { p_id: id, p_variant_id: variantId }),
  );
  return finish(result, "linked");
}

export async function rejectSubmission(id: string, _: ActionState, form: FormData) {
  const result = await attempt("Rejected", () =>
    rpc("admin_reject_submission", { p_id: id, p_note: field(form, "reason") || null }),
  );
  return finish(result, "rejected");
}
