const request = require('supertest');
const app = require('../index'); // Import the Express app

describe('Container Service Tests', () => {
    it('should return 403 for invalid key', async () => {
        const response = await request(app)
            .post('/execute')
            .send({ key: 'invalid_key', command: 'ls' });
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Unauthorized: Invalid key');
    });

    it('should return 400 for invalid command', async () => {
        const response = await request(app)
            .post('/execute')
            .send({ key: process.env.CONTAINER_SERVICE_KEY, command: null });
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid command');
    });
});