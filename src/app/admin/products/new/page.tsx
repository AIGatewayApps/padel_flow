import { requireRole } from "@/lib/auth";
import ProductForm from "../product-form";

export const metadata = { title: "Admin — New Product" };

export default async function NewProductPage() {
  await requireRole("ADMIN");
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Add product</h1>
      <ProductForm />
    </div>
  );
}
