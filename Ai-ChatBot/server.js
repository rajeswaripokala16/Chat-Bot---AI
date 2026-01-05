require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// In-memory session store (use Redis in production)
const sessions = {};

app.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  const id = sessionId || Date.now().toString();
  
  if (!sessions[id]) sessions[id] = [];

  // Append user message
  sessions[id].push({ role: 'user', content: message });

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: sessions[id],
      temperature: 0.7,
    });

    const botReply = response.data.choices[0].message.content;
    
    // Append bot response
    sessions[id].push({ role: 'assistant', content: botReply });

    res.json({ reply: botReply, sessionId: id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));