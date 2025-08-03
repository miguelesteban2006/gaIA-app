import {
  users,
  elderlyUsers,
  interactions,
  healthAlerts,
  userElderlyRelations,
  type User,
  type InsertUser,
  type ElderlyUser,
  type InsertElderlyUser,
  type InsertInteraction,
  type Interaction,
  type HealthAlert,
  type InsertHealthAlert,
  type UserElderlyRelation,
  type InsertUserElderlyRelation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: Partial<InsertUser> & { id: string }): Promise<User>;
  
  // Elderly user operations
  getElderlyUser(id: string): Promise<ElderlyUser | undefined>;
  createElderlyUser(elderlyUser: InsertElderlyUser): Promise<ElderlyUser>;
  updateElderlyUser(id: string, data: Partial<typeof elderlyUsers.$inferInsert>): Promise<ElderlyUser>;
  getUserElderlyUsers(userId: string): Promise<ElderlyUser[]>;
  
  // Interaction operations
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  getElderlyUserInteractions(elderlyUserId: string, limit?: number): Promise<Interaction[]>;
  getElderlyUserStats(elderlyUserId: string): Promise<{
    totalInteractions: number;
    avgMoodScore: number;
    avgSentiment: number;
    totalDuration: number;
    alertsCount: number;
  }>;
  getSentimentData(elderlyUserId: string, days: number): Promise<Array<{
    date: string;
    sentiment: number;
    mood: number;
  }>>;
  
  // Health alerts operations
  createHealthAlert(alert: InsertHealthAlert): Promise<HealthAlert>;
  getElderlyUserAlerts(elderlyUserId: string, resolved?: boolean): Promise<HealthAlert[]>;
  resolveAlert(alertId: string, resolvedBy: string): Promise<void>;
  
  // Relations operations
  createUserElderlyRelation(relation: InsertUserElderlyRelation): Promise<UserElderlyRelation>;
  getUserElderlyRelations(userId: string): Promise<UserElderlyRelation[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: Partial<InsertUser> & { id: string }): Promise<User> {
    const existingUser = await this.getUser(userData.id);
    if (existingUser) {
      const [user] = await db.update(users)
        .set(userData)
        .where(eq(users.id, userData.id))
        .returning();
      return user;
    } else {
      const [user] = await db.insert(users).values(userData as InsertUser).returning();
      return user;
    }
  }

  // Elderly user operations
  async getElderlyUser(id: string): Promise<ElderlyUser | undefined> {
    const [elderlyUser] = await db.select().from(elderlyUsers).where(eq(elderlyUsers.id, id));
    return elderlyUser;
  }

  async updateElderlyUser(id: string, data: Partial<typeof elderlyUsers.$inferInsert>): Promise<ElderlyUser> {
    const [elderlyUser] = await db
      .update(elderlyUsers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(elderlyUsers.id, id))
      .returning();
    return elderlyUser;
  }

  async createElderlyUser(elderlyUserData: InsertElderlyUser): Promise<ElderlyUser> {
    const [elderlyUser] = await db.insert(elderlyUsers).values(elderlyUserData).returning();
    return elderlyUser;
  }

  async getUserElderlyUsers(userId: string): Promise<ElderlyUser[]> {
    const relations = await db
      .select({ elderlyUserId: userElderlyRelations.elderlyUserId })
      .from(userElderlyRelations)
      .where(eq(userElderlyRelations.userId, userId));

    if (relations.length === 0) return [];

    return await db
      .select()
      .from(elderlyUsers)
      .where(inArray(elderlyUsers.id, relations.map(r => r.elderlyUserId)));
  }

  // Interaction operations
  async createInteraction(interaction: InsertInteraction): Promise<Interaction> {
    const [newInteraction] = await db
      .insert(interactions)
      .values(interaction)
      .returning();
    return newInteraction;
  }

  async getElderlyUserInteractions(elderlyUserId: string, limit: number = 10): Promise<Interaction[]> {
    return await db
      .select()
      .from(interactions)
      .where(eq(interactions.elderlyUserId, elderlyUserId))
      .orderBy(desc(interactions.createdAt))
      .limit(limit);
  }

  async getElderlyUserStats(elderlyUserId: string): Promise<{
    totalInteractions: number;
    avgMoodScore: number;
    avgSentiment: number;
    totalDuration: number;
    alertsCount: number;
  }> {
    const [stats] = await db
      .select({
        totalInteractions: sql<number>`count(*)::int`,
        avgMoodScore: sql<number>`coalesce(avg(${interactions.moodScore}), 0)::real`,
        avgSentiment: sql<number>`coalesce(avg(${interactions.sentimentScore}), 0)::real`,
        totalDuration: sql<number>`coalesce(sum(${interactions.duration}), 0)::int`,
      })
      .from(interactions)
      .where(eq(interactions.elderlyUserId, elderlyUserId));

    const [alertsStats] = await db
      .select({
        alertsCount: sql<number>`count(*)::int`,
      })
      .from(healthAlerts)
      .where(and(
        eq(healthAlerts.elderlyUserId, elderlyUserId),
        eq(healthAlerts.isResolved, "false")
      ));

    return {
      totalInteractions: stats?.totalInteractions || 0,
      avgMoodScore: stats?.avgMoodScore || 0,
      avgSentiment: stats?.avgSentiment || 0,
      totalDuration: stats?.totalDuration || 0,
      alertsCount: alertsStats?.alertsCount || 0,
    };
  }

  async getSentimentData(elderlyUserId: string, days: number = 30): Promise<Array<{
    date: string;
    sentiment: number;
    mood: number;
  }>> {
    const result = await db
      .select({
        date: sql<string>`date(${interactions.createdAt})`,
        sentiment: sql<number>`coalesce(avg(${interactions.sentimentScore}), 0)::real`,
        mood: sql<number>`coalesce(avg(${interactions.moodScore}), 0)::real`,
      })
      .from(interactions)
      .where(
        and(
          eq(interactions.elderlyUserId, elderlyUserId),
          sql`${interactions.createdAt} >= current_date - interval '${sql.raw(days.toString())} days'`
        )
      )
      .groupBy(sql`date(${interactions.createdAt})`)
      .orderBy(sql`date(${interactions.createdAt})`);

    return result;
  }

  // Health alerts operations
  async createHealthAlert(alertData: InsertHealthAlert): Promise<HealthAlert> {
    const [alert] = await db.insert(healthAlerts).values(alertData).returning();
    return alert;
  }

  async getElderlyUserAlerts(elderlyUserId: string, resolved?: boolean): Promise<HealthAlert[]> {
    const conditions = [eq(healthAlerts.elderlyUserId, elderlyUserId)];
    if (resolved !== undefined) {
      conditions.push(eq(healthAlerts.isResolved, resolved ? "true" : "false"));
    }

    return await db
      .select()
      .from(healthAlerts)
      .where(and(...conditions))
      .orderBy(desc(healthAlerts.createdAt));
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    await db
      .update(healthAlerts)
      .set({
        isResolved: "true",
        resolvedBy,
        resolvedAt: new Date(),
      })
      .where(eq(healthAlerts.id, alertId));
  }

  // Relations operations
  async createUserElderlyRelation(relationData: InsertUserElderlyRelation): Promise<UserElderlyRelation> {
    const [relation] = await db.insert(userElderlyRelations).values(relationData).returning();
    return relation;
  }

  async getUserElderlyRelations(userId: string): Promise<UserElderlyRelation[]> {
    return await db
      .select()
      .from(userElderlyRelations)
      .where(eq(userElderlyRelations.userId, userId));
  }
}

export const storage = new DatabaseStorage();
