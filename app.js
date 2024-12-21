const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 

app.post('/', async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`localhost:3000`);
});
