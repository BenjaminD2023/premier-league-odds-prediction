import React, { useState } from 'react';

export default function AIChat({ prediction, onAskQuestion, isLoading }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState('');

  const handleSend = async () => {
    if (!question.trim()) return;

    const userMessage = { role: 'user', message: question };
    setChatHistory([...chatHistory, userMessage]);
    setQuestion('');

    const response = await onAskQuestion(question);
    if (response) {
      setChatHistory(prev => [...prev, { role: 'assistant', message: response }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="prediction-box">
      <h3>🧠 Ask the AI Why</h3>
      <div className="prediction-content">
        <div className="chat-history">
          {chatHistory.length === 0 ? (
            <p className="placeholder">
              Generate a prediction first, then ask your own follow-up questions here.
            </p>
          ) : (
            chatHistory.map((entry, index) => (
              <div key={index} className={`chat-bubble ${entry.role}`}>
                <strong>{entry.role === 'user' ? 'You' : 'AI'}:</strong>
                <p dangerouslySetInnerHTML={{ __html: entry.message.replace(/\n/g, '<br>') }} />
              </div>
            ))
          )}
        </div>
        <div className="chat-input">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask the AI why it priced the draw this way..."
            rows="2"
            disabled={!prediction || isLoading}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!prediction || isLoading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
