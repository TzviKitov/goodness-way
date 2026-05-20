# גיבוי ושחזור — בדרך טובים

## עקרונות

- **מסד נתונים**: Neon מספק Point-In-Time Recovery (PITR) של 7 ימים ב-Free Tier (ו-30 יום ב-Pro).
- **קבצי מקור**: מאוחסנים ב-Cloudflare R2. ב-Free Tier אין versioning אוטומטי — מומלץ ייצוא ידני חודשי.
- **קוד**: ב-GitHub, גיבוי מובנה.

## גיבוי שוטף

### חודש ראשון

הסתמכות על Neon PITR בלבד. אין צורך בפעולות.

### לאחר חודש פעילות — שגרה שבועית

```powershell
# 1) ייצוא מבנה + נתונים מ-Neon
pg_dump --no-owner --format=custom $env:DATABASE_URL `
  -f .\backups\goodness-way-$(Get-Date -Format yyyyMMdd).dump

# 2) רשימת קבצים ב-R2 (ל-audit)
# השתמש ב-rclone או wrangler r2
wrangler r2 object list goodness-way > .\backups\r2-listing-$(Get-Date -Format yyyyMMdd).txt
```

שמור את הגיבויים בכונן חיצוני או בענן נפרד.

## שחזור

### שחזור נקודתי (DB)

1. לוח Neon → Branches → Restore from a point in time.
2. בחר זמן (עד 7 ימים אחורה).
3. הפנה את `DATABASE_URL` לענף החדש (או החלף את ה-main).
4. Vercel → Redeploy.

### שחזור ממוצר חיצוני

```powershell
pg_restore --no-owner --clean --if-exists `
  --dbname=$env:DATABASE_URL `
  .\backups\goodness-way-YYYYMMDD.dump
```

### שחזור קובץ Word בודד

קבצי המקור מאוחסנים תחת `drafts/<slug>/<timestamp>-<filename>` ב-R2. ניתן להוריד דרך R2 dashboard.

## בדיקת תקינות גיבוי

מומלץ פעם בחודשיים:

1. צור ענף בדיקה ב-Neon (`Restore from PITR`).
2. הפעל בדיקת `SELECT count(*) FROM articles, comments`.
3. השווה ל-production.

## העברת ספק (במקרה הצורך)

האפליקציה לא תלויה ספציפית ב-Vercel/Neon/R2 — אפשר להעביר:

- **DB**: pg_dump → pg_restore לכל ספק PostgreSQL אחר (Supabase, Railway, RDS).
- **קבצים**: rclone copy מ-R2 ל-S3/B2/Wasabi.
- **App**: build רגיל של Next.js. ניתן להריץ ב-Node ישירות, Railway, Render, Docker.

מומלץ לתעד את ה-DNS ואת ה-OAuth client של Google לפני העברה.
