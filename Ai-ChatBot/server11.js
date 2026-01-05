// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Configuration, OpenAIApi } = require('openai');

const app = express();

// Security & Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate Limiting (prevent abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP, please try again later." }
});
app.use(limiter);

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// In-memory storage (use Redis in production!)
const sessions = {};

// Helper: Generate unique ID if none provided
function getOrCreateSession(sessionId) {
  if (!sessionId || !sessions[sessionId]) {
    const id = sessionId || Date.now().toString();
    sessions[id] = [];
    return id;
  }
  return sessionId;
}

// POST /chat - Stream response with real-time typing
app.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const id = getOrCreateSession(sessionId);
  const userMessages = sessions[id];

  // Add user message
  userMessages.push({ role: 'user', content: message });

  try {
    // Use streaming for real-time experience
    const stream = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: userMessages,
      temperature: 0.7,
      stream: true,
    });

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    let fullResponse = '';

    // Pipe chunks to client
    stream.data.on('data', (chunk) => {
      const text = chunk.choices[0]?.delta?.content || '';
      fullResponse += text;
      res.write(text); // Send chunk immediately
    });

    stream.data.on('end', () => {
      // Save final bot reply
      userMessages.push({ role: 'assistant', content: fullResponse });
      res.end(); // Close stream
    });

    stream.data.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).json({ error: 'Streaming failed.' });
    });

  } catch (error) {
    console.error('OpenAI Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate response. Try again.' });
  }
});

// GET /chat/session — Retrieve session history (for resume)
app.get('/chat/session/:id', (req, res) => {
  const { id } = req.params;
  if (!sessions[id]) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  res.json({ messages: sessions[id] });
});

// DELETE /chat/session — Clear session
app.delete('/chat/session/:id', (req, res) => {
  const { id } = req.params;
  if (sessions[id]) delete sessions[id];
  res.status(200).json({ message: 'Session cleared.' });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});