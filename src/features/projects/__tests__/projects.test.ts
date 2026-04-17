import request from 'supertest';
import app from '../../../app';
import { setupTestUsers, cleanupTestUsers, superAdminToken } from '../../../test/utils';

describe('Projects API Tests', () => {
  let projectId: number;

  beforeAll(async () => {
    await setupTestUsers(); // Creates super admin and gets token
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  test('POST /projects - Super Admin should create a project', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        title: 'My Test Project',
        description: 'This is a test project',
        members: []
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('My Test Project');
    
    projectId = response.body.data.id;
  });

  test('GET /projects - should list all projects', async () => {
    const response = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.data)).toBe(true);
  });

  test('GET /projects/:id - should get project by id', async () => {
    const response = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(projectId);
  });

  test('PUT /projects/:id - should update project', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        title: 'Updated Project Title',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe('Updated Project Title');
  });
});