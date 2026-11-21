import type { Metadata } from "next";
import Link from "next/link";
import { deleteBrand, saveBrand } from "@/actions/catalog";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/form";
import { PageTitle, Text } from "@/components/fields";
import { Empty } from "@/components/shelf";
import { rpc } from "@/lib/rpc";
import type { Brand } from "@/lib/types";

export const metadata: Metadata = { title: "Brands" };

export default async function Brands() {
  const brands = await rpc<Brand[]>("admin_list_brands");
  return (
    <>
      <PageTitle>Brands</PageTitle>
      <ActionForm action={saveBrand.bind(null, null)} className="inline-form narrow" resetOnSave>
        <Text label="New brand" name="name" required maxLength={120} />
        <SubmitButton variant="quiet">Add brand</SubmitButton>
      </ActionForm>

      {brands.length > 0 ? (
        <ul className="rows">
          {brands.map((b) => (
            <li key={b.id}>
              <details className="variant">
                <summary>
                  <span>{b.name}</span>
                  <small>
                    {b.product_count === 0 ? "No products" : (
                      <Link href={`/products?q=${encodeURIComponent(b.name)}&status=all`}>
                        {b.product_count} {b.product_count === 1 ? "product" : "products"}
                      </Link>
                    )}
                  </small>
                </summary>
                <ActionForm action={saveBrand.bind(null, b.id)} className="inline-form">
                  <Text label="Name" name="name" defaultValue={b.name} required maxLength={120} />
                  <SubmitButton variant="quiet">Save changes</SubmitButton>
                </ActionForm>
                {b.product_count === 0 && (
                  <ConfirmButton label="Delete" title={`Delete ${b.name}?`}
                    body="It has no products, so nothing else changes."
                    action={deleteBrand.bind(null, b.id)} />
                )}
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Brands appear here when you add them or approve a product.</Empty>
      )}
    </>
  );
}
