import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "התחברות",
  robots: { index: false, follow: false },
};

type SP = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await auth();
  const sp = await searchParams;
  const callback =
    typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/";
  if (session?.user) redirect(callback);

  return (
    <div className="container-narrow py-16">
      <h1 className="text-3xl font-bold mb-6">התחברות</h1>
      <p className="text-muted-foreground mb-8">
        ההתחברות נעשית באמצעות חשבון Google. אנו נשמור את שמך, האימייל ותמונת
        הפרופיל לצורך הצגת תגובות. ניתן להתנתק בכל עת.
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: callback });
        }}
      >
        <button
          type="submit"
          className="inline-flex items-center gap-3 rounded-md border border-border bg-card px-6 py-3 text-base font-medium hover:bg-muted"
        >
          <GoogleIcon />
          המשך עם Google
        </button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M21.35 11.1H12v2.8h5.35c-.23 1.38-.94 2.54-2 3.31v2.75h3.23c1.89-1.74 2.97-4.32 2.97-7.36 0-.5-.05-.99-.15-1.5z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.97-.9 6.62-2.44l-3.23-2.75c-.9.6-2.05.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A9.97 9.97 0 0 0 12 22z"
        fill="#34A853"
      />
      <path
        d="M6.41 13.64A6.04 6.04 0 0 1 6.1 12c0-.57.1-1.13.27-1.64V7.76H3.07A9.96 9.96 0 0 0 2 12c0 1.6.38 3.12 1.07 4.44l3.34-2.6z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.5c1.47 0 2.78.5 3.81 1.49l2.86-2.86C16.95 3.6 14.7 2.6 12 2.6c-3.91 0-7.27 2.26-8.93 5.55l3.34 2.6C7.2 8.26 9.4 6.5 12 6.5z"
        fill="#EA4335"
      />
    </svg>
  );
}
