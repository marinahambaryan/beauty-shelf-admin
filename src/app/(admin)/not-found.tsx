import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty">
      <p>This page doesn&rsquo;t exist, or what it showed has been deleted.</p>
      <Link href="/" className="button button-primary">Go to review</Link>
    </div>
  );
}
