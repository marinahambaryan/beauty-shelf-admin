export type SubmissionStatus = "pending" | "approved" | "rejected";
export type CatalogStatus = "active" | "archived";
export type Page<T> = { total: number; rows: T[] };

export type Overview = { pending: number; products: number; people: number };

export type SubmissionRow = {
  id: string;
  brand_name: string;
  name: string;
  category: string;
  variant_label: string | null;
  image_path: string | null;
  note: string | null;
  status: SubmissionStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  product_id: string | null;
  submitted_by: string;
  source_url: string | null;
  page_image_urls: string[] | null;
  barcode: string | null;
};

export type SimilarProduct = {
  id: string;
  name: string;
  brand_name: string;
  category: string;
  image_url: string | null;
  catalog_status: CatalogStatus;
  variants: { id: string; label: string | null; is_default: boolean }[];
};

export type Submission = SubmissionRow & {
  submitter_id: string;
  reviewer: string | null;
  product_name: string | null;
  similar: SimilarProduct[];
};

export type ProductRow = {
  id: string;
  name: string;
  brand_name: string;
  category: string;
  image_url: string | null;
  catalog_status: CatalogStatus;
  variant_count: number;
};

export type Variant = {
  id: string;
  label: string | null;
  shade_name: string | null;
  size_label: string | null;
  barcode: string | null;
  is_default: boolean;
  in_libraries: number;
};

export type Product = {
  id: string;
  name: string;
  brand_name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  image_credit: string | null;
  image_needs_review: boolean;
  source_url: string | null;
  catalog_status: CatalogStatus;
  variants: Variant[];
  links: ProductLink[];
};

export type ProductLink = { id: string; url: string; shop: string };

export type Brand = { id: string; name: string; product_count: number };

export type UserRow = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_suspended: boolean;
  is_admin: boolean;
  library_count: number;
};

export type User = UserRow & {
  is_self: boolean;
  collection_count: number;
  shelf_count: number;
  submissions: {
    id: string;
    name: string;
    brand_name: string;
    status: SubmissionStatus;
    created_at: string;
  }[];
};

export type Activity = {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  summary: string;
  created_at: string;
  actor: string | null;
};
