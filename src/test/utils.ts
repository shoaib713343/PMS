import request from 'supertest';
import app from '../app';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Super Admin user (can create projects and register users)
export const superAdmin = {
  firstName: 'Super',
  lastName: 'Admin',
  email: 'superadmin@test.com',
  password: 'SuperAdmin123',
  systemRole: 'super_admin' as const,  // ← Added 'as const'
};

// Regular user (limited access)
export const regularUser = {
  firstName: 'Regular',
  lastName: 'User',
  email: 'regular@test.com',
  password: 'Regular123',
  systemRole: 'user' as const,  // ← Added 'as const'
};

export let superAdminToken: string = '';
export let regularUserToken: string = '';
export let superAdminId: number = 0;
export let regularUserId: number = 0;

// Setup both users before tests
export const setupTestUsers = async () => {
  // 1. Create Super Admin
  const hashedPassword = await bcrypt.hash(superAdmin.password, 10);
  const [admin] = await db.insert(users).values({
    firstName: superAdmin.firstName,
    lastName: superAdmin.lastName,
    email: superAdmin.email,
    password: hashedPassword,
    systemRole: superAdmin.systemRole,  // Now TypeScript accepts this
  }).returning();
  superAdminId = admin.id;

  // Login as Super Admin
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: superAdmin.email,
      password: superAdmin.password,
    });
  superAdminToken = adminLogin.body.data.accessToken;

  // 2. Create Regular User
  const [regular] = await db.insert(users).values({
    firstName: regularUser.firstName,
    lastName: regularUser.lastName,
    email: regularUser.email,
    password: hashedPassword,
    systemRole: regularUser.systemRole,  // Now TypeScript accepts this
  }).returning();
  regularUserId = regular.id;

  // Login as Regular User
  const regularLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: regularUser.email,
      password: regularUser.password,
    });
  regularUserToken = regularLogin.body.data.accessToken;
};

// Clean up after tests
export const cleanupTestUsers = async () => {
  await db.delete(users).where(eq(users.id, superAdminId));
  await db.delete(users).where(eq(users.id, regularUserId));
};

// Helper for super admin requests
export const adminRequest = () => {
  return request(app).set('Authorization', `Bearer ${superAdminToken}`);
};

// Helper for regular user requests
export const userRequest = () => {
  return request(app).set('Authorization', `Bearer ${regularUserToken}`);
};