import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";

async function createAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const email = process.env.ADMIN_EMAIL || "admin@tecniflux.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  try {
    // Check if admin already exists
    const existing = await storage.getUserByUsername(username);
    if (existing) {
      console.log(`❌ Usuario '${username}' ya existe`);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await storage.createUser({
      username,
      email,
      password: hashedPassword,
    });

    // Promote to admin
    await storage.updateUserRole(user.id, 'admin');

    console.log(`✅ Usuario admin creado exitosamente:`);
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: admin`);
    console.log(`\n⚠️  Cambia la contraseña después del primer login!`);

    process.exit(0);
  } catch (error) {
    console.error('Error creando admin:', error);
    process.exit(1);
  }
}

createAdmin();
