import type { Metadata } from "next";
import { siteConfig } from "@/lib/utils/site";

export const metadata: Metadata = {
  title: "אודות",
  description: `אודות ${siteConfig.name} — במה למאמרי הוגה דעות תורני.`,
};

export default function AboutPage() {
  return (
    <article className="container-narrow py-12 md:py-16 prose-article">
      <h1>אודות</h1>
      <p>
        אתר <strong>{siteConfig.name}</strong> הוא במה למאמרי הוגה דעות תורני,
        שנכתבו לאורך עשרות שנים ולא פורסמו עד היום. מטרת האתר להנגיש את החומרים
        לכל מי שמבקש לעיין, ללמוד ולהתבונן.
      </p>
      <p>
        כאן ניתן לקרוא מאמרים לפי קטגוריות, לחפש לפי מילים, נושאים ותקופות,
        ולהתעמק ברקע ההיסטורי של כל כתיבה.
      </p>
      <p>
        מוזמנים להגיב, להוסיף דעה ולשתף. תגובות נכתבות בכבוד ובדרך ארץ.
      </p>
      <p className="text-muted-foreground text-sm">
        תוכן אודות מפורט יעודכן בקרוב.
      </p>
    </article>
  );
}
