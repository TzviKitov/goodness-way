import Link from "next/link";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth/config";
import { defaultLocale } from "@/lib/i18n/config";

export const metadata = {
  title: "ממשק הכותב",
  robots: { index: false, follow: false },
};

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/author");
  if (session.user.role !== "author" && session.user.role !== "admin") {
    return (
      <div className="container-narrow py-16 text-center">
        <h1 className="text-2xl font-bold mb-3">אין לך הרשאה לממשק זה</h1>
        <p className="text-muted-foreground">
          אם הינך הכותב — פנה למנהל המערכת להקצאת הרשאה.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md bg-primary text-primary-foreground px-5 py-2.5"
        >
          חזרה
        </Link>
      </div>
    );
  }

  setRequestLocale(defaultLocale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={defaultLocale} messages={messages}>
      <div className="min-h-screen bg-muted/30">
        <header className="border-b border-border bg-background">
          <div className="container-wide flex items-center justify-between h-14">
            <div className="flex items-center gap-5 text-sm">
              <Link href="/" className="font-semibold">
                בדרך טובים
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/author" className="font-medium">
                ממשק הכותב
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              שלום {session.user.name ?? "כותב יקר"}
            </div>
          </div>
        </header>
        <main className="container-wide py-8">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}
