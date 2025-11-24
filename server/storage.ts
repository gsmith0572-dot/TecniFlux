import { 
  type User, 
  type InsertUser, 
  type Diagram, 
  type InsertDiagram,
  type Payment,
  type InsertPayment,
  type AppSetting,
  type DiagramHistory,
  type InsertDiagramHistory
} from "../shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, diagrams, payments, appSettings, diagramHistory } from "../shared/schema";
import { eq, like, and, gte, lte, gt, desc, sql, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(userId: string, plan: string, limit: number): Promise<User | undefined>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User | undefined>;
  incrementSearchCount(userId: string): Promise<User | undefined>;
  canUserSearch(userId: string): Promise<boolean>;
  resetMonthlySearches(userId: string): Promise<User | undefined>;
  updateLastAccess(userId: string): Promise<User | undefined>;
  
  // Password reset methods
  setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearPasswordResetToken(userId: string): Promise<User | undefined>;
  updatePassword(userId: string, hashedPassword: string): Promise<User | undefined>;
  
  // Admin - User management
  getAllUsers(limit?: number, offset?: number, role?: string, isActive?: number): Promise<User[]>;
  getTotalUsersCount(): Promise<number>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  updateUserStatus(userId: string, isActive: number): Promise<User | undefined>;
  searchUsers(query: string): Promise<User[]>;
  
  // Admin - Diagram management
  getAllDiagrams(limit?: number, offset?: number, filters?: Partial<Diagram>): Promise<Diagram[]>;
  getTotalDiagramsCount(): Promise<number>;
  getDiagram(id: string): Promise<Diagram | undefined>;
  createDiagram(diagram: InsertDiagram): Promise<Diagram>;
  updateDiagram(id: string, updates: Partial<Diagram>): Promise<Diagram | undefined>;
  deleteDiagram(id: string): Promise<boolean>;
  searchDiagrams(query: string): Promise<Diagram[]>;
  getLatestDiagrams(limit: number): Promise<Diagram[]>;
  getDiagramStats(): Promise<{
    total: number;
    complete: number;
    partial: number;
    topMakes: Array<{ make: string; count: number }>;
  }>;
  adminSearchDiagrams(params: {
    query?: string;
    make?: string;
    year?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ diagrams: Diagram[]; total: number }>;
  
  // Smart diagram search for users
  smartSearchDiagrams(params: {
    query?: string;
    make?: string;
    model?: string;
    year?: string;
    system?: string;
    onlyComplete?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ diagrams: Diagram[]; total: number }>;
  
  // Admin - Payments/Finance
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByMonth(year: number, month: number): Promise<Payment[]>;
  getMonthlyRevenue(year: number, month: number): Promise<{ gross: number; count: number }>;
  
  // Admin - App Settings
  getSetting(key: string): Promise<AppSetting | undefined>;
  setSetting(key: string, value: string, description?: string): Promise<AppSetting>;
  getAllSettings(): Promise<AppSetting[]>;
  
  // Diagram History (for tracking views without allowing downloads)
  addDiagramView(userId: string, diagramId: string): Promise<DiagramHistory>;
  getUserHistory(userId: string, limit?: number): Promise<Array<DiagramHistory & { diagram: Diagram }>>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserSubscription(userId: string, plan: string, limit: number): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({
        subscriptionPlan: plan,
        searchesLimit: limit,
        searchesUsed: 0,
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async incrementSearchCount(userId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const result = await db
      .update(users)
      .set({
        searchesUsed: user.searchesUsed + 1,
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async canUserSearch(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const now = new Date();
    const resetDate = user.searchesResetAt ? new Date(user.searchesResetAt) : new Date(0);
    
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      await this.resetMonthlySearches(userId);
      return true;
    }

    if (user.subscriptionPlan === "plus" || user.subscriptionPlan === "pro") {
      return true;
    }

    return user.searchesUsed < user.searchesLimit;
  }

  async resetMonthlySearches(userId: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({
        searchesUsed: 0,
        searchesResetAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
    return result[0];
  }

  async updateLastAccess(userId: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ lastAccess: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Password reset methods
  async setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);
    return result[0];
  }

  async clearPasswordResetToken(userId: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Admin - User management
  async getAllUsers(limit = 50, offset = 0, role?: string, isActive?: number): Promise<User[]> {
    let query = db.select().from(users);
    const conditions = [];
    
    if (role) conditions.push(eq(users.role, role));
    if (isActive !== undefined) conditions.push(eq(users.isActive, isActive));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const result = await query.limit(limit).offset(offset).orderBy(desc(users.createdAt));
    return result;
  }

  async getTotalUsersCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return Number(result[0]?.count || 0);
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserStatus(userId: string, isActive: number): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async searchUsers(query: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(
        or(
          like(users.username, `%${query}%`),
          like(users.email, `%${query}%`)
        )
      )
      .limit(50);
    return result;
  }

  // Admin - Diagram management
  async getAllDiagrams(limit = 50, offset = 0, filters?: Partial<Diagram>): Promise<Diagram[]> {
    let query = db.select().from(diagrams);
    const conditions = [];
    
    if (filters?.make) conditions.push(eq(diagrams.make, filters.make));
    if (filters?.model) conditions.push(eq(diagrams.model, filters.model));
    if (filters?.year) conditions.push(eq(diagrams.year, filters.year));
    if (filters?.system) conditions.push(eq(diagrams.system, filters.system));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const result = await query.limit(limit).offset(offset).orderBy(desc(diagrams.createdAt));
    return result;
  }

  async getTotalDiagramsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(diagrams);
    return Number(result[0]?.count || 0);
  }

  async getDiagram(id: string): Promise<Diagram | undefined> {
    const result = await db.select().from(diagrams).where(eq(diagrams.id, id)).limit(1);
    return result[0];
  }

  async createDiagram(diagram: InsertDiagram): Promise<Diagram> {
    const result = await db.insert(diagrams).values(diagram).returning();
    return result[0];
  }

  async updateDiagram(id: string, updates: Partial<Diagram>): Promise<Diagram | undefined> {
    const result = await db
      .update(diagrams)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(diagrams.id, id))
      .returning();
    return result[0];
  }

  async deleteDiagram(id: string): Promise<boolean> {
    const result = await db.delete(diagrams).where(eq(diagrams.id, id)).returning();
    return result.length > 0;
  }

  async searchDiagrams(query: string): Promise<Diagram[]> {
    const result = await db
      .select()
      .from(diagrams)
      .where(
        or(
          like(diagrams.fileName, `%${query}%`),
          like(diagrams.make, `%${query}%`),
          like(diagrams.model, `%${query}%`),
          like(diagrams.tags, `%${query}%`)
        )
      )
      .limit(50);
    return result;
  }

  async getLatestDiagrams(limit: number): Promise<Diagram[]> {
    const result = await db
      .select()
      .from(diagrams)
      .orderBy(desc(diagrams.createdAt))
      .limit(limit);
    return result;
  }

  async getDiagramStats(): Promise<{
    total: number;
    complete: number;
    partial: number;
    topMakes: Array<{ make: string; count: number }>;
  }> {
    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(diagrams);
    const total = totalResult[0]?.count || 0;

    const completeResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(diagrams)
      .where(eq(diagrams.status, 'complete'));
    const complete = completeResult[0]?.count || 0;

    const partial = total - complete;

    const topMakesResult = await db
      .select({
        make: diagrams.make,
        count: sql<number>`count(*)::int`,
      })
      .from(diagrams)
      .where(sql`${diagrams.make} IS NOT NULL`)
      .groupBy(diagrams.make)
      .orderBy(sql`count(*) DESC`)
      .limit(20);

    const topMakes = topMakesResult.map(row => ({
      make: row.make || 'Desconocido',
      count: row.count,
    }));

    return {
      total,
      complete,
      partial,
      topMakes,
    };
  }

  async adminSearchDiagrams(params: {
    query?: string;
    make?: string;
    year?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ diagrams: Diagram[]; total: number }> {
    const { query, make, year, status, limit = 50, offset = 0 } = params;

    const conditions = [];

    if (query && query.trim()) {
      conditions.push(
        sql`LOWER(${diagrams.searchText}) LIKE ${`%${query.toLowerCase()}%`}`
      );
    }

    if (make && make.trim()) {
      conditions.push(sql`LOWER(${diagrams.make}) = ${make.toLowerCase()}`);
    }

    if (year && year.trim()) {
      conditions.push(eq(diagrams.year, year));
    }

    if (status && status.trim()) {
      conditions.push(eq(diagrams.status, status));
    }

    let query_builder = db.select().from(diagrams);

    if (conditions.length > 0) {
      query_builder = query_builder.where(and(...conditions)) as any;
    }

    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(diagrams);

    const countQueryWithConditions = conditions.length > 0
      ? countQuery.where(and(...conditions))
      : countQuery;

    const totalResult = await countQueryWithConditions;
    const total = totalResult[0]?.count || 0;

    const result = await query_builder
      .orderBy(desc(diagrams.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      diagrams: result,
      total,
    };
  }

  // Get unique filter values for search dropdowns
  async getDiagramFilters(): Promise<{ makes: string[]; systems: string[]; years: string[] }> {
    const makesResult = await db
      .selectDistinct({ make: diagrams.make })
      .from(diagrams)
      .where(sql`${diagrams.make} IS NOT NULL`)
      .orderBy(diagrams.make);
    
    const systemsResult = await db
      .selectDistinct({ system: diagrams.system })
      .from(diagrams)
      .where(sql`${diagrams.system} IS NOT NULL`)
      .orderBy(diagrams.system);
    
    const yearsResult = await db
      .selectDistinct({ year: diagrams.year })
      .from(diagrams)
      .where(sql`${diagrams.year} IS NOT NULL`)
      .orderBy(desc(diagrams.year));
    
    return {
      makes: makesResult.map(r => r.make!).filter(Boolean),
      systems: systemsResult.map(r => r.system!).filter(Boolean),
      years: yearsResult.map(r => r.year!).filter(Boolean),
    };
  }

  // ✅ CORRECCIÓN DE BÚSQUEDA: Asegura que el WHERE maneje undefined/null correctamente
  async smartSearchDiagrams(params: {
    query?: string;
    make?: string;
    model?: string;
    year?: string;
    system?: string;
    onlyComplete?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ diagrams: Diagram[]; total: number }> {
    const { query, make, model, year, system, onlyComplete, limit = 50, offset = 0 } = params;
    
    const conditions = [];
    
    // Text search using searchText field (case-insensitive)
    if (query && query.trim()) {
      const searchLower = query.toLowerCase().trim();
      conditions.push(like(diagrams.searchText, `%${searchLower}%`));
    }
    
    // Filter by make (case-insensitive) - FIXED: Use Drizzle's ORM operations
    if (make && make.trim()) {
      conditions.push(sql`LOWER(${diagrams.make}) = LOWER(${make.trim()})`);
    }
    
    // Filter by model (case-insensitive)
    if (model && model.trim()) {
      conditions.push(sql`LOWER(${diagrams.model}) = LOWER(${model.trim()})`);
    }
    
    // Filter by year
    if (year && year.trim()) {
      conditions.push(eq(diagrams.year, year.trim()));
    }
    
    // Filter by system (case-insensitive)
    if (system && system.trim()) {
      conditions.push(sql`LOWER(${diagrams.system}) = LOWER(${system.trim()})`);
    }
    
    // Filter by complete status (if requested)
    if (onlyComplete) {
      conditions.push(
        sql`${diagrams.make} IS NOT NULL AND ${diagrams.model} IS NOT NULL AND ${diagrams.year} IS NOT NULL AND ${diagrams.system} IS NOT NULL`
      );
    }
    
    // Build WHERE clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(diagrams)
      .where(whereClause);
    
    const total = Number(countResult[0]?.count || 0);
    
    // Build query with ordering
    let query_builder = db.select().from(diagrams);
    
    if (whereClause) {
      query_builder = query_builder.where(whereClause) as any;
    }
    
    const hasSpecificFilters = !!(make?.trim() || model?.trim() || year?.trim() || system?.trim());
    
    const priorityComplete = hasSpecificFilters ? 1 : 3;
    const priorityPartial = hasSpecificFilters ? 2 : 4;
    
    const result = await query_builder
      .orderBy(
        sql`CASE 
          WHEN (${diagrams.make} IS NOT NULL AND ${diagrams.model} IS NOT NULL AND ${diagrams.year} IS NOT NULL AND ${diagrams.system} IS NOT NULL) THEN ${priorityComplete}::int
          ELSE ${priorityPartial}::int
        END`,
        desc(diagrams.createdAt)
      )
      .limit(limit)
      .offset(offset);
    
    return {
      diagrams: result,
      total,
    };
  }

  // Admin - Payments/Finance
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  async getPaymentsByMonth(year: number, month: number): Promise<Payment[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const result = await db
      .select()
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate),
          eq(payments.status, 'paid')
        )
      )
      .orderBy(desc(payments.createdAt));
    return result;
  }

  async getMonthlyRevenue(year: number, month: number): Promise<{ gross: number; count: number }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const result = await db
      .select({
        total: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate),
          eq(payments.status, 'paid')
        )
      );
    
    return {
      gross: parseFloat(result[0]?.total || '0'),
      count: Number(result[0]?.count || 0),
    };
  }

  // Admin - App Settings
  async getSetting(key: string): Promise<AppSetting | undefined> {
    const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    return result[0];
  }

  async setSetting(key: string, value: string, description?: string): Promise<AppSetting> {
    const existing = await this.getSetting(key);
    
    if (existing) {
      const result = await db
        .update(appSettings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(appSettings.key, key))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(appSettings)
        .values({ key, value, description })
        .returning();
      return result[0];
    }
  }

  async getAllSettings(): Promise<AppSetting[]> {
    const result = await db.select().from(appSettings);
    return result;
  }

  // Diagram History methods
  async addDiagramView(userId: string, diagramId: string): Promise<DiagramHistory> {
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const recentView = await db
      .select()
      .from(diagramHistory)
      .where(
        and(
          eq(diagramHistory.userId, userId),
          eq(diagramHistory.diagramId, diagramId),
          gt(diagramHistory.viewedAt, fiveSecondsAgo)
        )
      )
      .limit(1);
    
    if (recentView.length > 0) {
      return recentView[0];
    }
    
    const result = await db
      .insert(diagramHistory)
      .values({ userId, diagramId })
      .returning();
    return result[0];
  }

  async getUserHistory(userId: string, limit: number = 3): Promise<Array<DiagramHistory & { diagram: Diagram }>> {
    const result = await db
      .select({
        id: diagramHistory.id,
        userId: diagramHistory.userId,
        diagramId: diagramHistory.diagramId,
        viewedAt: diagramHistory.viewedAt,
        diagram: diagrams,
      })
      .from(diagramHistory)
      .innerJoin(diagrams, eq(diagramHistory.diagramId, diagrams.id))
      .where(eq(diagramHistory.userId, userId))
      .orderBy(desc(diagramHistory.viewedAt))
      .limit(limit);
    
    return result as Array<DiagramHistory & { diagram: Diagram }>;
  }
}

// ✅ EXPORTACIÓN CORREGIDA: Usamos export default para que funcione en Node.js v24 con tsx/ESM
export default new DbStorage();