import 'dotenv/config';
import express from 'express';
import pool from './utils/db.mjs';
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ✅ ใส่ CORS ตรงนี้ (หลังสร้าง app และก่อน routes)
app.use(
    cors({
      origin: [
        "http://localhost:5173", // FE local (Vite)
        "http://localhost:3000", // FE local (React แบบอื่น)
        "https://your-frontend.vercel.app", // FE deployed (Vercel)
      ],
    })
  );

app.get("/health", (req, res) => {
    res.status(200).json({ message: "OK" });
  });

// GET /posts - ดึงข้อมูล posts ทั้งหมด
app.get('/posts', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.image,
        p.title,
        p.description,
        p.date,
        p.content,
        p.likes_count,
        c.name as category_name,
        s.status as status_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN statuses s ON p.status_id = s.id
      ORDER BY p.date DESC, p.id DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    
    // ตรวจสอบประเภทของ error
    let errorMessage = error.message;
    if (error.code === 'ENOTFOUND') {
      errorMessage = 'Cannot connect to database. Please check your CONNECTION_STRING in .env file.';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Database connection refused. Please check your connection settings.';
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
      message: errorMessage,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// POST /posts - สร้าง post ใหม่
app.post('/posts', async (req, res) => {
  try {
    const { title, image, category_id, description, content, status_id } = req.body;

    // ตรวจสอบว่ามีข้อมูลครบถ้วน
    if (!title || !image || category_id === undefined || !content || status_id === undefined) {
      return res.status(400).json({
        message: 'Server could not create post because there are missing data from client'
      });
    }

    // Insert ข้อมูลลงฐานข้อมูล
    const query = `
      INSERT INTO posts (title, image, category_id, description, content, status_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, image, category_id, description, content, status_id, date, likes_count
    `;

    const values = [title, image, category_id, description || null, content, status_id];
    const result = await pool.query(query, values);

    res.status(201).json({
      message: 'Created post sucessfully'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    
    // ตรวจสอบว่าเป็น database connection error
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(500).json({
        message: 'Server could not create post because database connection'
      });
    }

    // Error อื่นๆ
    res.status(500).json({
      message: 'Server could not create post',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});