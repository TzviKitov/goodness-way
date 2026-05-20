import { relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/** PostgreSQL tsvector for full-text search (GIN index). */
export const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const userRoleEnum = pgEnum("user_role", ["reader", "author", "admin"]);
export const articleStatusEnum = pgEnum("article_status", [
  "draft",
  "published",
  "archived",
]);
export const commentStatusEnum = pgEnum("comment_status", [
  "visible",
  "hidden",
  "pending_review",
]);
export const jobKindEnum = pgEnum("job_kind", [
  "convert_word",
  "llm_summary",
  "llm_edited",
  "llm_translate",
]);
export const jobStatusEnum = pgEnum("job_status", [
  "queued",
  "running",
  "done",
  "error",
]);
export const sourceFormatEnum = pgEnum("source_format", ["docx", "doc"]);
export const llmPromptKindEnum = pgEnum("llm_prompt_kind", [
  "summary",
  "edited",
  "translate",
]);
export const translationStatusEnum = pgEnum("translation_status", [
  "pending",
  "translating",
  "ready",
  "error",
]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    name: varchar("name", { length: 256 }),
    image: text("image"),
    role: userRoleEnum("role").notNull().default("reader"),
    googleId: varchar("google_id", { length: 128 }),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    googleIdIdx: index("users_google_id_idx").on(table.googleId),
    roleIdx: index("users_role_idx").on(table.role),
  })
);

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 256 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 64 }),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  })
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull().unique(),
    nameHe: varchar("name_he", { length: 256 }).notNull(),
    description: text("description"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    orderIdx: index("categories_display_order_idx").on(table.displayOrder),
  })
);

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 256 }).notNull(),
    title: varchar("title", { length: 512 }).notNull(),
    description: text("description"),
    periodAndContext: text("period_and_context"),
    writtenAt: date("written_at"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    status: articleStatusEnum("status").notNull().default("draft"),

    bodyHtml: text("body_html"),
    bodyText: text("body_text"),
    summary: text("summary"),
    editedBodyHtml: text("edited_body_html"),

    sourceFileKey: text("source_file_key"),
    sourceFileFormat: sourceFormatEnum("source_file_format"),
    sourceFileHash: varchar("source_file_hash", { length: 128 }),
    sourceFileName: varchar("source_file_name", { length: 512 }),

    seoTitle: varchar("seo_title", { length: 512 }),
    seoDescription: text("seo_description"),

    searchVector: tsvector("search_vector").generatedAlwaysAs(sql`
      setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(period_and_context, '')), 'B') ||
      setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('simple', coalesce(body_text, '')), 'C')
    `),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("articles_slug_idx").on(table.slug),
    statusIdx: index("articles_status_idx").on(table.status),
    publishedAtIdx: index("articles_published_at_idx").on(table.publishedAt),
    writtenAtIdx: index("articles_written_at_idx").on(table.writtenAt),
    searchVectorIdx: index("articles_search_vector_idx").using(
      "gin",
      table.searchVector
    ),
    sourceHashIdx: index("articles_source_hash_idx").on(table.sourceFileHash),
  })
);

export const articleCategories = pgTable(
  "article_categories",
  {
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.articleId, table.categoryId] }),
    categoryIdx: index("article_categories_category_idx").on(table.categoryId),
  })
);

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    bodyText: text("body_text").notNull(),
    status: commentStatusEnum("status").notNull().default("visible"),
    reportCount: integer("report_count").notNull().default(0),
    editorReplyText: text("editor_reply_text"),
    editorRepliedAt: timestamp("editor_replied_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    articleIdx: index("comments_article_idx").on(
      table.articleId,
      table.createdAt
    ),
    statusIdx: index("comments_status_idx").on(table.status),
    reportIdx: index("comments_report_idx").on(table.reportCount),
  })
);

export const commentReports = pgTable(
  "comment_reports",
  {
    id: serial("id").primaryKey(),
    commentId: integer("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    reporterUserId: text("reporter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    commentIdx: index("comment_reports_comment_idx").on(table.commentId),
    uniqueReport: uniqueIndex("comment_reports_unique").on(
      table.commentId,
      table.reporterUserId
    ),
  })
);

export const jobs = pgTable(
  "jobs",
  {
    id: serial("id").primaryKey(),
    kind: jobKindEnum("kind").notNull(),
    payload: jsonb("payload").notNull(),
    status: jobStatusEnum("status").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    runAfter: timestamp("run_after", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    statusIdx: index("jobs_status_idx").on(table.status, table.runAfter),
    kindIdx: index("jobs_kind_idx").on(table.kind),
  })
);

export const llmPrompts = pgTable(
  "llm_prompts",
  {
    id: serial("id").primaryKey(),
    kind: llmPromptKindEnum("kind").notNull(),
    version: integer("version").notNull(),
    promptText: text("prompt_text").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    kindVersion: uniqueIndex("llm_prompts_kind_version_idx").on(
      table.kind,
      table.version
    ),
    activeIdx: index("llm_prompts_active_idx").on(table.kind, table.isActive),
  })
);

export const articleLocales = pgTable(
  "article_locales",
  {
    id: serial("id").primaryKey(),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    locale: varchar("locale", { length: 8 }).notNull(),
    title: varchar("title", { length: 512 }),
    description: text("description"),
    bodyHtml: text("body_html"),
    summary: text("summary"),
    translationStatus: translationStatusEnum("translation_status")
      .notNull()
      .default("pending"),
    sourceHash: varchar("source_hash", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    articleLocale: uniqueIndex("article_locales_article_locale_idx").on(
      table.articleId,
      table.locale
    ),
  })
);

export const articlesRelations = relations(articles, ({ many }) => ({
  categories: many(articleCategories),
  comments: many(comments),
  locales: many(articleLocales),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articleCategories),
}));

export const articleCategoriesRelations = relations(
  articleCategories,
  ({ one }) => ({
    article: one(articles, {
      fields: [articleCategories.articleId],
      references: [articles.id],
    }),
    category: one(categories, {
      fields: [articleCategories.categoryId],
      references: [categories.id],
    }),
  })
);

export const commentsRelations = relations(comments, ({ one, many }) => ({
  article: one(articles, {
    fields: [comments.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  reports: many(commentReports),
}));

export const commentReportsRelations = relations(commentReports, ({ one }) => ({
  comment: one(comments, {
    fields: [commentReports.commentId],
    references: [comments.id],
  }),
  reporter: one(users, {
    fields: [commentReports.reporterUserId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  comments: many(comments),
  reports: many(commentReports),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const articleLocalesRelations = relations(articleLocales, ({ one }) => ({
  article: one(articles, {
    fields: [articleLocales.articleId],
    references: [articles.id],
  }),
}));

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type CommentReport = typeof commentReports.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type LlmPrompt = typeof llmPrompts.$inferSelect;
export type User = typeof users.$inferSelect;
export type ArticleLocale = typeof articleLocales.$inferSelect;
