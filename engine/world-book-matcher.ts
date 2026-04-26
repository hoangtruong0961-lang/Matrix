import { WorldBook, WorldBookEntry, SelectiveLogic } from "../types/world-book";
import { ScanContext } from "./world-book-context";

export interface MatchResult {
  entry: WorldBookEntry;
  matchedKeys: string[];
  isRecursive: boolean;
}

export class WorldBookMatcher {
  constructor(
    private worldBook: WorldBook,
    private context: ScanContext,
  ) {}

  /**
   * Quét toàn bộ context để tìm entry match
   */
  scan(recursivePass: boolean = false): MatchResult[] {
    const results: MatchResult[] = [];
    const scanText = this.buildScanText();

    for (const entry of Object.values(this.worldBook.entries)) {
      if (entry.disable) continue;

      // Delay until recursion: bỏ qua ở initial scan, chỉ xử lý ở recursive
      if (!recursivePass && entry.delayUntilRecursion) continue;
      if (recursivePass && entry.excludeRecursion) continue;

      const match = this.matchEntry(entry, scanText, recursivePass);
      if (match) results.push(match);
    }

    return results;
  }

  private buildScanText(): string {
    // Chỉ quét scan_depth tin nhắn gần nhất
    const depth = this.worldBook.scan_depth;
    const recentMessages = this.context.messages.slice(-Math.max(1, depth));

    return recentMessages.map((m) => `${m.role}: ${m.content}`).join("\n");
  }

  public matchEntry(
    entry: WorldBookEntry,
    text: string,
    recursivePass: boolean,
  ): MatchResult | null {
    // Constant entry luôn match
    if (entry.constant) {
      return { entry, matchedKeys: [], isRecursive: recursivePass };
    }

    // Kiểm tra primary keys
    const matchedPrimary = this.findMatchingKeys(entry.key, text, entry);
    if (matchedPrimary.length === 0) return null;

    // Kiểm tra selective / keysecondary
    if (
      entry.selective &&
      entry.keysecondary &&
      entry.keysecondary.length > 0
    ) {
      const matchedSecondary = this.findMatchingKeys(
        entry.keysecondary,
        text,
        entry,
      );
      const logicPass = this.evaluateSelectiveLogic(
        entry.selectiveLogic ?? SelectiveLogic.AND_ANY,
        entry.keysecondary,
        matchedSecondary,
      );
      if (!logicPass) return null;
    }

    // Probability check
    if (entry.useProbability && entry.probability < 100) {
      const roll = Math.random() * 100;
      if (roll > entry.probability) return null;
    }

    return {
      entry,
      matchedKeys: matchedPrimary,
      isRecursive: recursivePass,
    };
  }

  private findMatchingKeys(
    keys: string[],
    text: string,
    entry: WorldBookEntry,
  ): string[] {
    // "Quên caseSensitive: Luôn truyền flag i khi caseSensitive=false"
    const flags = entry.caseSensitive ? "gm" : "gim";
    const matched: string[] = [];

    for (const key of keys) {
      if (!key || !key.trim()) continue;

      let pattern = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape regex

      if (entry.matchWholeWords) {
        pattern = `\\b${pattern}\\b`;
      }

      try {
        const regex = new RegExp(pattern, flags);
        if (regex.test(text)) {
          matched.push(key);
        }
      } catch (e) {
        console.warn(`[WorldBook] Invalid key regex: ${key}`, e);
      }
    }

    return matched;
  }

  private evaluateSelectiveLogic(
    logic: SelectiveLogic,
    allKeys: string[],
    matchedKeys: string[],
  ): boolean {
    switch (logic) {
      case SelectiveLogic.AND_ANY:
        return matchedKeys.length > 0;
      case SelectiveLogic.AND_ALL:
        return matchedKeys.length === allKeys.length && allKeys.length > 0;
      case SelectiveLogic.NOT_ANY:
        return matchedKeys.length === 0;
      case SelectiveLogic.NOT_ALL:
        return matchedKeys.length !== allKeys.length;
      default:
        return true;
    }
  }
}
