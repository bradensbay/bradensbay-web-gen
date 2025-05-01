const request = require('supertest');
const app = require('../index');

describe('Update Key Service Tests', () => {
    it('should return 400 for missing uid or key', async () => {
        const response = await request(app).post('/addkey').send({});
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('USER_ID and PUBLIC_KEY are required.');
    });
});