const request = require('supertest');
const app = require('../index'); // Import the Express app

describe('Auth Service Tests', () => {
    describe('POST /sign-in', () => {
        it('should return 400 for missing email or password', async () => {
            const response = await request(app).post('/sign-in').send({});
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Email and password are required');
        });

        it('should return 500 for invalid credentials', async () => {
            const response = await request(app)
                .post('/sign-in')
                .send({ email: 'invalid@example.com', password: 'wrongpassword' });
            expect(response.status).toBe(500);
            expect(response.body.error).toBeDefined();
        });
    });

    // describe('POST /verify-token', () => {
    //     it('should return 400 for missing token', async () => {
    //         const response = await request(app).post('/verify-token').send({});
    //         expect(response.status).toBe(400);
    //         expect(response.body.error).toBe('Token is required');
    //     });

    //     it('should return 500 for invalid token', async () => {
    //         const response = await request(app)
    //             .post('/verify-token')
    //             .send({ token: 'invalid_token' });
    //         expect(response.status).toBe(500);
    //         expect(response.body.error).toBeDefined();
    //     });
    // });

    describe('GET /user/:uid', () => {
        it('should return 500 for invalid UID', async () => {
            const response = await request(app).get('/user/invalid_uid');
            expect(response.status).toBe(500);
            expect(response.body.error).toBeDefined();
        });
    });
});