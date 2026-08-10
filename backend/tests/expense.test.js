/* Why expense tests need cookies at all ?

Your expense routes are protected — they check for a valid accessToken cookie before letting the request through (via some auth middleware, probably verifyJWT or similar). A plain Supertest request has no cookies by default, so hitting /api/v1/expense without one will get you a 401 — exactly like a real logged-out browser would.

So to test expense routes, we need to simulate being logged in: log in once via Supertest, grab the cookies from that response, then attach those same cookies to every subsequent request in the file. 

\\\\\\\\\

The actual principle, stated plainly :-

You don't test every endpoint equally — you test where money, auth, or cross-user data access is involved thoroughly(update/delete are exactly that), and give lighter, single-smoke-test treatment to things like exports/reports where the main risk is "does it crash," not "does it leak data."
*/



import request, { cookies } from 'supertest';
import mongoose, { mongo } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' }); //loads your test database URI

import { app } from '../src/app.js';

let authCookies;
let id;

describe('expense', () => {
   const testUser = {
        name: 'Expense',
        email: 'expense@gmail.com',
        password: 'expense1234' 
    };

    beforeAll(async() => {
        await mongoose.connect(process.env.MONGODB_URI); 
        await mongoose.connection.collection('users').deleteMany({ email: testUser.email }); //cleanup as we want fresh user
        
        //register fake user:
        const response = await request(app)
                         .post('/api/v1/users/register')
                         .send(testUser)

        // login this user:
        const loginResponse = await request(app)
                              .post('/api/v1/users/login')   
                              .send({ email: testUser.email, password: testUser.password }) 

        authCookies = loginResponse.headers['set-cookie']              
                              
    });

    afterAll(async() => {
        await mongoose.connection.collection('users').deleteMany({email: testUser.email});
         await mongoose.connection.collection('users').deleteMany({email: 'other@gmail.com'});
        await mongoose.connection.close();
    });


    //write tests: (attach those cookies to every protected request)
   
    //happy path
    it('should create a new expense when authenticated', async() => {
        const response = await request(app)
           .post('/api/v1/expense/add')
           .set('Cookie',authCookies)
           .send({
                description: 'Groceries',
                amount: 500,
                category: 'food',
                date: '2026-08-01',
           });
           
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.amount).toBe(500);
            expect(response.body.data.description).toBe('Groceries');
           
    });
    
   //failure:-
   it('should reject creating an expense wihtout auth' , async() => {
          const response = await request(app)
           .post('/api/v1/expense/add')
           .send({
            description: 'Groceries',
            amount: 500,
            category: 'food',
            date: '2026-08-01',
         });

         expect(response.status).toBe(401);
        
   });

   it('should reject creating an expense with missing fields', async () => {
  const response = await request(app)
    .post('/api/v1/expense/add')
    .set('Cookie', authCookies)
    .send({
      description: 'Groceries',
      // amount missing
      category: 'food',
      date: '2026-08-01',
    });

  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
});

//get route:
it('should get the expense when authenticated', async() => {
     const response = await request(app)
       .get('/api/v1/expense/get')
       .set('Cookie',authCookies)
       
       expect(response.status).toBe(200);
       expect(response.body.success).toBe(true);

});

//removing data isolation risk
it('should only return expenses belongign to the logged-in user', async() => {
      //create a second user;
    const otherUser = {name: 'other', email:'other@gmaill.com', password: 'other1234'}
    await request(app).post('/api/v1/users/register').send(otherUser)
    const otherLogin = await request(app)
    .post('/api/v1/users/login')
    .send({ email: otherUser.email, password: otherUser.password })

    const otherCookies = otherLogin.headers['set-cookie'];

    await request(app)
     .post('/api/v1/expense/add')
     .set('Cookie',otherCookies)
     .send({ description: 'Other person expense', amount: 999, category: 'other', date: '2026-08-01' })

     // Now check that testUser's GET doesn't include otherUser's expense
  const response = await request(app)
    .get('/api/v1/expense/get')
    .set('Cookie', authCookies);

  const foundOtherExpense = response.body.data.find(exp => exp.amount === 999);
  expect(foundOtherExpense).toBeUndefined();
   });

   //delete expense:-
   it('should delete the expense when authenticated', async() => {
          const createResponse = await request(app)
            .post('/api/v1/expense/add')
            .set('Cookie', authCookies)
            .send({ description: 'To be deleted', amount: 100, category: 'test', date: '2026-08-01' })
        
            const expenseId = createResponse.body.data._id;

            const deleteResponse = await request(app)
             .delete(`/api/v1/expense/delete/${expenseId}`)
             .set('Cookie',authCookies)

          expect(deleteResponse.status).toBe(200);
          expect(deleteResponse.body.success).toBe(true);
   });

   it('should only delete his own expense', async() =>{
       const otherUser = {name: 'other', email:'other@gmaill.com', password: 'other1234'}
        await request(app).post('/api/v1/users/register').send(otherUser)
      const otherLogin = await request(app)
         .post('/api/v1/users/login')
         .send({ email: otherUser.email, password: otherUser.password })

    const otherCookies = otherLogin.headers['set-cookie'];

    const expenseResponse = await request(app)
     .post('/api/v1/expense/add')
     .set('Cookie',otherCookies)
     .send({ description: 'Other person expense', amount: 999, category: 'other', date: '2026-08-01' })


      const otherExpenseId = expenseResponse.body.data._id;

      const deleteResponse = await request(app)
        .delete(`/api/v1/expense/delete/${otherExpenseId}`) 
        .set('Cookie', authCookies)

          expect(deleteResponse.status).toBe(404);
          expect(deleteResponse.body.success).toBe(false);
 });

 //update expense;
 it('should update the expense when authenticated', async() => {
          const createResponse = await request(app)
            .post('/api/v1/expense/add')
            .set('Cookie', authCookies)
            .send({ description: 'To be deleted', amount: 100, category: 'test', date: '2026-08-01' })
        
            const expenseId = createResponse.body.data._id;

            const updateResponse = await request(app)
             .patch(`/api/v1/expense/update/${expenseId}`)
             .set('Cookie',authCookies)
             .send({ description: 'To be updated', amount: 200})
             

          expect(updateResponse.status).toBe(200);
          expect(updateResponse.body.success).toBe(true);
   });

   it('should only update his own expense', async() =>{
       const otherUser = {name: 'other', email:'other@gmaill.com', password: 'other1234'}
        await request(app).post('/api/v1/users/register').send(otherUser)
      const otherLogin = await request(app)
         .post('/api/v1/users/login')
         .send({ email: otherUser.email, password: otherUser.password })

    const otherCookies = otherLogin.headers['set-cookie'];

    const expenseResponse = await request(app)
     .post('/api/v1/expense/add')
     .set('Cookie',otherCookies)
     .send({ description: 'Other person expense', amount: 999, category: 'other', date: '2026-08-01' })


      const otherExpenseId = expenseResponse.body.data._id;

      const updateResponse = await request(app)
        .delete(`/api/v1/expense/delete/${otherExpenseId}`) 
        .set('Cookie', authCookies)
        .send({ description: 'updated expense', amount: 999})

          expect(updateResponse.status).toBe(404);
          expect(updateResponse.body.success).toBe(false);
 });


   

});

