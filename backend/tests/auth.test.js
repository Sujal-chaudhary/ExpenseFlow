import request from 'supertest';
import mongoose, { mongo } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' }); //loads your test database URI

import { app } from '../src/app.js';

// Jest lifecycle hook, runs once before any test in this file. We connect to Mongo here, once, rather than reconnecting for every single test.
beforeAll(async() => {
await mongoose.connect(process.env.MONGODB_URI);
});



//The actual test cases:-

describe('Auth: Login', () => {
  const testUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'Password123!',
  };

  //runs once after all tests finish.
afterAll(async() => {
    await mongoose.connection.collection('users').deleteMany({email: testUser.email});
    await mongoose.connection.close();
});
/* Dropping the DB guarantees every test run starts from a truly clean slate, so failures you see are real bugs, not leftover data problems. */


  // registers our one fake user once
  beforeAll(async () => {
    await request(app)
      .post('/api/v1/users/register')
      .send(testUser);
  });

  //Test 1 (happy path)
  it('should return a token when login credentials are valid', async () => {
    const response = await request(app)
      .post('/api/v1/users/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.body.success).toBe(true);
  });

 // Test 2 (failure case)
  it('should return 401 when password is incorrect', async () => {
    const response = await request(app)
      .post('/api/v1/users/login')
      .send({ email: testUser.email, password: 'WrongPassword!' });

    expect(response.status).toBe(401);
  });

});

