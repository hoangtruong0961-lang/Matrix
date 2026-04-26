import { ChatMessage } from "../types/world-book";

export interface ScanContext {
  messages: ChatMessage[]; // Toàn bộ chat history
  currentDepth: number; // Vị trí tin nhắn hiện tại (0 = mới nhất)
  charName: string;
  userName: string;
}
