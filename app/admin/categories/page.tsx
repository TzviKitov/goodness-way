import { listCategories } from "@/lib/search/queries";
import { CategoriesEditor } from "./editor";

export default async function CategoriesPage() {
  const cats = await listCategories();
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">קטגוריות</h1>
      <CategoriesEditor
        initial={cats.map((c) => ({
          id: c.id,
          slug: c.slug,
          nameHe: c.nameHe,
          description: c.description ?? "",
          displayOrder: c.displayOrder,
        }))}
      />
    </div>
  );
}
