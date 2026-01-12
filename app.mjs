import 'dotenv/config';
import express from 'express';
import pool from './utils/db.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});