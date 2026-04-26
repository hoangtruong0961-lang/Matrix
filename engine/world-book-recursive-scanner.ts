import { MatchResult, WorldBookMatcher } from "./world-book-matcher";

export class RecursiveScanner {
  constructor(private matcher: WorldBookMatcher) {}

  scanRecursive(initialMatches: MatchResult[]): MatchResult[] {
    const worldBook = (this.matcher as any).worldBook;
    if (!worldBook.recursive_scanning) {
      return initialMatches;
    }

    // "Dùng Map<uid, MatchResult> khi merge recursive"
    const allMatches = new Map<number, MatchResult>();
    initialMatches.forEach((m) => allMatches.set(m.entry.uid, m));

    let previousSize = 0;
    let currentMatches = [...initialMatches];

    // "Recursive loop: Infinite scan khi entry A trigger B, B trigger A -> Giới hạn iteration (max 10)"
    let iterationCount = 0;
    const MAX_ITERATIONS = 10;

    // Quét lặp cho đến khi không còn entry mới hoặc chạm max iterations
    while (
      currentMatches.length > previousSize &&
      iterationCount < MAX_ITERATIONS
    ) {
      previousSize = currentMatches.length;
      iterationCount++;

      // Build text từ content của entry đã match (trừ preventRecursion)
      const scanText = currentMatches
        .filter((m) => !m.entry.preventRecursion)
        .map((m) => m.entry.content)
        .join("\n");

      const newMatches = this.scanForRecursive(scanText);

      for (const m of newMatches) {
        if (!allMatches.has(m.entry.uid)) {
          allMatches.set(m.entry.uid, m);
        }
      }

      currentMatches = Array.from(allMatches.values());
    }

    return Array.from(allMatches.values());
  }

  private scanForRecursive(text: string): MatchResult[] {
    const results: MatchResult[] = [];
    const worldBook = (this.matcher as any).worldBook;

    for (const entry of Object.values(worldBook.entries) as any[]) {
      if (entry.disable || entry.excludeRecursion) continue;

      // We pass true for recursivePass
      const match = this.matcher.matchEntry(entry, text, true);
      if (match) results.push(match);
    }

    return results;
  }
}
