import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { categoryLabel, CATEGORIES } from "@/lib/format";

export function Text({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function LongText({
  label,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={3} {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Category({ defaultValue }: { defaultValue?: string }) {
  return (
    <label className="field">
      <span>Category</span>
      <select name="category" defaultValue={defaultValue ?? "skincare"}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {categoryLabel(c)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function BrandField({ brands, defaultValue }: { brands: { id: string; name: string }[]; defaultValue?: string }) {
  return (
    <label className="field">
      <span>Brand</span>
      <input name="brand" list="brand-names" defaultValue={defaultValue} required autoComplete="off" />
      <small>Choose a brand or type a new one.</small>
      <datalist id="brand-names">
        {brands.map((b) => (
          <option key={b.id} value={b.name} />
        ))}
      </datalist>
    </label>
  );
}

export function ShadeOrSize({ defaultValue }: { defaultValue?: "shade" | "size" }) {
  return (
    <fieldset className="choice">
      <legend>This is a</legend>
      <label>
        <input type="radio" name="kind" value="shade" defaultChecked={defaultValue !== "size"} /> Shade
      </label>
      <label>
        <input type="radio" name="kind" value="size" defaultChecked={defaultValue === "size"} /> Size
      </label>
    </fieldset>
  );
}

export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <header className="page-title">
      <h1>{children}</h1>
      {action}
    </header>
  );
}
