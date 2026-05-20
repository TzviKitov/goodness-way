import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { UsersTable } from "./users-table";

export default async function UsersPage() {
  const list = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(200);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">משתמשים</h1>
      <UsersTable
        users={list.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name ?? "",
          role: u.role,
          createdAt: u.createdAt,
        }))}
      />
    </div>
  );
}
