//only server startup logic:

import { app } from "./app.js";
import connectDB from './db/index.js'
import dotenv from 'dotenv';
dotenv.config({path: './.env'});

const PORT = process.env.PORT || 8000;

const startServer = async() => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Failed to start application:", err);
    process.exit(1);
  }
};

startServer();

