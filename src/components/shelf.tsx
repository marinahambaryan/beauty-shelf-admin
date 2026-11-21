import type { ReactNode } from "react";
import { ProductImage } from "./product-image";

/** A product standing on glass, as it does on a shelf in the app. */
export function OnGlass({ src, alt, note }: { src?: string | null; alt: string; note?: string | null }) {
  return (
    <div className="on-glass">
      {note && <p className="hand">{note}</p>}
      <div className="stands">
        <ProductImage src={src} alt={alt} />
      </div>
    </div>
  );
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <p>{children}</p>
      {action}
    </div>
  );
}
