import request from 'supertest';
import mongoose, { mongo } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' }); //loads your test database URI

import { app } from '../src/app.js';

//create user like this each file has its own unique user:
describe('register', () => {
  const testUser = {
    name: 'register User',
    email: 'registeruser@example.com',
    password: 'Password12345',
  };

  //a Jest lifecycle hook, runs once before any test in this file. We connect to Mongo here, once, rather than reconnecting for every single test.
 beforeAll(async() => {
 await mongoose.connect(process.env.MONGODB_URI);
 await mongoose.connection.collection('users').deleteMany({ email: testUser.email }); //cleanup
}); // bcz i want fresh user here for testing register


  //runs once after all tests finish.
afterAll(async() => {
    await mongoose.connection.collection('users').deleteMany({email: testUser.email});
    await mongoose.connection.close();
})
/* Dropping the DB guarantees every test run starts from a truly clean slate, so failures you see are real bugs, not leftover data problems. */

  
  //test 1 (happy path)
  it('should register a new user successfully', async() =>{
     const response = await request(app)
                    .post('/api/v1/users/register')
                    .send({ name: testUser.name, email: testUser.email, password: testUser.password })

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  //test2
  it('should reject registration with a duplicate email', async() =>{
    const response = await request(app)
                   .post('/api/v1/users/register')
                   .send({ name: testUser.name, email: testUser.email, password: testUser.password })

                   expect(response.status).toBe(400);
                   expect(response.body.success).toBe(false);
  });

  //test 3
  it('should reject registration with missing required fields', async() =>{
    const response = await request(app)
                   .post('/api/v1/users/register')
                   .send({ name:'', email: testUser.email, password: testUser.password })

                   expect(response.status).toBe(400);
                   expect(response.body.success).toBe(false);
  });

});


/* To be Noted:-

This is a standard testing convention: each test file should use data that can't collide with any other file, 
especially once you add more test files later (expense tests will need their own user too — use expensetest@example.com)


To  Make Jest run test files serially, not in parallel,
Add the --runInBand flag to your test script, which tells Jest "run one file at a time, don't parallelize":

json
"test": "node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand";

*/