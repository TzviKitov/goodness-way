import { listCategories } from "@/lib/search/queries";
import { NewArticleWizard } from "./wizard";

export const metadata = {
  title: "מאמר חדש",
};

export default async function NewArticlePage() {
  const cats = await listCategories();
  return (
    <NewArticleWizard
      categories={cats.map((c) => ({ id: c.id, nameHe: c.nameHe }))}
    />
  );
}
