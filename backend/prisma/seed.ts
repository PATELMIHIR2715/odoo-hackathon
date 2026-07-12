import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';
import { ALL_APP_MODULES, defaultModulesForRole } from '../src/constants/modules.js';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.env.SEED_ADMIN_NAME?.trim() || 'TransitOps Administrator';

  if (!email || !password) {
    throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before running db:seed.');
  }
  if (password.length < 8) throw new Error('SEED_ADMIN_PASSWORD must contain at least 8 characters.');

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.profile.upsert({
    where: { email },
    update: { fullName, role: Role.ADMIN, moduleAccess: ALL_APP_MODULES, passwordHash, refreshTokenHash: null },
    create: { fullName, email, role: Role.ADMIN, moduleAccess: defaultModulesForRole(Role.ADMIN), passwordHash },
  });
  console.log(`Admin profile is ready for ${email}.`);
}

main()
  .catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
