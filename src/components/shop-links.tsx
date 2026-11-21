import { deleteLink, moveLink, saveLink } from "@/actions/photos";
import { Text } from "@/components/fields";
import { ActionButton, ActionForm, SubmitButton } from "@/components/form";
import type { ProductLink } from "@/lib/types";

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** Where to buy (D44): the shop links people see on the product page, in this order. */
export function ShopLinks({ productId, links }: { productId: string; links: ProductLink[] }) {
  return (
    <>
      {links.length === 0 && <p className="aside">No shop links yet. People see them under &ldquo;Where to buy&rdquo;.</p>}
      {links.map((link, i) => (
        <details key={link.id} className="variant">
          <summary>
            <span>{link.shop}</span>
            <small>{hostOf(link.url)}</small>
          </summary>
          <ActionForm action={saveLink.bind(null, productId, link.id)} className="stack">
            <Text label="Shop name" name="shop" defaultValue={link.shop} maxLength={80} required />
            <Text label="Link" name="url" type="url" defaultValue={link.url} required />
            <div className="actions">
              <SubmitButton variant="quiet">Save changes</SubmitButton>
            </div>
          </ActionForm>
          <div className="actions">
            <a href={link.url} target="_blank" rel="noreferrer noopener" className="button button-quiet">Open ↗</a>
            {i > 0 && <ActionButton action={moveLink.bind(null, productId, link.id, -1)}>Move up</ActionButton>}
            {i < links.length - 1 && <ActionButton action={moveLink.bind(null, productId, link.id, 1)}>Move down</ActionButton>}
            <ActionButton action={deleteLink.bind(null, productId, link.id)} variant="danger">Remove</ActionButton>
          </div>
        </details>
      ))}
      <ActionForm action={saveLink.bind(null, productId, null)} className="stack add-variant" resetOnSave>
        <Text label="Add a shop link" name="url" type="url" required placeholder="https://" />
        <Text label="Shop name" name="shop" maxLength={80} hint="Optional. Left empty, it uses the site’s name." />
        <SubmitButton variant="quiet">Add</SubmitButton>
      </ActionForm>
    </>
  );
}
