const request = require('supertest');
const app = require('../index');

describe('Prompt Service Tests', () => {
    it('should return 400 for missing fields', async () => {
        const response = await request(app).post('/execute').send({});
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields: uid, username, and prompt are required.');
    });
});