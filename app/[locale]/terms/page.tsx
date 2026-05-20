import type { Metadata } from "next";
import { siteConfig } from "@/lib/utils/site";

export const metadata: Metadata = {
  title: "תנאי שימוש וזכויות יוצרים",
};

export default function TermsPage() {
  return (
    <article className="container-narrow py-12 md:py-16 prose-article">
      <h1>תנאי שימוש וזכויות יוצרים</h1>
      <p>
        תכני האתר מובאים לעיון ולשימוש אישי. כל הזכויות בכתבים שמורות
        ל{siteConfig.authorName} ול{siteConfig.name}.
      </p>
      <h2>שימוש בתוכן</h2>
      <p>
        קריאה ושיתוף קישורים מותרים. ציטוט מתוך מאמר מותר עם ייחוס למקור
        וקישור. שכפול שיטתי, פרסום מחדש או שימוש מסחרי — אסורים ללא אישור מראש
        ובכתב.
      </p>
      <h2>תגובות</h2>
      <p>
        תגובות מתפרסמות בכבוד ובדרך ארץ. תגובות פוגעניות, ספאם, או פוליטיות
        עוינות — יוסרו. הנהלת האתר רשאית להסתיר תגובות לשיקול דעתה.
      </p>
      <h2>שינוי תנאים</h2>
      <p>
        תנאים אלו יכולים להתעדכן מעת לעת. השימוש המתמשך באתר מהווה הסכמה לתנאים
        המעודכנים.
      </p>
    </article>
  );
}
