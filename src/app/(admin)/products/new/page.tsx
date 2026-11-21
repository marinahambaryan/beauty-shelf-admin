import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/fields";
import { ProductForm } from "@/components/product-form";
import { rpc } from "@/lib/rpc";
import type { Brand } from "@/lib/types";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProduct() {
  const brands = await rpc<Brand[]>("admin_list_brands");
  return (
    <>
      <p className="back"><Link href="/products">Products</Link></p>
      <PageTitle>Add product</PageTitle>
      <div className="narrow"><ProductForm brands={brands} /></div>
    </>
  );
}
