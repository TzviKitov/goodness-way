# בדרך טובים — אתר מאמרי הוגה דעות תורני

אתר אינטרנט מותאם למובייל לפרסום מאמרים תורניים-עיוניים. בנוי לקריאה נוחה, חיפוש מתקדם בעברית, ו-SEO חזק. מותאם לעלות נמוכה (~$0–$10/חודש).

## הסטאק

| שכבה | טכנולוגיה |
|---|---|
| מסגרת | Next.js 15 (App Router) + React 19 + TypeScript |
| עיצוב | Tailwind CSS + tailwindcss-rtl + Frank Ruhl Libre |
| מסד נתונים | PostgreSQL ב-Neon + Drizzle ORM |
| חיפוש | PostgreSQL Full-Text Search (`tsvector` + GIN) |
| אחסון קבצים | Cloudflare R2 (S3-compatible) |
| אימות | Auth.js v5 + Google OAuth |
| המרת Word | `mammoth` ל-.docx ; CloudConvert ל-.doc (אופציונלי) |
| מייל | Resend |
| LLM | Pluggable adapter (ברירת מחדל: OpenAI) |
| אנליטיקות | Vercel Analytics |
| Cron | Vercel Cron |
| Rate-limit | Upstash Redis (או in-memory) |

## הקמה ראשונית

### 1. דרישות מקדימות
- Node.js 20+ (מומלץ 22 או 24)
- חשבונות חינמיים: [Vercel](https://vercel.com), [Neon](https://console.neon.tech), [Cloudflare R2](https://dash.cloudflare.com), [Resend](https://resend.com), [Google Cloud](https://console.cloud.google.com), [OpenAI](https://platform.openai.com)

### 2. התקנה
```powershell
npm install
copy .env.example .env.local
# מלא את הערכים ב-.env.local לפי השירותים שיצרת
```

### 3. מסד נתונים
מלא `DATABASE_URL` ב-`.env.local`. פקודות Drizzle ו-`seed` טוענות את הקובץ אוטומטית (לא צריך להגדיר משתנים ידנית ב-PowerShell).

```powershell
npm run db:push       # יצירת טבלאות ראשונית ב-Neon
npm run seed          # קטגוריות התחלתיות
```

### 4. הרצה מקומית
```powershell
npm run dev
```
פתח [http://localhost:3000](http://localhost:3000).

### 5. הקצאת הרשאת כותב/אדמין
לאחר התחברות ראשונה עם חשבון Google, הכנס למסד דרך Neon ושנה את עמודת `role` של המשתמש ל-`author` או `admin`. בעתיד אפשר לעשות זאת גם דרך `/admin/users` (לאחר שיוקצה אדמין ראשון).

```sql
update users set role = 'admin' where email = 'your@email.com';
```

## פריסה ל-Vercel

1. דחוף את הקוד ל-GitHub.
2. ב-Vercel — Import Project, בחר את המאגר.
3. הגדר את כל משתני הסביבה מ-`.env.example`.
4. הוסף משתנה `CRON_SECRET` (אקראי) לאבטחת ה-cron.
5. הגדר דומיין מותאם.
6. Deploy.

הקובץ `vercel.json` כבר מגדיר Cron כל 2 דקות ל-`/api/cron/jobs` שמריץ עבודות LLM ברקע.

## מבנה הפרויקט

```
app/
  (public)/              דפים ציבוריים: בית, מאמר, קטגוריה, חיפוש, אודות
  author/                ממשק הכותב (wizard, ניהול תגובות)
  admin/                 ממשק האדמין (משתמשים, קטגוריות, jobs, פרומפטים)
  api/                   REST endpoints
  sitemap.ts             מפת אתר דינמית
  robots.ts              robots.txt
  rss.xml/               feed RSS
components/              רכיבי UI
lib/
  db/                    סכמת Drizzle + חיבור Neon
  search/                שאילתות + PostgreSQL FTS
  auth/                  Auth.js + guards
  email/                 Resend templates
  llm/                   provider adapter (OpenAI default)
  word/                  mammoth + CloudConvert
  storage/               R2 client (S3 v4 signed)
  ratelimit/             Upstash + in-memory fallback
  jobs/                  Job runner
  utils/                 sanitize, transliterate, dates
  i18n/                  next-intl
messages/                he.json
scripts/
  bulk-import.ts         ייבוא 500+ קבצי Word מ-CSV (משתמש ב-LibreOffice)
  seed.ts                קטגוריות התחלתיות
drizzle/                 migrations (נוצרות ע"י drizzle-kit)
docs/                    מסמכי הפעלה ושחזור
```

## ייבוא מסיבי של מאמרים

```powershell
npm run import:articles -- --csv .\imports\articles.csv --files .\imports\files
```

CSV: `filename,title,description,period_and_context,written_at,categories,status`

קטגוריות מופרדות ב-`|`. קבצי `.doc` ישנים מומרים אוטומטית באמצעות `soffice` (LibreOffice) מקומי.

## אבטחה ופרטיות

- כל ה-HTML המגיע מקבצי Word עובר `sanitize-html` עם רשימה לבנה מצומצמת.
- Rate-limiting על תגובות, דיווחים ובקשות LLM.
- RBAC: `reader` / `author` / `admin`. מסלולי `/author` ו-`/admin` חסומים.
- Cookies של Auth.js עם `httpOnly` + `sameSite=lax`.
- כותרות אבטחה (`X-Frame-Options`, `Referrer-Policy`, וכו') ב-`next.config.mjs`.

## גיבוי ושחזור

ראה [`docs/recovery.md`](./docs/recovery.md).

## מסמכים נוספים

- [`docs/author-guide-he.md`](./docs/author-guide-he.md) — מדריך הכותב, בעברית פשוטה ונגישה.
- [`docs/admin-guide.md`](./docs/admin-guide.md) — מדריך מנהל המערכת.
- [`docs/recovery.md`](./docs/recovery.md) — גיבוי, שחזור והעברות.

## רישיון ושימוש

זכויות הכתבים — לכותב. מותר לקרוא, לעיין ולשתף קישורים. לציטוט נדרשת אזכור מקור. ראה את עמוד תנאי השימוש באתר.
