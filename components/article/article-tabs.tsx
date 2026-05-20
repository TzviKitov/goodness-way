"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { useTranslations } from "next-intl";

type Props = {
  bodyHtml: string;
  summary: string | null;
  editedBodyHtml: string | null;
};

export function ArticleTabs({ bodyHtml, summary, editedBodyHtml }: Props) {
  const t = useTranslations("article");
  const hasSummary = Boolean(summary?.trim());
  const hasEdited = Boolean(editedBodyHtml?.trim());
  const showTabs = hasSummary || hasEdited;

  if (!showTabs) {
    return (
      <div
        className="prose-article"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    );
  }

  return (
    <Tabs.Root defaultValue="original" className="mt-2">
      <Tabs.List className="flex gap-2 border-b border-border mb-6">
        <Tab value="original">{t("tabsOriginal")}</Tab>
        {hasSummary && <Tab value="summary">{t("tabsSummary")}</Tab>}
        {hasEdited && <Tab value="edited">{t("tabsEdited")}</Tab>}
      </Tabs.List>

      <Tabs.Content value="original" forceMount className="data-[state=inactive]:hidden">
        <div
          className="prose-article"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </Tabs.Content>

      {hasSummary && (
        <Tabs.Content value="summary" className="prose-article">
          <p className="mb-4 text-sm rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
            {t("llmDisclaimer")}
          </p>
          <div className="whitespace-pre-line">{summary}</div>
        </Tabs.Content>
      )}

      {hasEdited && (
        <Tabs.Content value="edited">
          <p className="mb-4 text-sm rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
            {t("llmDisclaimer")}
          </p>
          <div
            className="prose-article"
            dangerouslySetInnerHTML={{ __html: editedBodyHtml ?? "" }}
          />
        </Tabs.Content>
      )}
    </Tabs.Root>
  );
}

function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <Tabs.Trigger
      value={value}
      className="px-4 py-2 text-sm font-medium text-muted-foreground border-b-2 border-transparent data-[state=active]:text-foreground data-[state=active]:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Tabs.Trigger>
  );
}
