"use client";

import "./globals.css";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="sign-in">
      <h1>Beauty Shelf admin</h1>
      <p>Can&rsquo;t reach the database right now. Check it&rsquo;s running and try again.</p>
      <button className="button button-primary" onClick={reset}>Try again</button>
    </main>
  );
}
