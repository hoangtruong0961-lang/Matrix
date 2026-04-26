import React, { createContext, useContext, useCallback, useState } from "react";
import { WorldBook, WorldBookEntry, ChatMessage } from "../types/world-book";
import { WorldBookMatcher, MatchResult } from "../engine/world-book-matcher";
import { WorldBookAssembler } from "../engine/world-book-assembler";
import { PromptAssembler } from "../engine/prompt-assembler";
import { RecursiveScanner } from "../engine/world-book-recursive-scanner";

interface WorldBookContextType {
  worldBook: WorldBook;
  setWorldBook: React.Dispatch<React.SetStateAction<WorldBook>>;
  addEntry: (entry: WorldBookEntry) => void;
  updateEntry: (uid: number, updates: Partial<WorldBookEntry>) => void;
  removeEntry: (uid: number) => void;
  buildPrompt: (params: BuildPromptParams) => string;
}

interface BuildPromptParams {
  systemPrompt: string;
  charDescription: string;
  exampleMessages: string;
  chatHistory: ChatMessage[];
  charName: string;
  userName: string;
}

const WorldBookContext = createContext<WorldBookContextType | null>(null);

export const WorldBookProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [worldBook, setWorldBook] = useState<WorldBook>({
    name: "New World Book",
    description: "",
    scan_depth: 50,
    token_budget: 2048,
    recursive_scanning: false,
    entries: {},
  });

  const addEntry = useCallback((entry: WorldBookEntry) => {
    setWorldBook((prev) => ({
      ...prev,
      entries: { ...prev.entries, [entry.uid]: entry },
    }));
  }, []);

  const updateEntry = useCallback(
    (uid: number, updates: Partial<WorldBookEntry>) => {
      setWorldBook((prev) => ({
        ...prev,
        entries: {
          ...prev.entries,
          [uid]: { ...prev.entries[uid], ...updates },
        },
      }));
    },
    [],
  );

  const removeEntry = useCallback((uid: number) => {
    setWorldBook((prev) => {
      const newEntries = { ...prev.entries };
      delete newEntries[uid];
      return { ...prev, entries: newEntries };
    });
  }, []);

  const buildPrompt = useCallback(
    (params: BuildPromptParams): string => {
      const context = {
        messages: params.chatHistory,
        currentDepth: 0,
        charName: params.charName,
        userName: params.userName,
      };

      // Phase 1: Initial Scan
      const matcher = new WorldBookMatcher(worldBook, context);
      let matches = matcher.scan(false);

      // Phase 2: Recursive Scan (nếu bật)
      if (worldBook.recursive_scanning) {
        const recursiveScanner = new RecursiveScanner(matcher);
        const recursiveMatches = recursiveScanner.scanRecursive(matches);

        const seen = new Set(matches.map((m) => m.entry.uid));
        for (const m of recursiveMatches) {
          if (!seen.has(m.entry.uid)) matches.push(m);
        }
      }

      // Phase 3: Assemble
      const assembler = new WorldBookAssembler();
      const assembled = assembler.assemble(matches, worldBook.token_budget);

      // Phase 4: Build final prompt
      const promptAssembler = new PromptAssembler();
      return promptAssembler.assemble(
        {
          systemPrompt: params.systemPrompt,
          worldInfoBeforeChar: [],
          worldInfoAfterChar: [],
          worldInfoBeforeExample: [],
          worldInfoAfterExample: [],
          depthEntries: new Map(),
          characterDescription: params.charDescription,
          exampleMessages: params.exampleMessages,
          chatHistory: params.chatHistory
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n"),
        },
        assembled,
      );
    },
    [worldBook],
  );

  return (
    <WorldBookContext.Provider
      value={{
        worldBook,
        setWorldBook,
        addEntry,
        updateEntry,
        removeEntry,
        buildPrompt,
      }}
    >
      {children}
    </WorldBookContext.Provider>
  );
};

export const useWorldBook = () => {
  const ctx = useContext(WorldBookContext);
  if (!ctx)
    throw new Error("useWorldBook must be used within WorldBookProvider");
  return ctx;
};
