import { Link } from "@/lib/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/utils/site";

export async function SiteFooter() {
  const t = await getTranslations();
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer border-t border-border mt-16">
      <div className="container-wide py-8 text-sm text-muted-foreground flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          &copy; {year} {siteConfig.name}. {t("footer.rights")}.
        </div>
        <nav className="flex gap-5 flex-wrap">
          <Link href="/about" className="hover:text-foreground">
            {t("footer.about")}
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            {t("footer.privacy")}
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            {t("footer.terms")}
          </Link>
          <a href="/rss.xml" className="hover:text-foreground">
            {t("footer.rss")}
          </a>
        </nav>
      </div>
    </footer>
  );
}
