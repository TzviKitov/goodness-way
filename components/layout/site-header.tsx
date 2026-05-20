import { Link } from "@/lib/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { listCategories } from "@/lib/search/queries";
import { SearchBar } from "@/components/search/search-bar";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const t = await getTranslations();
  let categories: Array<{ slug: string; nameHe: string }> = [];
  try {
    categories = (await listCategories()).map((c) => ({
      slug: c.slug,
      nameHe: c.nameHe,
    }));
  } catch {
    categories = [];
  }

  return (
    <header className="site-header sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-1.5 focus:rounded"
      >
        {t("site.skipToContent")}
      </a>
      <div className="container-wide flex items-center gap-4 h-16">
        <Link
          href="/"
          className="text-xl md:text-2xl font-bold tracking-wide whitespace-nowrap"
        >
          {t("site.name")}
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            {t("nav.recent")}
          </Link>
          {categories.slice(0, 5).map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="hover:text-foreground"
            >
              {c.nameHe}
            </Link>
          ))}
          <Link href="/about" className="hover:text-foreground">
            {t("nav.about")}
          </Link>
        </nav>
        <div className="hidden md:block flex-1" />
        <div className="hidden md:block w-64">
          <SearchBar compact />
        </div>
        <div className="md:hidden flex-1" />
        <MobileNav categories={categories} />
      </div>
    </header>
  );
}
