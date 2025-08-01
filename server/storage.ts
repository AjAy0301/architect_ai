import { type User, type InsertUser, type Workflow, type InsertWorkflow, type Document, type InsertDocument, type Metrics, type InsertMetrics, type Activity, type InsertActivity } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workflow methods
  getWorkflow(id: string): Promise<Workflow | undefined>;
  getAllWorkflows(): Promise<Workflow[]>;
  getRecentWorkflows(limit?: number): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined>;
  
  // Document methods
  getAllDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  searchDocuments(query: string): Promise<Document[]>;
  
  // Metrics methods
  getMetrics(): Promise<Metrics | undefined>;
  updateMetrics(metrics: Partial<InsertMetrics>): Promise<Metrics>;
  
  // Activity methods
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workflows: Map<string, Workflow>;
  private documents: Map<string, Document>;
  private metrics: Metrics;
  private activities: Activity[];

  constructor() {
    this.users = new Map();
    this.workflows = new Map();
    this.documents = new Map();
    this.activities = [];
    this.metrics = {
      id: randomUUID(),
      ticketsProcessed: 0,
      impactAnalyses: 0,
      solutionArchitectures: 0,
      prdsGenerated: 0,
      updatedAt: new Date(),
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getRecentWorkflows(limit: number = 10): Promise<Workflow[]> {
    const workflows = await this.getAllWorkflows();
    return workflows.slice(0, limit);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const now = new Date();
    const workflow: Workflow = { 
      ...insertWorkflow, 
      id, 
      createdAt: now,
      updatedAt: now,
      error: insertWorkflow.error || null,
      engineType: insertWorkflow.engineType || 'basic',
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const updatedWorkflow = { 
      ...workflow, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = { 
      ...insertDocument, 
      id, 
      createdAt: new Date(),
      metadata: insertDocument.metadata || {},
      vectorId: insertDocument.vectorId || null,
    };
    this.documents.set(id, document);
    return document;
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.documents.values()).filter(doc =>
      doc.title.toLowerCase().includes(lowercaseQuery) ||
      doc.content.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getMetrics(): Promise<Metrics | undefined> {
    return this.metrics;
  }

  async updateMetrics(updates: Partial<InsertMetrics>): Promise<Metrics> {
    this.metrics = { 
      ...this.metrics, 
      ...updates, 
      updatedAt: new Date() 
    };
    return this.metrics;
  }

  async getActivities(limit: number = 20): Promise<Activity[]> {
    return this.activities
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      createdAt: new Date(),
      workflowId: insertActivity.workflowId || null,
    };
    this.activities.push(activity);
    return activity;
  }
}

export const storage = new MemStorage();
