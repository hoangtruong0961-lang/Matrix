import { WorldBookEntry } from "../types/world-book";
import { MatchResult } from "./world-book-matcher";

export interface AssembledEntry {
  entry: WorldBookEntry;
  content: string;
  estimatedTokens: number;
}

export class WorldBookAssembler {
  private readonly CHARS_PER_TOKEN = 3.5; // Estimate conservative

  assemble(matches: MatchResult[], tokenBudget: number): AssembledEntry[] {
    // Sắp xếp: order thấp trước, sau đó theo groupWeight
    const sorted = [...matches].sort((a, b) => {
      // Group override
      if (a.entry.group && a.entry.group === b.entry.group) {
        if (a.entry.groupOverride && b.entry.groupOverride) {
          return a.entry.groupWeight - b.entry.groupWeight;
        }
      }
      return a.entry.order - b.entry.order;
    });

    // Deduplicate theo uid (giữ cái đầu tiên sau sort)
    // "Không deduplicate entry: Cùng 1 entry được chèn 2 lần, Dùng Map<uid, MatchResult> khi merge recursive"
    // At this stage, ensure uniqueness.
    const seen = new Set<number>();
    const unique: MatchResult[] = [];

    for (const m of sorted) {
      if (!seen.has(m.entry.uid)) {
        seen.add(m.entry.uid);
        unique.push(m);
      }
    }

    // Áp token budget
    const assembled: AssembledEntry[] = [];
    let remainingTokens = tokenBudget;

    for (const match of unique) {
      const content = this.formatEntryContent(match.entry);
      const estTokens = Math.ceil(content.length / this.CHARS_PER_TOKEN);

      if (estTokens <= remainingTokens) {
        assembled.push({
          entry: match.entry,
          content,
          estimatedTokens: estTokens,
        });
        remainingTokens -= estTokens;
      } else if (remainingTokens > 0) {
        // Có thể cắt content hoặc skip. SillyTavern thường skip entry nếu không đủ budget.
        continue;
      }
    }

    return assembled;
  }

  private formatEntryContent(entry: WorldBookEntry): string {
    // SillyTavern thường thêm comment dạng header nếu addMemo=true
    if (entry.addMemo && entry.comment) {
      return `[${entry.comment}]\n${entry.content}`;
    }
    return entry.content;
  }
}
