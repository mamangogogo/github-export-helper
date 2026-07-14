import React, { useRef, useEffect, useState } from "react";
import { Order, ChatMessage } from "../types";
import { Send, X, MessageSquare, User, Check, ShieldAlert } from "lucide-react";

interface ChatBoxProps {
  order: Order;
  chatHistory: ChatMessage[];
  currentUserRole: "runner" | "customer";
  isTyping?: boolean;
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

export default function ChatBox({
  order,
  chatHistory,
  currentUserRole,
  isTyping,
  onSendMessage,
  onClose,
}: ChatBoxProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chats
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  // Determine chat partner name
  const partnerName = currentUserRole === "runner" 
    ? order.customerName || "Pelanggan"
    : order.runnerId ? "Runner" : "Mencari Runner...";

  return (
    <div id="chat-box-container" className="w-80 md:w-96 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[450px] ring-1 ring-indigo-500/10">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-850 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 truncate max-w-[180px]">{partnerName}</h4>
            <p className="text-[9px] text-indigo-400 font-mono truncate max-w-[180px]">
              Pesanan: {order.title}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
          title="Tutup Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <MessageSquare className="w-8 h-8 text-slate-700 mb-2 animate-bounce" />
            <p className="text-xs text-slate-500">Mula bersembang di sini.</p>
            <p className="text-[10px] text-slate-600 mt-1 italic">"Hantar pesanan, tanya khabar, bincang upah"</p>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isMe = msg.sender === currentUserRole;
            const isSystem = msg.sender === "system";

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-slate-900/80 border border-slate-850/60 px-3 py-1 rounded-full text-[9px] text-slate-400 font-mono flex items-center gap-1.5 shadow-sm max-w-[90%] text-center">
                    <span className="w-1 h-1 rounded-full bg-indigo-500 animate-ping"></span>
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  isMe 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-slate-900 text-slate-200 border border-slate-850 rounded-tl-none"
                }`}>
                  <p>{msg.text}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-[8px] text-slate-500 font-mono">{msg.timestamp}</span>
                  {isMe && <Check className="w-2.5 h-2.5 text-indigo-400" />}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex flex-col items-start">
            <div className="bg-slate-900 text-slate-400 border border-slate-850 rounded-2xl rounded-tl-none px-3.5 py-2 text-xs flex items-center gap-1.5">
              <span>Menaip</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-850 flex items-center gap-2">
        <input
          type="text"
          placeholder="Tulis mesej anda..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-all shadow-md active:scale-95"
          title="Hantar"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
