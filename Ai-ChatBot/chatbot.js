// chatbot.js
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Add message to chat
function addMessage(text, isUser) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
  messageDiv.textContent = text;

  // Add hover actions
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

  // Animate in
  setTimeout(() => {
    messageDiv.style.opacity = '1';
  }, 50);
}

// Simulate bot response (in real app, call API)
async function getBotResponse(userText) {
  // In production: call your backend API that uses GPT
  return `I understood: "${userText}". How can I assist further?`;
}

// Send message
sendBtn.addEventListener('click', async () => {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, true);
  userInput.value = '';

  // Simulate typing
  setTimeout(async () => {
    const response = await getBotResponse(text);
    addMessage(response, false);
  }, 600);
});

// Enter key support
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

// Initial welcome message
window.onload = () => {
  addMessage("Hello! I'm your AI assistant. How can I help you today?", false);
};