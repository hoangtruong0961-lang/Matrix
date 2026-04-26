import { EntryPosition } from "../types/world-book";
import { AssembledEntry } from "./world-book-assembler";

export interface PromptSections {
  systemPrompt: string;
  worldInfoBeforeChar: string[];
  worldInfoAfterChar: string[];
  worldInfoBeforeExample: string[];
  worldInfoAfterExample: string[];
  depthEntries: Map<number, string[]>; // depth -> contents
  characterDescription: string;
  exampleMessages: string;
  chatHistory: string;
}

export class PromptAssembler {
  assemble(
    basePrompt: PromptSections,
    worldBookEntries: AssembledEntry[],
  ): string {
    // Phân loại entries theo position
    const buckets: Record<EntryPosition, AssembledEntry[]> = {
      [EntryPosition.BEFORE_CHAR]: [],
      [EntryPosition.AFTER_CHAR]: [],
      [EntryPosition.BEFORE_EXAMPLE]: [],
      [EntryPosition.AFTER_EXAMPLE]: [],
      [EntryPosition.AT_DEPTH]: [],
    };

    for (const entry of worldBookEntries) {
      if (buckets[entry.entry.position]) {
        buckets[entry.entry.position].push(entry);
      }
    }

    // Build prompt theo thứ tự SillyTavern:
    // System -> WI (before_char) -> Character -> WI (after_char) ->
    // WI (before_example) -> Examples -> WI (after_example) -> Chat History + Depth WI

    const parts: string[] = [];

    if (basePrompt.systemPrompt) {
      parts.push(basePrompt.systemPrompt);
    }

    // BEFORE_CHAR
    if (buckets[EntryPosition.BEFORE_CHAR].length > 0) {
      parts.push(this.joinEntries(buckets[EntryPosition.BEFORE_CHAR]));
    }

    // Character Description
    if (basePrompt.characterDescription) {
      parts.push(basePrompt.characterDescription);
    }

    // AFTER_CHAR
    if (buckets[EntryPosition.AFTER_CHAR].length > 0) {
      parts.push(this.joinEntries(buckets[EntryPosition.AFTER_CHAR]));
    }

    // BEFORE_EXAMPLE
    if (buckets[EntryPosition.BEFORE_EXAMPLE].length > 0) {
      parts.push(this.joinEntries(buckets[EntryPosition.BEFORE_EXAMPLE]));
    }

    // Examples
    if (basePrompt.exampleMessages) {
      parts.push(basePrompt.exampleMessages);
    }

    // AFTER_EXAMPLE
    if (buckets[EntryPosition.AFTER_EXAMPLE].length > 0) {
      parts.push(this.joinEntries(buckets[EntryPosition.AFTER_EXAMPLE]));
    }

    // Chat History (đã bao gồm depth entries nếu cần)
    if (basePrompt.chatHistory) {
      parts.push(
        this.injectDepthEntries(
          basePrompt.chatHistory,
          buckets[EntryPosition.AT_DEPTH],
        ),
      );
    }

    return parts.filter((p) => p.trim().length > 0).join("\n\n");
  }

  private joinEntries(entries: AssembledEntry[]): string {
    return entries.map((e) => e.content).join("\n");
  }

  /**
   * Chèn depth entries vào đúng vị trí trong chat history
   * depth=4 nghĩa là chèn vào sau tin nhắn thứ 4 từ dưới lên
   */
  private injectDepthEntries(
    chatHistory: string,
    depthEntries: AssembledEntry[],
  ): string {
    if (depthEntries.length === 0) return chatHistory;

    const messages = chatHistory.split("\n").filter((l) => l.trim().length > 0);
    const entriesByDepth = new Map<number, string[]>();

    for (const e of depthEntries) {
      const d = e.entry.depth;
      if (!entriesByDepth.has(d)) entriesByDepth.set(d, []);
      entriesByDepth.get(d)!.push(e.content);
    }

    // Chèn từ dưới lên để không làm lệch index
    const sortedDepths = Array.from(entriesByDepth.keys()).sort(
      (a, b) => b - a,
    );

    for (const depth of sortedDepths) {
      // "Tính index từ cuối mảng: arr.length - depth"
      const insertIndex = Math.max(0, messages.length - depth);
      const contents = entriesByDepth.get(depth)!.join("\n");
      messages.splice(insertIndex, 0, contents);
    }

    return messages.join("\n");
  }
}
