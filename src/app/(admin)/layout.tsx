import { signOut } from "@/actions/auth";
import { Nav } from "@/components/nav";
import { requireAdmin } from "@/lib/admin";
import { rpc } from "@/lib/rpc";
import type { Overview } from "@/lib/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const overview = await rpc<Overview>("admin_overview");
  return (
    <div className="frame">
      <aside>
        <p className="wordmark">Beauty Shelf</p>
        <Nav pending={overview.pending} />
        <form action={signOut} className="account">
          <p>{user.email}</p>
          <button type="submit" className="text-button">Sign out</button>
        </form>
      </aside>
      <main>{children}</main>
    </div>
  );
}
