import { Link } from "@/lib/i18n/navigation";

export default function NotFound() {
  return (
    <div className="container-narrow py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">הדף לא נמצא</h1>
      <p className="text-muted-foreground mb-8">
        ייתכן שהקישור שגוי או שהדף הוסר.
      </p>
      <Link
        href="/"
        className="inline-flex rounded-md bg-primary text-primary-foreground px-5 py-2.5 hover:opacity-90"
      >
        חזרה לדף הבית
      </Link>
    </div>
  );
}
