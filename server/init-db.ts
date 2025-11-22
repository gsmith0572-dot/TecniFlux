import { db } from "./db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "./auth";

export async function initializeDatabase() {
  try {
    console.log('[DB Init] Checking if admin user exists...');
    
    // Check if admin user exists
    const adminUser = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    
    if (adminUser.length === 0) {
      console.log('[DB Init] Admin user not found. Creating default admin...');
      
      const hashedPassword = await hashPassword('admin123');
      
      await db.insert(users).values({
        id: sql`gen_random_uuid()`,
        username: 'admin',
        email: 'admin@tecniflux.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        searchesUsed: 0,
        searchesLimit: 3,
        createdAt: new Date(),
      });
      
      console.log('[DB Init] ✅ Default admin user created successfully');
      console.log('[DB Init] Username: admin');
      console.log('[DB Init] Password: admin123');
    } else {
      console.log('[DB Init] ✅ Admin user already exists');
    }
  } catch (error) {
    console.error('[DB Init] ❌ Error initializing database:', error);
  }
}
