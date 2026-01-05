// chatbot.js
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const emojiBtn = document.getElementById('emojiBtn');

let currentSessionId = null; // Will be set after first message

// Add message to chat
function addMessage(text, isUser) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
  messageDiv.textContent = text;

  // Actions for user messages
  if (isUser) {
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    actions.innerHTML = '🔁 Reply | 📋 Copy';
    messageDiv.appendChild(actions);
  } else {
    const info = document.createElement('div');
    info.className = 'info-icon';
    info.textContent = '💡 AI-generated';
    messageDiv.appendChild(info);
  }

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Fade-in animation
  setTimeout(() => {
    messageDiv.style.opacity = '1';
  }, 50);
}

// Show typing indicator
function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot-message typing-indicator';
  typingDiv.textContent = '...';

  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return typingDiv;
}

// Remove typing indicator
function removeTypingIndicator(indicator) {
  if (indicator && indicator.parentNode) {
    indicator.remove();
  }
}

// Send message via API with streaming
async function sendMessage(messageText) {
  const typingIndicator = showTypingIndicator();

  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: messageText,
        sessionId: currentSessionId,
      }),
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;

      // Update the typing indicator in real time
      if (typingIndicator.textContent !== fullText) {
        typingIndicator.textContent = fullText + '...';
      }
    }

    removeTypingIndicator(typingIndicator);
    addMessage(fullText, false);

    // Save session ID after first message
    if (!currentSessionId) {
      const data = await response.json();
      currentSessionId = data.sessionId;
    }

  } catch (error) {
    console.error('Error sending message:', error);
    removeTypingIndicator(typingIndicator);
    addMessage("Sorry, I couldn't connect to the AI right now.", false);
  }
}

// Send message on click or Enter
sendBtn.addEventListener('click', async () => {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, true);
  userInput.value = '';

  await sendMessage(text);
});

// Enter key support
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// Emoji picker (simple demo)
emojiBtn.addEventListener('click', () => {
  const emojis = ['😊', '🤔', '🚀', '🔥', '✨', '🎉'];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  userInput.value += ' ' + randomEmoji;
  userInput.focus();
});

// Initial welcome message
window.onload = async () => {
  const welcomeMsg = "Hello! I'm your AI assistant. How can I help you today?";
  addMessage(welcomeMsg, false);
};