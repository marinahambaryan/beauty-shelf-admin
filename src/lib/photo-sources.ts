import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Where a catalogue photo can come from, besides an upload (D44). */
export type Photo = { thumb: string; full: string; small: string };

export const OBF_IMAGES = "https://images.openbeautyfacts.org/";
export const OBF_CREDIT = "Photo: Open Beauty Facts contributors · CC BY-SA";
const UA = "BeautyShelfAdmin/1.0 (catalogue photos)";
const MAX_PHOTOS = 16;

/** "3282770204667" → "328/277/020/4667", the way Open Beauty Facts files a product's photos. */
const folder = (code: string) => (code.length > 8 ? code.replace(/^(\d{3})(\d{3})(\d{3})(\d+)$/, "$1/$2/$3/$4") : code);

type ObfImages = Record<string, { rev?: string | number; imgid?: string | number }>;

/**
 * Every photo Open Beauty Facts has for these barcodes: the chosen front photos first, then
 * everything people uploaded, newest first. Empty when it can't be reached.
 */
export async function obfPhotos(barcodes: string[]): Promise<Photo[]> {
  const out: Photo[] = [];
  const seen = new Set<string>();
  for (const code of barcodes.filter((c) => /^\d{8,14}$/.test(c)).slice(0, 4)) {
    let images: ObfImages = {};
    try {
      const res = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${code}.json?fields=images`, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(6000),
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      images = ((await res.json()) as { product?: { images?: ObfImages } }).product?.images ?? {};
    } catch {
      continue;
    }
    const base = `${OBF_IMAGES}images/products/${folder(code)}/`;
    // The chosen front photos are tidied crops of an upload, so that upload isn't listed again.
    const fronts = Object.entries(images).filter(([key, v]) => /^front(_[a-z]{2})?$/.test(key) && v.rev);
    const cropped = new Set(fronts.map(([, v]) => String(v.imgid)));
    const photos: Photo[] = [
      ...fronts.map(([key, v]) => ({ thumb: `${base}${key}.${v.rev}.400.jpg`, full: `${base}${key}.${v.rev}.full.jpg`, small: `${base}${key}.${v.rev}.400.jpg` })),
      ...Object.keys(images)
        .filter((key) => /^\d+$/.test(key) && !cropped.has(key))
        .sort((a, b) => Number(b) - Number(a))
        .map((key) => ({ thumb: `${base}${key}.400.jpg`, full: `${base}${key}.jpg`, small: `${base}${key}.400.jpg` })),
    ];
    for (const photo of photos) {
      if (seen.has(photo.full)) continue;
      seen.add(photo.full);
      out.push(photo);
      if (out.length >= MAX_PHOTOS) return out;
    }
  }
  return out;
}

/** The product photos on a shop page, read by the same Edge Function the app's "Add from a link" uses. */
export async function shopPagePhotos(url: string): Promise<{ photos: Photo[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke<{ product?: { images?: string[] } }>("product-from-link", {
    body: { url },
  });
  if (error || !data?.product) {
    const status = (error as { context?: Response } | null)?.context?.status;
    return {
      photos: [],
      error: status === 429 ? "Too many page lookups this hour. Try again later." : "That page couldn't be read. Check the link, or save the photo and upload it.",
    };
  }
  const photos = (data.product.images ?? []).map((src) => ({ thumb: src, full: src, small: src }));
  return { photos, error: photos.length ? null : "That page has no product photos we can read." };
}
