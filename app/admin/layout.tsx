import Link from "next/link";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { auth } from "@/lib/auth/config";

export const metadata = {
  title: "ניהול מערכת",
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/admin", label: "סקירה" },
  { href: "/admin/categories", label: "קטגוריות" },
  { href: "/admin/users", label: "משתמשים" },
  { href: "/admin/comments", label: "תגובות מדווחות" },
  { href: "/admin/jobs", label: "עבודות רקע" },
  { href: "/admin/prompts", label: "פרומפטים" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "admin") {
    return (
      <div className="container-narrow py-16 text-center">
        <h1 className="text-2xl font-bold mb-3">אין לך הרשאת אדמין</h1>
        <Link href="/" className="text-accent underline">
          חזרה
        </Link>
      </div>
    );
  }
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen bg-muted/30">
        <header className="border-b border-border bg-background">
          <div className="container-wide flex items-center gap-5 h-14 text-sm">
            <Link href="/admin" className="font-semibold">
              ניהול מערכת
            </Link>
            <nav className="flex gap-4 text-muted-foreground">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-foreground">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="container-wide py-8">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}
