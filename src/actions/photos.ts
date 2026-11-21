"use server";

import { revalidatePath } from "next/cache";
import { copyPageImage, uploadImage } from "@/lib/images";
import { OBF_CREDIT, OBF_IMAGES } from "@/lib/photo-sources";
import { RpcError, rpc } from "@/lib/rpc";
import { attempt, field } from "./run";
import type { ActionState } from "./state";

/**
 * Replaces a catalogue product's photo (D44) with one picked on its admin page: an Open Beauty
 * Facts photo (kept with its CC BY-SA credit), a photo from a shop page (only with permission;
 * no credit) or an upload (no credit). We always store our own copy.
 */
export async function choosePhoto(productId: string, productName: string, _: ActionState, form: FormData): Promise<ActionState> {
  const result = await attempt("Photo changed", async () => {
    const choice = field(form, "photo");
    let path: string | null = null;
    let credit: string | null = null;

    if (choice.startsWith("obf|")) {
      const [, full, small] = choice.split("|");
      if (!full?.startsWith(OBF_IMAGES) || !small?.startsWith(OBF_IMAGES)) throw new RpcError("That photo can't be used.");
      // The largest size can be over 2 MB; the 400 px one always fits.
      path = await copyPageImage(full, productName).catch((e) => {
        if (e instanceof RpcError && /2 MB/.test(e.message)) return copyPageImage(small, productName);
        throw e;
      });
      credit = OBF_CREDIT;
    } else if (choice.startsWith("page|")) {
      if (form.get("permission") !== "on") {
        throw new RpcError("Tick that the brand or shop allows us to use this photo, or upload one instead.");
      }
      path = await copyPageImage(choice.slice(5), productName);
    } else {
      path = await uploadImage(form, productName);
      if (!path) throw new RpcError("Pick a photo above, or choose a file to upload.");
    }
    await rpc("admin_set_product_image", { p_id: productId, p_image_url: path, p_credit: credit });
  });
  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
  return result;
}

/** "https://www.lookfantastic.com/p/x" → "Lookfantastic". */
function shopFromLink(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const name = host.split(".")[0] ?? host;
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "";
  }
}

export async function saveLink(productId: string, linkId: string | null, _: ActionState, form: FormData): Promise<ActionState> {
  const url = field(form, "url");
  const result = await attempt(linkId ? "Saved" : "Link added", () =>
    rpc("admin_save_product_link", {
      p_id: linkId,
      p_product_id: productId,
      p_url: url,
      p_shop: field(form, "shop") || shopFromLink(url),
    }),
  );
  revalidatePath(`/products/${productId}`);
  return result;
}

export async function deleteLink(productId: string, linkId: string): Promise<ActionState> {
  const result = await attempt("Link removed", () => rpc("admin_delete_product_link", { p_id: linkId }));
  revalidatePath(`/products/${productId}`);
  return result;
}

export async function moveLink(productId: string, linkId: string, step: -1 | 1): Promise<ActionState> {
  const result = await attempt("Moved", () => rpc("admin_move_product_link", { p_id: linkId, p_step: step }));
  revalidatePath(`/products/${productId}`);
  return result;
}
