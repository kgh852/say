const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const session = require('express-session');  // 세션 관리 라이브러리
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // public 폴더를 정적 파일로 제공

// 세션 설정
app.use(session({
  secret: 'secret-key',  // 세션을 암호화하는 데 사용되는 비밀 키
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // 로컬에서는 false, https에서는 true로 설정
}));

// 로그인 라우트
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 로그인 성공 시 세션에 사용자 정보를 저장
    req.session.user = { id: user.id, username: user.username };
    res.json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

// 로그아웃 라우트
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// 게시물 작성 라우트
app.post('/api/posts', async (req, res) => {
  const { username, content } = req.body;

  try {
    const post = await prisma.post.create({
      data: { username, content },
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// 게시물 조회 라우트
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// /admin 라우트 - 관리자 페이지로 리디렉션
app.get('/admin', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  // 로그인된 사용자는 admin.html로 리디렉션
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 관리자 게시물 관리 페이지
app.get('/admin/posts', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  res.json({ message: 'Welcome to admin post page' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
