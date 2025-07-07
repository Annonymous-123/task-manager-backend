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
app.get('/tasks/', async (req, res) => {
  try {
    const result = await pool.query(`Select * from tasks`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/tasks/', async (req, res) => {
  try {
    const task = req.body.task;
    const result = await pool.query(
      `Insert into tasks (task) values ($1) returning *`,
      [task]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running in port ${port}`);
});
