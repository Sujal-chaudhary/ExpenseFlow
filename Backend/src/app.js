import express from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser'

const app = express();

//middlewares:-
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    Credentials: true,
  }),
);

app.use(express.json()); //without this req.body is undefined
app.use(express.urlencoded({ extended: true })); //helps to convert urlencoded date -> js object -> stored in req.body
app.use(cookieParser());

//routes:-





export { app };

//notes:-

/*
  The express.json() is a built-in middleware in Express. It helps your app read JSON data sent from the client (like in POST or PUT requests) 
   and makes it available in req.body. Without it, Express cannot understand JSON data in requests.
 */
