"use client";

import { useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchBar } from "@/components/search/search-bar";

type Props = {
  categories: Array<{ slug: string; nameHe: string }>;
};

export function MobileNav({ categories }: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={t("nav.menu")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-2 -mx-2 rounded-md hover:bg-muted"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-border bg-background shadow-sm">
          <div className="container-wide py-4 space-y-4">
            <SearchBar onSubmit={() => setOpen(false)} />
            <nav className="flex flex-col gap-3 text-base">
              <Link href="/" onClick={() => setOpen(false)}>
                {t("nav.recent")}
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  onClick={() => setOpen(false)}
                >
                  {c.nameHe}
                </Link>
              ))}
              <Link href="/about" onClick={() => setOpen(false)}>
                {t("nav.about")}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
