"use client";

export default function PageError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="empty">
      <p>This page didn&rsquo;t load. Check the connection to the database and try again.</p>
      <button className="button button-primary" onClick={reset}>Try again</button>
    </div>
  );
}
