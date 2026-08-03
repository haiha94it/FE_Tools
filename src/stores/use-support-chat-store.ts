import {
  SUPPORT_MISS_FALLBACK,
  SUPPORT_WELCOME_TEXT,
  formatSupportAnswerText,
  nowSupportTime,
} from "@/lib/support-chatbot-utils";
import { supportChatbotService } from "@/services/support-chatbot.service";
import type { SupportChatMessage } from "@/types/support-chatbot";
import { create } from "zustand";

function welcomeMessage(): SupportChatMessage {
  return {
    id: `welcome-${Date.now()}`,
    text: SUPPORT_WELCOME_TEXT,
    sender: "bot",
    timestamp: nowSupportTime(),
  };
}

interface SupportChatState {
  messages: SupportChatMessage[];
  sending: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  reset: () => void;
  send: (text: string) => Promise<void>;
}

export const useSupportChatStore = create<SupportChatState>((set, get) => ({
  messages: [welcomeMessage()],
  sending: false,
  isOpen: false,

  setOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),

  reset: () =>
    set({
      messages: [welcomeMessage()],
      sending: false,
    }),

  send: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().sending) return;

    const userMsg: SupportChatMessage = {
      id: `user-${Date.now()}`,
      text: trimmed,
      sender: "user",
      timestamp: nowSupportTime(),
    };
    set((s) => ({
      messages: [...s.messages, userMsg],
      sending: true,
    }));

    try {
      const result = await supportChatbotService.ask(trimmed);
      const answerText = formatSupportAnswerText(result.answer);
      const imageUrls = Array.isArray(result.image_urls)
        ? result.image_urls.filter(Boolean)
        : [];
      const miss = Boolean(result.miss_data) && !answerText && !imageUrls.length;

      const botMsg: SupportChatMessage = {
        id: `bot-${Date.now()}`,
        text: answerText || (miss ? SUPPORT_MISS_FALLBACK : imageUrls.length ? "" : SUPPORT_MISS_FALLBACK),
        sender: "bot",
        timestamp: nowSupportTime(),
        imageUrls,
        matchedQuestion: result.matched_question ?? null,
        faqId: result.faq_id ?? null,
        missData: miss || Boolean(result.miss_data),
      };
      set((s) => ({
        messages: [...s.messages, botMsg],
        sending: false,
      }));
    } catch {
      const errMsg: SupportChatMessage = {
        id: `err-${Date.now()}`,
        text: "Có lỗi khi gửi câu hỏi. Vui lòng thử lại sau.",
        sender: "bot",
        timestamp: nowSupportTime(),
      };
      set((s) => ({
        messages: [...s.messages, errMsg],
        sending: false,
      }));
    }
  },
}));
