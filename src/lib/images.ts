import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { RpcError } from "@/lib/rpc";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "catalog-images";
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { "image/webp": "webp", "image/png": "png", "image/jpeg": "jpg" };

function fileNameFor(productName: string, extension: string) {
  const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `${slug || "product"}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
}

async function store(body: Blob, type: string, productName: string) {
  const extension = EXTENSIONS[type];
  if (!extension) throw new RpcError("That file type isn't supported. Use a WebP, PNG or JPG image.");
  if (body.size > MAX_IMAGE_BYTES) throw new RpcError("That image is over 2 MB. Choose a smaller one.");
  const fileName = fileNameFor(productName, extension);
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, body, { contentType: type });
  if (error) throw new RpcError("The image didn't upload. Try again.");
  return `${BUCKET}/${fileName}`;
}

/** Uploads the form's `image` file, if there is one, and returns its catalogue path. */
export async function uploadImage(form: FormData, productName: string) {
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  return store(file, file.type, productName);
}

/** Private, loopback and link-local addresses: never fetched, so a page can't point us inside. */
function isPrivate(address: string) {
  if (isIP(address) === 6) {
    const a = address.toLowerCase();
    if (a.startsWith("::ffff:")) return isPrivate(a.slice(7));
    return a === "::1" || a === "::" || a.startsWith("fc") || a.startsWith("fd") || a.startsWith("fe8") ||
      a.startsWith("fe9") || a.startsWith("fea") || a.startsWith("feb");
  }
  const [a, b] = address.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

async function assertPublic(url: URL) {
  if (url.protocol !== "https:") throw new RpcError("Only https photos can be used.");
  if (url.username || url.password || (url.port && url.port !== "443")) throw new RpcError("That photo address can't be used.");
  const addresses = await lookup(url.hostname, { all: true }).catch(() => []);
  if (addresses.length === 0 || addresses.some((a) => isPrivate(a.address))) {
    throw new RpcError("That photo couldn't be reached.");
  }
}

/**
 * Copies a photo from the shop page into the catalogue bucket. Follows at most three redirects,
 * checking each hop, and reads at most 2 MB.
 */
export async function copyPageImage(address: string, productName: string) {
  let url = new URL(address);
  let response: Response | null = null;
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(url);
    response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: { accept: "image/webp,image/png,image/jpeg" },
    });
    const next = response.status >= 300 && response.status < 400 ? response.headers.get("location") : null;
    if (!next) break;
    url = new URL(next, url);
    response = null;
  }
  if (!response || !response.ok) throw new RpcError("That photo couldn't be downloaded. Upload it instead.");

  const type = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!EXTENSIONS[type]) throw new RpcError("That photo isn't a WebP, PNG or JPG. Upload one instead.");
  if (Number(response.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES) {
    throw new RpcError("That photo is over 2 MB. Upload a smaller one.");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new RpcError("That photo couldn't be downloaded. Upload it instead.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new RpcError("That photo is over 2 MB. Upload a smaller one.");
    }
    chunks.push(value);
  }
  return store(new Blob(chunks as BlobPart[], { type }), type, productName);
}
