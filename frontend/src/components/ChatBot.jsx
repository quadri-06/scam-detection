import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../api.js";

export default function ChatBot({ scanContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm the LinkGuard helper. Ask me what a flag means, or how to spot a scam link." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const { reply } = await sendChatMessage(text, nextMessages, scanContext);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, I couldn't reply: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`chatbot ${open ? "chatbot--open" : ""}`}>
      {open && (
        <div className="chatbot__panel">
          <div className="chatbot__header">
            <span className="chatbot__title">LinkGuard Assistant</span>
            <button className="chatbot__close" onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div className="chatbot__messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chatbot__bubble chatbot__bubble--${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && <div className="chatbot__bubble chatbot__bubble--assistant chatbot__bubble--typing">···</div>}
          </div>

          <form className="chatbot__input-row" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a flag, or online safety…"
              aria-label="Message the assistant"
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <button className="chatbot__toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle assistant chat">
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
