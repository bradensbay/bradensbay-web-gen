const request = require('supertest');
const app = require('../index');

describe('Start VM Service Tests', () => {
    it('should return 403 for unverified email', async () => {
        const response = await request(app).post('/endpoint').send({ uid: 'test', email: 'test@example.com' });
        expect(response.status).toBe(403);
        expect(response.body.message).toBe('User email is not verified.');
    });
});