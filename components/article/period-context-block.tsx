import { getTranslations } from "next-intl/server";
import { formatMonthYear } from "@/lib/utils/dates";

type Props = {
  periodAndContext: string | null;
  writtenAt: string | null;
};

export async function PeriodContextBlock({
  periodAndContext,
  writtenAt,
}: Props) {
  if (!periodAndContext && !writtenAt) return null;
  const t = await getTranslations("article");
  return (
    <aside
      className="my-6 rounded-md border-s-4 border-accent bg-muted/40 px-4 py-3"
      aria-label={t("periodTitle")}
    >
      <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
        {t("periodTitle")}
      </h2>
      {periodAndContext && (
        <p className="mt-1 text-base leading-relaxed whitespace-pre-line">
          {periodAndContext}
        </p>
      )}
      {writtenAt && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t("writtenAt")}:{" "}
          <time dateTime={writtenAt}>{formatMonthYear(writtenAt)}</time>
        </p>
      )}
    </aside>
  );
}
