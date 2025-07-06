import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';

const app = express();
const port = 3000;
app.use(express.json());
const { Pool } = pg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
app.use(
  cors({
    origin:process.env.FRONTEND_URL, // your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);
app.get('/', async (req, res) => {
  const result = await pool.query(`Select * from tasks`);
  console.log(result.rows);
  res.json(result.rows);
});

app.get('/test', (req, res) => {
  res.send('Test route is working!');
});

app.listen(port, () => {
  console.log(`Server running in port ${port}`);
});
