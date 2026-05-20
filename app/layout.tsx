/**
 * Root layout — passthrough only.
 * html/body, fonts, and locale direction live in app/[locale]/layout.tsx.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
