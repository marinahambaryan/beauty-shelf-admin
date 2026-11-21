export const CATEGORIES = ["makeup", "skincare", "fragrance", "haircare", "body", "tools", "other"] as const;

export const categoryLabel = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDate = (value: string | null) => (value ? dateFormat.format(new Date(value)) : "Never");
export const formatTime = (value: string) => timeFormat.format(new Date(value));

export const pageNumber = (value: string | string[] | undefined) => {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
};

export const textParam = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

/**
 * Catalogue image fields hold a full URL or a path in the public bucket
 * ("catalog-images/x.webp"). Same rule as the app's src/data/images.ts.
 */
export function catalogImageUrl(value: string | null | undefined) {
  const v = value?.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${v.replace(/^\/+/, "")}`;
}
