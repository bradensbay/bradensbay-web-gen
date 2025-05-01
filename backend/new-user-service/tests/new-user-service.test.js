const request = require('supertest');
const app = require('../index');

describe('New User Service Tests', () => {
    it('should return 400 for missing email or password', async () => {
        const response = await request(app).post('/signup').send({});
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Email and password are required');
    });
});