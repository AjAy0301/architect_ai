import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jiraTicketId: text("jira_ticket_id").notNull(),
  status: text("status").notNull(), // 'pending', 'running', 'completed', 'failed'
  currentAgent: text("current_agent"), // 'jira-analyst', 'tech-architect', 'product-manager'
  jiraTicketData: json("jira_ticket_data"),
  ragContext: json("rag_context"),
  impactAnalysis: text("impact_analysis"),
  solutionArchitecture: text("solution_architecture"),
  prd: json("prd"),
  engineType: text("engine_type").default("basic"), // 'basic', 'langchain'
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  vectorId: text("vector_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const metrics = pgTable("metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketsProcessed: integer("tickets_processed").default(0),
  impactAnalyses: integer("impact_analyses").default(0),
  solutionArchitectures: integer("solution_architectures").default(0),
  prdsGenerated: integer("prds_generated").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id),
  type: text("type").notNull(), // 'ticket_analyzed', 'impact_completed', 'solution_completed', 'prd_completed'
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertMetricsSchema = createInsertSchema(metrics).omit({
  id: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Pydantic-like schemas for structured outputs
export const prdSchema = z.object({
  title: z.string().describe("The title of the feature or change described in the Jira ticket"),
  introduction: z.string().describe("A brief, one-paragraph overview of the project's purpose and goals"),
  problem_statement: z.string().describe("A clear and concise description of the problem this change is solving"),
  user_stories: z.array(z.string()).describe("A list of user stories in the format 'As a [user type], I want [goal] so that [benefit]'"),
  technical_requirements: z.array(z.string()).describe("A list of specific technical requirements derived from the solution architecture"),
  non_functional_requirements: z.record(z.string()).describe("A dictionary of non-functional requirements, with keys like 'Performance', 'Security', 'Scalability'"),
  out_of_scope: z.array(z.string()).describe("A list of items that are explicitly not part of this project"),
  success_metrics: z.array(z.string()).describe("A list of quantifiable metrics that will be used to measure the success of this feature"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertMetrics = z.infer<typeof insertMetricsSchema>;
export type Metrics = typeof metrics.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type PRD = z.infer<typeof prdSchema>;
