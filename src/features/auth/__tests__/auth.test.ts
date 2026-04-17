/// <reference types="jest" />

import request from 'supertest';
import app from '../../../app';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

describe('Authentication API - Role Based Access', () => {
  
  let superAdminToken: string = '';
  let regularUserToken: string = '';
  let superAdminId: number = 0;
  let regularUserId: number = 0;

  // Create a super admin and a regular user before tests
  beforeAll(async () => {
    // 1. Create Super Admin user directly in database (since only super admin can create users)
    const hashedPassword = await bcrypt.hash('SuperAdmin123', 10);
    const [superAdmin] = await db.insert(users).values({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@test.com',
      password: hashedPassword,
      systemRole: 'super_admin',
    }).returning();
    superAdminId = superAdmin.id;

    // Login as Super Admin to get token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@test.com',
        password: 'SuperAdmin123',
      });
    superAdminToken = loginRes.body.data.accessToken;

    // 2. Create Regular User directly in database
    const [regularUser] = await db.insert(users).values({
      firstName: 'Regular',
      lastName: 'User',
      email: 'regular@test.com',
      password: hashedPassword,
      systemRole: 'user',
    }).returning();
    regularUserId = regularUser.id;

    // Login as Regular User to get token
    const regularLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'regular@test.com',
        password: 'SuperAdmin123',
      });
    regularUserToken = regularLoginRes.body.data.accessToken;
  });

  // Clean up after tests
  afterAll(async () => {
    await db.delete(users).where(eq(users.id, superAdminId));
    await db.delete(users).where(eq(users.id, regularUserId));
  });

  // ============================================
  // TEST: Only Super Admin can register new user
  // ============================================
  
  describe('POST /api/v1/auth/register - Access Control', () => {
    
    test('✅ Super Admin should be able to register a new user', async () => {
      const newUserEmail = `newuser${Date.now()}@test.com`;
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          firstName: 'New',
          lastName: 'User',
          email: newUserEmail,
          password: 'NewUser123456',
          systemRole: 'user',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newUserEmail);
      
      // Clean up - delete the created user
      await db.delete(users).where(eq(users.email, newUserEmail));
    });

    test('❌ Regular User should NOT be able to register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          firstName: 'Hacker',
          lastName: 'Attempt',
          email: `hacker${Date.now()}@test.com`,
          password: 'Hacker123456',
          systemRole: 'user',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Not allowed');
    });

    test('❌ Unauthenticated user should NOT be able to register', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Anonymous',
          lastName: 'User',
          email: `anonymous${Date.now()}@test.com`,
          password: 'Anonymous123',
          systemRole: 'user',
        });

      expect(response.status).toBe(401);
    });

    test('✅ Super Admin can create another Super Admin', async () => {
      const newAdminEmail = `newadmin${Date.now()}@test.com`;
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          firstName: 'New',
          lastName: 'Admin',
          email: newAdminEmail,
          password: 'NewAdmin123456',
          systemRole: 'super_admin',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.systemRole).toBe('super_admin');
      
      // Clean up
      await db.delete(users).where(eq(users.email, newAdminEmail));
    });
  });

  // ============================================
  // TEST: Login (anyone can login)
  // ============================================
  
  describe('POST /api/v1/auth/login - Public Access', () => {
    
    test('✅ Any user can login', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'regular@test.com',
          password: 'SuperAdmin123',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    test('❌ Login fails with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'regular@test.com',
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
    });
  });
});