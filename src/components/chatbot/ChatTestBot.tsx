"use client";

import Button from "@/components/ui/button/Button";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { chatbotService } from "@/services/chatbot.service";
import { useChatbotStore } from "@/stores/use-chatbot-store";
import { useChatbotTrainingStore } from "@/stores/use-chatbot-training-store";
import { useEffect, useRef, useState } from "react";
import { FiCpu, FiRefreshCw, FiSend, FiUser } from "react-icons/fi";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  matchedQuestion?: string | null;
  trainingDataId?: number | null;
  imageUrls?: string[];
}

interface ChatTestBotProps {
  chatbotId: number;
}

export default function ChatTestBot({ chatbotId }: ChatTestBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Khởi động cuộc trò chuyện khi đổi chatbot
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        text: "Xin chào! Tôi là chatbot ảo của bạn. Bạn hãy nhập các câu hỏi giả lập như một khách hàng thực tế để kiểm tra phản hồi theo kịch bản huấn luyện.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setInputMessage("");
    setIsLoading(false);
  }, [chatbotId]);

  // Scroll xuống cuối tin nhắn
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Tự động giãn chiều cao textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputMessage]);

  const handleSend = async () => {
    const text = inputMessage.trim();
    if (!text || isLoading) return;

    const timestamp = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text,
      sender: "user",
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const result = await chatbotService.testMessage(chatbotId, text);
      const answer = Array.isArray(result.answer)
        ? result.answer.filter(Boolean).join("\n")
        : result.answer;
      const imageUrls = Array.isArray(result.image_urls)
        ? result.image_urls.filter(Boolean)
        : [];

      const botResponseText =
        answer ||
        (imageUrls.length
          ? ""
          : "Không tìm thấy câu trả lời phù hợp trong kịch bản huấn luyện!");

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        text: botResponseText,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        matchedQuestion: result.llm_suggestion || null,
        trainingDataId: result.training_data_id || null,
        imageUrls,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        text: "Có lỗi xảy ra khi gửi tin nhắn test chatbot. Vui lòng thử lại.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleRefresh = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        text: "Cuộc trò chuyện đã được làm mới. Hãy nhập câu hỏi test bot.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const handleViewQnALink = (msg: Message) => {
    if (!msg.matchedQuestion) return;
    
    // 1. Chuyển tab sang Q&A training
    useChatbotStore.getState().setDetailTab("training");
    // 2. Điền text câu hỏi để tìm kiếm
    useChatbotTrainingStore.getState().setTrainingSearch(msg.matchedQuestion);
    // 3. Trigger reload training data list
    void useChatbotTrainingStore.getState().fetchTrainingData();
  };

  return (
    <div className="flex h-full flex-col bg-gray-50/30 dark:bg-gray-900/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs">
            <FiCpu size={18} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Khung Test Chatbot
            </h4>
            <p className="text-[11px] font-medium text-gray-500">
              Giả lập hội thoại realtime
            </p>
          </div>
        </div>
        <Tooltip content="Làm mới cuộc trò chuyện" side="top" avoidCollisions={false}>
          <button
            type="button"
            aria-label="Làm mới cuộc trò chuyện"
            onClick={handleRefresh}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-xs transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <FiRefreshCw size={14} aria-hidden />
          </button>
        </Tooltip>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[300px]">
        {messages.map((msg) => {
          const isBot = msg.sender === "bot";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                isBot ? "justify-start" : "justify-end"
              }`}
            >
              {isBot && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <FiCpu size={15} />
                </div>
              )}
              <div className="max-w-[75%] min-w-0">
                {msg.text ? (
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${
                      isBot
                        ? "bg-white text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 rounded-tl-none"
                        : "bg-brand-500 text-white rounded-tr-none"
                    }`}
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {msg.text}
                  </div>
                ) : null}
                {isBot && msg.imageUrls && msg.imageUrls.length > 0 ? (
                  <div
                    className={`mt-1.5 flex flex-col gap-1.5 ${
                      msg.text ? "" : ""
                    }`}
                  >
                    {msg.imageUrls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Ảnh trả lời bot"
                          className="max-h-48 w-full object-contain bg-gray-50 dark:bg-gray-900"
                        />
                      </a>
                    ))}
                  </div>
                ) : null}
                <div
                  className={`mt-1 flex items-center gap-2 text-[10px] text-gray-400 ${
                    isBot ? "justify-start" : "justify-end"
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {isBot && msg.trainingDataId && (
                    <button
                      type="button"
                      onClick={() => handleViewQnALink(msg)}
                      className="cursor-pointer font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      • Xem Q&A gốc
                    </button>
                  )}
                </div>
              </div>
              {!isBot && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <FiUser size={15} />
                </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <FiCpu size={15} />
            </div>
            <div className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center shrink-0">
              <span className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Surface */}
      <div className="border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/80">
        <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Nhập tin nhắn khách hàng giả lập..."
            className="flex-1 bg-transparent border-0 p-0 text-sm focus:ring-0 resize-none max-h-30 focus:outline-hidden dark:text-white"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            className="shrink-0 !h-8 !w-8 !p-0 flex items-center justify-center"
          >
            <FiSend size={14} />
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-gray-400">
          Enter để gửi · Shift + Enter để xuống dòng
        </p>
      </div>
    </div>
  );
}
