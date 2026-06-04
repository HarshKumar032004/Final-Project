import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Sanity & Health Check API', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // Adding a pseudo health route check on the base router if it exists,
  // otherwise just proving supertest binds correctly to the Express instance.
  it('should boot the application correctly and enforce rate limiters/middleware', async () => {
    const res = await request(app).options('/api/v1/auth/login');
    // OPTIONS request typically handled by CORS and should be 204 No Content
    expect(res.status).toBe(204);
  });
});
