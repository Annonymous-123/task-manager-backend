import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';
import Result from 'pg/lib/result';
import bcrypt from 'bcrypt';

const app = express();
const port = 3000;
app.use(express.json());
const { Pool } = pg;
const saltRounds = 10;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);
//Registering new user
app.post('/register/', async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }
    const result = await pool.query(
      `Select * from task_manager_users where username=$1`,
      [username]
    );

    if (result.rows.length > 0) {
      return res
        .status(409)
        .json({ error: 'User already registered. Please login.' });
    } else {
      const result1 = await pool.query(
        `Insert into task_manager_users (username,password) values ($1,$2) returning*`,
        [username, hashedPassword]
      );
      res.status(201).json(result1.rows[0]);
    }
  } catch (err) {
    console.error('Error', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//logging user
app.post('/login/', async (req, res) => {
  try {
    const usernameEntered = req.body.username;
    const passwordEntered = req.body.password;
    const result = await pool.query(
      `Select * from task_manager_users where username=$1`,
      [usernameEntered]
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid Credentials' });
    } else {
      const user = result.rows[0];
      const storedHashedPassword = user.password;
      const isMatch = await bcrypt.compare(
        passwordEntered,
        storedHashedPassword
      );
      if (isMatch) {
        res.status(200).json({
          message: ' Login Successful',
          user: { id: user.id, username: user.username },
        });
      } else {
        res.status(401).json({ error: 'Invalid Credentials' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//fetch the tasks from database
app.get('/tasks/', async (req, res) => {
  try {
    const userId = req.query.user_id;
    const result = await pool.query(`Select * from tasks where user_id=$1`, [
      userId,
    ]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
//adding tasks to db
app.post('/tasks/', async (req, res) => {
  try {
    const task = req.body.task;
    const userId = req.body.user_id;
    const result = await pool.query(
      `Insert into tasks (task) values ($1) returning *`,
      [task, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
//deleting tasks from db
app.delete('/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query(
      `Delete from tasks where id=$1 returning *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
//changing status of tasks in db
app.patch('/tasks/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `Update tasks set completed=$1 where id=$2 returning *`,
      [req.body.check, req.params.id]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running in port ${port}`);
});
