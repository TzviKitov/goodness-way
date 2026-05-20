"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  defaultValue?: string;
  compact?: boolean;
  onSubmit?: () => void;
};

export function SearchBar({ defaultValue = "", compact, onSubmit }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
        else router.push("/search");
        onSubmit?.();
      }}
      className="relative"
    >
      <label className="sr-only" htmlFor="site-search">
        {t("nav.search")}
      </label>
      <input
        id="site-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("home.searchPlaceholder")}
        className={`w-full rounded-md border border-input bg-background ps-9 pe-3 ${
          compact ? "py-1.5 text-sm" : "py-2.5 text-base"
        } focus:outline-none focus:ring-2 focus:ring-ring`}
      />
      <Search
        size={compact ? 16 : 18}
        className="absolute top-1/2 -translate-y-1/2 start-2.5 text-muted-foreground pointer-events-none"
      />
    </form>
  );
}
