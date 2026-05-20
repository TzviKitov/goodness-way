import { auth } from "./config";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError("Unauthorized", 401);
  }
  return session;
}

export async function requireRole(roles: Array<"reader" | "author" | "admin">) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new AuthError("Forbidden", 403);
  }
  return session;
}

export class AuthError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "AuthError";
  }
}
