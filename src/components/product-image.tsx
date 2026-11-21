"use client";

import { useState } from "react";

/** The neutral stand-in the app uses until a product has a photo. */
function Bottle() {
  return (
    <svg className="bottle" viewBox="0 0 60 120" aria-hidden="true">
      <rect x="20" y="0" width="20" height="26" rx="3" />
      <rect x="6" y="30" width="48" height="90" rx="9" />
    </svg>
  );
}

/** Falls back to the bottle too when a file is missing from storage. */
export function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <Bottle />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- storage URLs differ per project
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      // An image can fail before the page hydrates, when onError isn't listening yet.
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) setFailed(true);
      }}
    />
  );
}
