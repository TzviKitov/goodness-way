import { Link } from "@/lib/i18n/navigation";
import { formatHebrewDate, formatMonthYear } from "@/lib/utils/dates";
import { truncateText } from "@/lib/utils/sanitize";

type Props = {
  article: {
    slug: string;
    title: string;
    description: string | null;
    periodAndContext: string | null;
    writtenAt: string | null;
    publishedAt: Date | string | null;
  };
};

export function ArticleCard({ article }: Props) {
  return (
    <article className="group rounded-md border border-border bg-card p-5 hover:shadow-sm transition-shadow">
      <Link href={`/article/${article.slug}`} className="block">
        <h3 className="text-xl md:text-2xl font-semibold leading-tight group-hover:text-accent transition-colors">
          {article.title}
        </h3>
        {article.description && (
          <p className="mt-2 text-muted-foreground leading-relaxed">
            {truncateText(article.description, 200)}
          </p>
        )}
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          {article.publishedAt && (
            <div>
              <dt className="inline">פורסם: </dt>
              <dd className="inline">
                <time
                  dateTime={
                    typeof article.publishedAt === "string"
                      ? article.publishedAt
                      : article.publishedAt.toISOString()
                  }
                >
                  {formatHebrewDate(article.publishedAt)}
                </time>
              </dd>
            </div>
          )}
          {article.writtenAt && (
            <div>
              <dt className="inline">נכתב: </dt>
              <dd className="inline">{formatMonthYear(article.writtenAt)}</dd>
            </div>
          )}
        </dl>
      </Link>
    </article>
  );
}
