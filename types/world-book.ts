export enum EntryPosition {
  BEFORE_CHAR = 0, // Trước character description
  AFTER_CHAR = 1, // Sau character description
  BEFORE_EXAMPLE = 2, // Trước example messages
  AFTER_EXAMPLE = 3, // Sau example messages
  AT_DEPTH = 4, // Chèn vào depth cụ thể trong chat history
}

export enum SelectiveLogic {
  AND_ANY = 0, // Có ít nhất 1 keysecondary match
  AND_ALL = 1, // Tất cả keysecondary phải match
  NOT_ANY = 2, // Không có keysecondary nào match
  NOT_ALL = 3, // Không phải tất cả keysecondary đều match
}

export interface WorldBookEntry {
  uid: number;
  key: string[]; // Primary keywords
  keysecondary: string[]; // Secondary keywords (dùng khi selective=true)
  comment: string;
  content: string;
  constant: boolean; // Luôn chèn, bỏ qua key matching
  selective: boolean; // Có kiểm tra keysecondary không
  order: number; // Insertion priority (thấp = trước)
  position: EntryPosition;
  disable: boolean;
  addMemo: boolean;
  displayIndex: number;

  // Recursion control
  excludeRecursion: boolean; // Không bị trigger bởi recursive scan
  preventRecursion: boolean; // Content của entry này không được quét recursive
  delayUntilRecursion: boolean; // Chỉ trigger trong recursive scan, không initial scan

  probability: number;
  useProbability: boolean;

  depth: number; // Dùng khi position = AT_DEPTH
  selectiveLogic: SelectiveLogic;

  group: string;
  groupOverride: boolean;
  groupWeight: number;
  scanDepth: number | null; // Override scan_depth global cho entry này
  caseSensitive: boolean;
  matchWholeWords: boolean | null;
  useGroupScoring: boolean | null;
  automationId: string;
}

export interface WorldBook {
  name: string;
  description: string;
  scan_depth: number; // Số tin nhắn gần nhất để quét (thường 50-100)
  token_budget: number; // Tổng token tối đa cho WB entries
  recursive_scanning: boolean; // Có quét content của entry đã match để tìm entry khác không
  entries: Record<string, WorldBookEntry>; // Key là string của uid
  extensions?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}
