import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteUser, setAdmin, setSuspended } from "@/actions/users";
import { ActionButton, ConfirmButton } from "@/components/form";
import { formatDate } from "@/lib/format";
import { rpc } from "@/lib/rpc";
import type { User } from "@/lib/types";

export const metadata: Metadata = { title: "Account" };

const STATUS = { pending: "Waiting", approved: "Approved", rejected: "Rejected" };

export default async function Account({ params }: PageProps<"/users/[id]">) {
  const { id } = await params;
  const user = await rpc<User | null>("admin_get_user", { p_id: id });
  if (!user) notFound();

  const status = [user.is_admin && "Admin", user.is_suspended && "Suspended"].filter(Boolean).join(", ") || "Active";

  return (
    <>
      <p className="back"><Link href="/users">People</Link></p>
      <h1 className="title">{user.email}</h1>
      <dl className="facts">
        <dt>Status</dt><dd>{status}</dd>
        <dt>Joined</dt><dd>{formatDate(user.created_at)}</dd>
        <dt>Last signed in</dt><dd>{formatDate(user.last_sign_in_at)}</dd>
        <dt>Products in library</dt><dd>{user.library_count}</dd>
        <dt>Shelves</dt><dd>{user.shelf_count}</dd>
        <dt>Collections</dt><dd>{user.collection_count}</dd>
      </dl>
      <p className="aside">Libraries are private, so you see totals only.</p>

      {user.submissions.length > 0 && (
        <div className="block">
          <h2>Sent for the catalogue</h2>
          <ul className="rows">
            {user.submissions.map((s) => (
              <li key={s.id} className="row">
                <Link href={`/review/${s.id}`}>{s.brand_name} {s.name}</Link>
                <small>{STATUS[s.status]}, {formatDate(s.created_at)}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {user.is_self ? (
        <p className="aside block">This is your account. Another admin can change its access.</p>
      ) : (
        <div className="block">
          <h2>Access</h2>
          <div className="actions-column">
            <ActionButton action={setAdmin.bind(null, id, !user.is_admin)}>
              {user.is_admin ? "Remove admin access" : "Give admin access"}
            </ActionButton>
            {user.is_admin ? (
              <p className="aside">Remove admin access before suspending or deleting this account.</p>
            ) : (
              <>
                {user.is_suspended ? (
                  <ActionButton action={setSuspended.bind(null, id, false)}>Restore account</ActionButton>
                ) : (
                  <ConfirmButton
                    label="Suspend"
                    title={`Suspend ${user.email}?`}
                    body="They can't sign in again until you restore the account. Their library stays as it is. If they're signed in, they stay signed in until their session ends, up to an hour."
                    action={setSuspended.bind(null, id, true)}
                  />
                )}
                <ConfirmButton
                  label="Delete account"
                  title={`Delete ${user.email}?`}
                  body="This permanently deletes their account, library, photos and history. This can't be undone."
                  typeToConfirm={user.email}
                  action={deleteUser.bind(null, id, user.email)}
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
