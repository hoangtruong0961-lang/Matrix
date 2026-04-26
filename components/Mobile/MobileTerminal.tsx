import React, { useState, useEffect, useRef } from "react";
import {
  GameLog,
  Player,
  GameGenre,
  getGenreMeta,
  AppSettings,
} from "../../types";
import {
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { dbService } from "../../services/dbService";
import { regexService } from "../../services/regexService";
import { IntroForm } from "../IntroForm";

interface MobileTerminalProps {
  logs: GameLog[];
  onCommand: (cmd: string, timeCost?: number) => void;
  onOpenAiHint?: () => void;
  onRetry?: () => void;
  onRegenerateImage?: (logIndex: number) => Promise<void>;
  onGenerateSuggestions?: () => Promise<void>;
  onUpdateLog?: (index: number, newContent: string) => void;
  onToggleDiagnostics?: () => void;
  onStopAI?: () => void;
  lastAction?: { command: string; timeCost?: number } | null;
  isLoading: boolean;
  placeholder?: string;
  player: Player;
  genre?: GameGenre;
  settings: AppSettings;
}

const NarratorImage: React.FC<{ imageUrl: string; alt: string }> = ({
  imageUrl,
  alt,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;

    if (imageUrl.startsWith("http") || imageUrl.startsWith("data:")) {
      setResolvedUrl(imageUrl);
      return;
    }

    // It's an image ID, resolve it
    setIsResolving(true);
    dbService
      .loadImage(imageUrl)
      .then((data) => {
        if (data) setResolvedUrl(data);
        setIsResolving(false);
      })
      .catch((err) => {
        console.error("Failed to resolve image ID:", err);
        setIsResolving(false);
      });
  }, [imageUrl]);

  if (isResolving) {
    return (
      <div className="my-2 w-full aspect-video bg-white/5 animate-pulse rounded-xl flex items-center justify-center border border-white/5">
        <RefreshCw className="w-5 h-5 text-emerald-500/50 animate-spin" />
      </div>
    );
  }

  if (!resolvedUrl) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-white/5 shadow-2xl animate-in fade-in zoom-in duration-700 relative">
      <img
        src={resolvedUrl}
        alt={alt}
        className="w-full h-auto object-cover max-h-[300px]"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export const MobileTerminal: React.FC<MobileTerminalProps> = ({
  logs,
  onCommand,
  onOpenAiHint,
  onRetry,
  onRegenerateImage,
  onGenerateSuggestions,
  onToggleDiagnostics,
  isLoading,
  placeholder = "Gõ hành động...",
  player,
  genre,
  settings,
  lastAction,
  onUpdateLog,
  onStopAI,
}) => {
  const [input, setInput] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastLogRef = useRef<HTMLDivElement>(null);
  const currentTurnRef = useRef<HTMLDivElement>(null);

  const { aiTheme } = getGenreMeta(genre);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleStartEdit = (index: number, content: string) => {
    setEditingIndex(index);
    setEditValue(content);
  };

  const handleSaveEdit = (index: number) => {
    if (onUpdateLog) {
      onUpdateLog(index, editValue);
    }
    setEditingIndex(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const turnsPerPage = 20;

  // Group logs into turns. A turn starts with a 'player' log.
  // Logs before the first 'player' log are grouped as Turn 0.
  const groupedTurns = (() => {
    const result: GameLog[][] = [];
    let currentTurn: GameLog[] = [];

    logs.forEach((log) => {
      if (log.type === "player") {
        if (currentTurn.length > 0) {
          result.push(currentTurn);
        }
        currentTurn = [log];
      } else {
        currentTurn.push(log);
      }
    });

    if (currentTurn.length > 0) {
      result.push(currentTurn);
    }

    return result;
  })();

  const totalPages = Math.max(1, Math.ceil(groupedTurns.length / turnsPerPage));

  const [isAtBottom, setIsAtBottom] = useState(true);

  // Auto-switch to last page when new logs arrive
  useEffect(() => {
    if (totalPages > currentPage) {
      setCurrentPage(totalPages);
    }
  }, [groupedTurns.length, totalPages]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAtBottom(atBottom);
      setShowScrollBottom(!atBottom);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const scrollToNearestAction = (direction: "up" | "down") => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const actions = Array.from(
      container.querySelectorAll(".player-action-marker"),
    );

    if (actions.length === 0) {
      if (direction === "up") {
        container.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const currentScrollTop = container.scrollTop;

    // Get positions of all actions relative to the container's top
    const positions = actions.map((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top - containerRect.top + currentScrollTop;
    });

    if (direction === "up") {
      // Find the last marker that is at least 5px above the current scroll position
      const targetIndex = [...positions]
        .reverse()
        .findIndex((top) => top < currentScrollTop - 5);
      if (targetIndex !== -1) {
        // Since we reversed, the actual index is:
        const actualIndex = positions.length - 1 - targetIndex;
        container.scrollTo({ top: positions[actualIndex], behavior: "smooth" });
      } else {
        container.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      // Find the first marker that is at least 5px below the current scroll position
      const targetIndex = positions.findIndex(
        (top) => top > currentScrollTop + 5,
      );
      if (targetIndex !== -1) {
        container.scrollTo({ top: positions[targetIndex], behavior: "smooth" });
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      setElapsedTime(0);
      interval = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = (
    e?: React.FormEvent,
    customCmd?: string,
    timeCost?: number,
  ) => {
    if (e) e.preventDefault();
    const finalCmd = customCmd || input;
    if (finalCmd.trim() && !isLoading) {
      onCommand(finalCmd.trim(), timeCost);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const formatActionTime = (mins: any) => {
    const m = parseInt(mins) || 15;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const rem = m % 60;
      return rem > 0 ? `${h}h${rem}p` : `${h}h`;
    }
    return `${m}p`;
  };

  const getLogStyle = () => ({
    fontSize: settings.fontSize ? `${settings.fontSize}px` : "16px",
    fontFamily: settings.fontFamily || "inherit",
  });

  const logStyle = getLogStyle();

  const renderContent = (content: any, type?: string, depth?: number) => {
    if (!content) return null;
    let safeContent =
      typeof content === "string"
        ? content
        : content.text || JSON.stringify(content);

    // Xử lý form Mở đầu chuyên biệt bằng React
    if (/\[Mở đầu\]/i.test(safeContent)) {
      return <IntroForm onSubmit={(data) => {
        const cmd = `Tên: ${data.name || 'Vô Danh'}\nTuổi: ${data.age || '18'}\nNgoại hình: ${data.appearance || 'Bình thường'}\nPháp hệ: ${data.magicSystem}`;
        onCommand(cmd);
      }} />;
    }

    // Áp dụng Regex Rules cho UI (isMarkdown: true)
    const beforeRegexText = safeContent;
    safeContent = regexService.applyScripts(safeContent, {
      player: player,
      charName: player?.relationships?.[0]?.name,
      isMarkdown: true,
      depth,
    });
    if (beforeRegexText.includes('<') || beforeRegexText.includes('[')) {
       console.log("MobileTerminal renderContent DEBUG", { before: beforeRegexText, after: safeContent });
    }

    // Basic Markdown support fallback for bold and italic
    safeContent = safeContent.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    safeContent = safeContent.replace(/\*(.*?)\*/g, "<em>$1</em>");
    safeContent = safeContent.replace(/__(.*?)__/g, "<strong>$1</strong>");
    safeContent = safeContent.replace(/_([^_]+)_/g, "<em>$1</em>");

    // Protect our custom game system XML tags from being treated as actual HTML elements and becoming invisible
    // (We only escape known custom tags that shouldn't be parsed natively by the browser)
    safeContent = safeContent.replace(/<\/?(user_now_status|NPC_status|comprehensive_now_status|choice|Battle_Panel_Guide\d*|AI_guide|thinking)[^>]*>/gi, (match) => {
        return '&lt;' + match.slice(1, -1) + '&gt;';
    });

    // If the entire content contains standard HTML structure, render it directly to avoid tag breaking.
    const hasGlobalHtml =
      /<(div|table|script|style|ul|ol|fieldset|center|blockquote|pre|details|article|section)[^>]*>/i.test(
        safeContent,
      );

    if (hasGlobalHtml) {
      return (
        <div
          className={`whitespace-pre-wrap leading-relaxed html-content-container`}
          style={logStyle}
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
      );
    }

    // Split into lines
    const lines = safeContent.split("\n");

    // If beautifyContent is disabled, render as plain text lines
    if (!settings.beautifyContent) {
      return (
        <div className="space-y-1">
          {lines.map((line, lIdx) => {
            let processedLine = line;
            const trimmed = line.trim();

            // Match [ID - Name]: "Content" or [ID - Name]: Content
            // This regex looks for [anything]: followed by the rest of the line
            const dialogueMatch = trimmed.match(
              /^\[([^\]]+)\](?:\s*(?:nói|bảo|hỏi|đáp|thì thầm|hét lên))?:\s*(.*)$/i,
            );

            if (dialogueMatch) {
              processedLine = dialogueMatch[2].trim();
            }

            return (
              <div
                key={lIdx}
                className={`whitespace-pre-wrap leading-relaxed`}
                style={logStyle}
                dangerouslySetInnerHTML={{ __html: processedLine }}
              />
            );
          })}
        </div>
      );
    }

    // Grouping logic: group consecutive lines that start with the same [NPC NAME]
    // or are part of a special block (Message, Email, Letter)
    const groups: {
      npc?: string;
      lines: string[];
      isGM?: boolean;
      specialType?:
        | "message"
        | "email"
        | "letter"
        | "system"
        | "dialogue"
        | "thought"
        | "sound";
      dialogueName?: string;
      dialogueText?: string;
      thoughtText?: string;
      soundText?: string;
    }[] = [];

    let currentSpecialBlock: {
      type: "message" | "email" | "letter" | "system";
      lines: string[];
    } | null = null;

    lines.forEach((line) => {
      const pushOrMergeDefault = (lineStr: string) => {
        const lastGroup = groups[groups.length - 1];
        if (
          lastGroup &&
          Object.keys(lastGroup).length === 1 &&
          lastGroup.lines
        ) {
          lastGroup.lines.push(lineStr);
        } else {
          groups.push({ lines: [lineStr] });
        }
      };

      let trimmed = line.trim();
      if (!trimmed) {
        if (currentSpecialBlock) {
          groups.push({
            specialType: currentSpecialBlock.type,
            lines: currentSpecialBlock.lines,
          });
          currentSpecialBlock = null;
        }
        pushOrMergeDefault(line);
        return;
      }

      // Detect special block headers
      const messageMatch = trimmed.match(
        /^\[(?:TIN NHẮN|MESSAGE)(?:\s+TỪ)?:\s*([^\]]+)\]/i,
      );
      const emailMatch = trimmed.match(/^\[EMAIL(?:\s+TỪ)?:\s*([^\]]+)\]/i);
      const letterMatch = trimmed.match(
        /^\[(?:THƯ|LETTER)(?:\s+TỪ)?:\s*([^\]]+)\]/i,
      );
      const systemMatch = trimmed.match(
        /^\[(?:THÔNG BÁO|HỆ THỐNG|SYSTEM|GM|GIẢI THÍCH|LƯU Ý|GIẢI TRÌNH THAY ĐỔI|KHỞI TẠO THẾ GIỚI):?\s*([^\]]*)\]/i,
      );

      if (messageMatch || emailMatch || letterMatch || systemMatch) {
        // If we were in a special block, close it
        if (currentSpecialBlock) {
          groups.push({
            specialType: currentSpecialBlock.type,
            lines: currentSpecialBlock.lines,
          });
          currentSpecialBlock = null;
        }

        const type = messageMatch
          ? "message"
          : emailMatch
            ? "email"
            : letterMatch
              ? "letter"
              : "system";
        currentSpecialBlock = { type, lines: [line] };
        return;
      }

      // Dialogue detection: [Name]: "text" or Name: "text"
      const dialogueMatch =
        trimmed.match(
          /^\[([^\]]+)\](?:\s*(?:nói|bảo|hỏi|đáp|thì thầm|hét lên))?:\s*"(.*)"$/i,
        ) ||
        trimmed.match(/^([^:\[\]]+):\s*"(.*)"$/i) ||
        trimmed.match(/^\[([^\]]+)\]\s*:\s*(.*)$/i); // Fallback for [Name]: text without quotes

      const soundMatch =
        trimmed.match(/^\[(?:ÂM THANH|SOUND|TIẾNG ĐỘNG)\]:\s*(.*)$/i) ||
        (trimmed.includes("...") &&
          !trimmed.includes('"') &&
          !trimmed.startsWith("(") &&
          !trimmed.startsWith("[") &&
          trimmed.length < 100);

      const thoughtMatch =
        trimmed.match(/^\((.*)\)$/) ||
        trimmed.match(/^\*(.*)\*$/) ||
        trimmed.match(/^\[([^\]]+)\]\s*(?:thầm nghĩ|nghĩ):\s*(.*)$/i) ||
        trimmed.match(/^(?:Suy nghĩ|Nghĩ):\s*(.*)$/i);

      if (dialogueMatch || soundMatch || thoughtMatch) {
        if (currentSpecialBlock) {
          groups.push({
            specialType: currentSpecialBlock.type,
            lines: currentSpecialBlock.lines,
          });
          currentSpecialBlock = null;
        }

        if (dialogueMatch) {
          let dName = dialogueMatch[1].trim();
          const idNameMatch = dName.match(
            /^(?:mc_player|npc_\d+)\s*-\s*(.*)$/i,
          );
          if (idNameMatch) dName = idNameMatch[1].trim();

          const systemKeywords = [
            "THÔNG BÁO",
            "HỆ THỐNG",
            "SYSTEM",
            "GM",
            "GIẢI THÍCH",
            "LƯU Ý",
            "GIẢI TRÌNH THAY ĐỔI",
            "KHỞI TẠO THẾ GIỚI",
          ];
          if (systemKeywords.some((k) => dName.toUpperCase().includes(k))) {
            currentSpecialBlock = { type: "system", lines: [line] };
            return;
          }

          const dText = dialogueMatch[2].trim().replace(/^"(.*)"$/, "$1");
          groups.push({
            specialType: "dialogue",
            dialogueName: dName,
            dialogueText: dText,
            lines: [line],
          });
          return;
        }

        if (soundMatch) {
          const text =
            typeof soundMatch === "object" ? soundMatch[1].trim() : trimmed;
          groups.push({ specialType: "sound", soundText: text, lines: [line] });
          return;
        }

        if (thoughtMatch) {
          const text =
            thoughtMatch.length > 2
              ? thoughtMatch[2].trim()
              : thoughtMatch[1].trim();
          groups.push({
            specialType: "thought",
            thoughtText: text,
            lines: [line],
          });
          return;
        }
      }

      // If we are in a special block and no new block detected, keep adding lines
      if (currentSpecialBlock) {
        currentSpecialBlock.lines.push(line);
        return;
      }

      if (settings.beautifyContent) {
        // Other beautification logic could go here if needed
      }

      // Handle GM: prefix
      const isGM = trimmed.startsWith("GM:");
      if (isGM) {
        trimmed = trimmed.replace(/^GM:\s*/, "").trim();
      }

      // Match [NPC NAME] at the start of the line
      const match = trimmed.match(/^\[([^\]]+)\]/);
      if (match) {
        const npcName = match[1].trim();
        // Only group if it's likely a status update (multiple brackets in the line)
        const bracketCount = (trimmed.match(/\[/g) || []).length;

        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.npc === npcName && bracketCount > 1) {
          lastGroup.lines.push(trimmed);
        } else if (bracketCount > 1) {
          groups.push({ npc: npcName, lines: [trimmed], isGM });
        } else {
          pushOrMergeDefault(line);
        }
      } else {
        pushOrMergeDefault(line);
      }
    });

    // Close any remaining special block
    if (currentSpecialBlock) {
      groups.push({
        specialType: currentSpecialBlock.type,
        lines: currentSpecialBlock.lines,
      });
    }

    return (
      <div className="space-y-10">
        {groups.map((group, gIdx) => {
          if (group.specialType === "dialogue") {
            const dName = group.dialogueName || "";
            const pName = player.name || "";
            const isMC =
              dName.toLowerCase() === pName.toLowerCase() ||
              dName.toLowerCase() === "bạn" ||
              dName.toLowerCase() === "mc" ||
              dName.toLowerCase() === "tôi";
            const isSystem =
              dName.toLowerCase() === "hệ thống" ||
              dName.toLowerCase() === "system";

            // Define colors based on role
            let nameColor = "text-cyan-400";
            let dotColor = "bg-cyan-500 shadow-[0_0_6px_#06b6d4]";
            let bubbleStyles =
              "bg-cyan-500/20 border border-cyan-500/50 text-cyan-50 shadow-lg rounded-tl-none";

            if (isMC) {
              nameColor = "text-amber-400";
              dotColor = "bg-amber-500 shadow-[0_0_6px_#f59e0b]";
              bubbleStyles =
                "bg-amber-500/20 border border-amber-500/50 text-amber-50 shadow-lg rounded-tr-none";
            } else if (isSystem) {
              nameColor = "text-emerald-400";
              dotColor = "bg-emerald-500 shadow-[0_0_6px_#10b981]";
              bubbleStyles =
                "bg-emerald-500/20 border border-emerald-500/50 text-emerald-50 shadow-lg rounded-tl-none";
            }

            return (
              <div
                key={gIdx}
                className={`flex ${isMC ? "justify-end" : "justify-start"} my-3 animate-in fade-in slide-in-from-${isMC ? "right" : "left"}-2 duration-300`}
              >
                <div className={`max-w-[88%] space-y-1.5`}>
                  <div
                    className={`flex items-center gap-1.5 ${isMC ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`flex flex-col ${isMC ? "items-end" : "items-start"}`}
                    >
                      <span
                        className={`${nameColor} font-bold`}
                        style={logStyle}
                      >
                        {isMC ? "Bạn" : group.dialogueName}
                      </span>
                    </div>
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                    ></div>
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl transition-all duration-300 ${bubbleStyles}`}
                  >
                    <p
                      className={`leading-relaxed`}
                      style={logStyle}
                      dangerouslySetInnerHTML={{
                        __html: isMC
                          ? group.dialogueText
                          : `"${group.dialogueText}"`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          }

          if (group.specialType === "thought") {
            return (
              <div
                key={gIdx}
                className="my-2 px-3 py-2 bg-purple-500/5 border-l-2 border-purple-500/30 italic text-purple-200/80 animate-in fade-in duration-500 rounded-r-lg"
              >
                <p
                  className={`leading-relaxed`}
                  style={logStyle}
                  dangerouslySetInnerHTML={{ __html: group.thoughtText }}
                />
              </div>
            );
          }

          if (group.specialType === "sound") {
            return (
              <div
                key={gIdx}
                className="my-2 px-3 py-2 bg-amber-500/5 border-l-2 border-amber-500/30 italic text-amber-200/80 animate-in fade-in duration-500 rounded-r-lg"
              >
                <p
                  className={`leading-relaxed tracking-widest`}
                  style={logStyle}
                  dangerouslySetInnerHTML={{ __html: group.soundText }}
                />
              </div>
            );
          }

          if (group.specialType === "system") {
            const header = group.lines[0];
            const body = group.lines.slice(1);
            const headerText = header.replace(/[\[\]]/g, "").trim();
            const content =
              body.join("\n").trim() ||
              headerText.split(":").slice(1).join(":").trim();
            const fullContent =
              body.length > 0
                ? `${headerText}\n${body.join("\n")}`
                : headerText;

            const isSystemDialogue =
              fullContent.toLowerCase().startsWith("hệ thống:") ||
              fullContent.toLowerCase().startsWith("system:");

            const themeClasses = isSystemDialogue
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-lg"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-lg";

            let renderedContent = (
              <span
                className="tracking-tight"
                dangerouslySetInnerHTML={{ __html: fullContent }}
              />
            );

            if (isSystemDialogue) {
              const parts = fullContent.split(":");
              const prefix = parts[0];
              const rest = parts.slice(1).join(":");
              renderedContent = (
                <span className="tracking-tight">
                  <span className="font-bold text-emerald-400">{prefix}:</span>
                  <span dangerouslySetInnerHTML={{ __html: rest }} />
                </span>
              );
            }

            return (
              <div
                key={gIdx}
                className={`my-3 animate-in fade-in slide-in-from-bottom-2 duration-500`}
              >
                <div
                  className={`p-3 rounded-xl border ${themeClasses}`}
                  style={logStyle}
                >
                  {renderedContent}
                </div>
              </div>
            );
          }

          if (group.specialType) {
            const header = group.lines[0];
            const body = group.lines.slice(1);
            const headerText = header.replace(/[\[\]]/g, "").trim();

            let bgColor = "bg-neutral-900/50";
            let borderColor = "border-neutral-700";
            let textColor = "text-neutral-300";
            let icon = "✉️";
            let label = "THÔNG TIN";

            if (group.specialType === "message") {
              bgColor = "bg-indigo-500/10";
              borderColor = "border-indigo-500/30";
              textColor = "text-indigo-200";
              icon = "💬";
              label = "TIN NHẮN";
            } else if (group.specialType === "email") {
              bgColor = "bg-cyan-500/10";
              borderColor = "border-cyan-500/30";
              textColor = "text-cyan-200";
              icon = "📧";
              label = "EMAIL";
            } else if (group.specialType === "letter") {
              bgColor = "bg-amber-900/10";
              borderColor = "border-amber-700/30";
              textColor = "text-amber-100/90";
              icon = "📜";
              label = "THƯ TÍN";
            }

            return (
              <div
                key={gIdx}
                className={`my-2 ${bgColor} border ${borderColor} rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-lg`}
              >
                <div
                  className={`px-2 py-1 border-b ${borderColor} flex items-center justify-between bg-black/40`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">{icon}</span>
                    <span className={`font-bold ${textColor}`} style={logStyle}>
                      {label}
                    </span>
                  </div>
                  <div className={`opacity-60 ${textColor}`} style={logStyle}>
                    {headerText.split(":").pop()?.trim()}
                  </div>
                </div>
                <div className="p-3 space-y-4">
                  {body.map((line, lIdx) => (
                    <div
                      key={lIdx}
                      className={`whitespace-pre-wrap leading-relaxed ${group.specialType === "letter" ? "italic" : ""}`}
                      style={logStyle}
                      dangerouslySetInnerHTML={{ __html: line }}
                    />
                  ))}
                </div>
              </div>
            );
          }

          // Grouped NPC notifications / Default fallback
          const joinedLines = group.lines.join("\n");
          const hasHtml =
            /<(div|table|script|style|a|img|span|b|i|strong|em|details|summary)([^>]*)>/i.test(
              joinedLines,
            );

          if (hasHtml) {
            return (
              <div
                key={gIdx}
                className="my-1 p-2 relative overflow-hidden text-neutral-300 leading-relaxed"
              >
                {group.npc && (
                  <div className="font-bold text-emerald-400 mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    [{group.npc}]
                  </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: joinedLines }} />
              </div>
            );
          }

          if (!group.npc) {
            // Normal text rendering
            return (
              <div
                key={gIdx}
                className={`block ${type === "system" ? "bg-cyan-500/5 border-y border-cyan-500/10 p-1 relative" : ""}`}
              >
                <div className={type === "system" ? "pl-1" : ""}>
                  {group.lines.map((line, lIdx) => {
                    const parts = line.split(/(\[[^\]]+\])/g);
                    return (
                      <React.Fragment key={lIdx}>
                        {parts.map((part, pIdx) => {
                          if (!part) return null;
                          const trimmedPart = part.trim();

                          // Handle GM: prefix visually
                          if (pIdx === 0 && trimmedPart.startsWith("GM:")) {
                            return (
                              <span
                                key={pIdx}
                                className="inline-flex items-center gap-1 px-1 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded-sm text-cyan-400 mr-1.5"
                                style={logStyle}
                              >
                                GM
                              </span>
                            );
                          }

                          const isSystemBlock =
                            trimmedPart.startsWith("[") &&
                            trimmedPart.endsWith("]");

                          if (isSystemBlock) {
                            return (
                              <span
                                key={pIdx}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-emerald-300 mr-1 my-0.5"
                                style={logStyle}
                              >
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: part.replace(/[\[\]]/g, "").trim(),
                                  }}
                                />
                              </span>
                            );
                          }
                          return (
                            <span
                              key={pIdx}
                              className={`whitespace-pre-wrap leading-relaxed`}
                              style={logStyle}
                              dangerouslySetInnerHTML={{ __html: part }}
                            />
                          );
                        })}
                        {lIdx < group.lines.length - 1 && (
                          <div className="h-6" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div
              key={gIdx}
              className="my-1 bg-emerald-500/5 border border-emerald-500/20 rounded-sm p-2 space-y-1 animate-in fade-in slide-in-from-left-2 duration-300 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 w-0.5 h-full bg-emerald-500/30"></div>
              {group.isGM && (
                <div className="flex items-center gap-1.5 mb-1.5 border-b border-emerald-500/10 pb-0.5">
                  <span
                    className="px-1 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded-sm text-cyan-400"
                    style={logStyle}
                  >
                    GM
                  </span>
                  <span className="text-emerald-500/60" style={logStyle}>
                    Cập nhật thực thể
                  </span>
                </div>
              )}
              {group.lines.map((line, lIdx) => {
                const parts = line.split(/(\[[^\]]+\])/g);
                return (
                  <div key={lIdx} className="flex flex-wrap items-center gap-1">
                    {parts.map((part, pIdx) => {
                      if (!part || !part.trim()) return null;
                      const trimmedPart = part.trim();
                      const isSystemBlock =
                        trimmedPart.startsWith("[") &&
                        trimmedPart.endsWith("]");

                      if (isSystemBlock) {
                        const blockText = part.replace(/[\[\]]/g, "").trim();
                        const isNpcName = blockText === group.npc;

                        // If it's the NPC name and NOT the first line of the group, skip it to avoid redundancy
                        if (isNpcName && lIdx > 0) return null;

                        return (
                          <span
                            key={pIdx}
                            className={`inline-flex items-center gap-1 px-1 py-0.5 rounded-sm ${isNpcName ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200" : "bg-white/5 border border-white/10 text-emerald-400/80"}`}
                            style={logStyle}
                          >
                            <span
                              dangerouslySetInnerHTML={{ __html: blockText }}
                            />
                          </span>
                        );
                      }
                      return (
                        <span
                          key={pIdx}
                          className="text-neutral-500 italic"
                          style={logStyle}
                          dangerouslySetInnerHTML={{ __html: part }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  let playerCommandCounter = 0;

  const scrollToTop = () => {
    scrollToNearestAction("up");
  };

  const getAiProcessingStep = (seconds: number) => {
    if (seconds < 5) return "Đang liên kết Ma Trận...";
    if (seconds < 10) return "Phân tích bối cảnh...";
    if (seconds < 15) return "Truy vấn vạn giới...";
    if (seconds < 20) return "Kiến tạo phản hồi...";
    return "Đồng bộ thực tại...";
  };

  const getAiProcessingLabel = (seconds: number) => {
    if (seconds < 5) return "KẾT NỐI";
    if (seconds < 10) return "PHÂN TÍCH";
    if (seconds < 15) return "TRUY VẤN";
    if (seconds < 20) return "KHỞI TẠO";
    return "HOÀN TẤT";
  };

  const getFontSizeClass = () => {
    return "text-base";
  };

  const fontSizeClass = getFontSizeClass();

  const displayTurns = groupedTurns.slice(
    (currentPage - 1) * turnsPerPage,
    currentPage * turnsPerPage,
  );

  // Find the index of the last player log to scroll to it
  let lastPlayerIndex = -1;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].type === "player") {
      lastPlayerIndex = i;
      break;
    }
  }

  // Find the index of the last narrator log to show suggested actions
  let lastNarratorIndex = -1;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].type === "narrator") {
      lastNarratorIndex = i;
      break;
    }
  }

  return (
    <div className="MobileTerminal flex flex-col h-full bg-[var(--bg)] overflow-hidden relative selection:bg-emerald-500/30">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto p-2 space-y-4 custom-scrollbar scroll-smooth pb-20"
      >
        {displayTurns.map((turn, tIdx) => {
          const actualTurnIndex = (currentPage - 1) * turnsPerPage + tIdx;

          return (
            <div key={actualTurnIndex} className="turn-group space-y-3">
              <div className="flex items-center gap-2 mb-2 mt-4 player-action-marker">
                <div className="h-px flex-grow bg-emerald-500/10"></div>
                <div className="px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                  <span className="text-[7px] mono font-black text-emerald-500/60 uppercase tracking-[0.2em] whitespace-nowrap">
                    HÀNH_ĐỘNG_{actualTurnIndex.toString().padStart(3, "0")}
                  </span>
                </div>
                <div className="h-px flex-grow bg-emerald-500/10"></div>
              </div>
              {turn.map((log, i) => {
                const actualIndex = logs.findIndex(
                  (l) =>
                    l.timestamp === log.timestamp && l.content === log.content,
                );
                const isLast = actualIndex === logs.length - 1;
                const isLastPlayer = actualIndex === lastPlayerIndex;

                if (log.type === "system") {
                  return (
                    <div
                      key={actualIndex}
                      ref={isLast ? lastLogRef : null}
                      className="my-1 px-2 py-1 bg-cyan-500/5 border-l border-cyan-500/30 rounded-r-sm"
                    >
                      <div
                        className="text-cyan-400/80 uppercase tracking-tight italic"
                        style={logStyle}
                      >
                        {renderContent(
                          log.content,
                          log.type,
                          logs.length - 1 - actualIndex,
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={actualIndex}
                    ref={
                      isLast ? lastLogRef : isLastPlayer ? currentTurnRef : null
                    }
                    className={`animate-in fade-in slide-in-from-bottom-1 duration-300 ${log.type === "player" ? "text-emerald-400" : log.type === "error" ? "text-rose-400" : "text-neutral-300"}`}
                  >
                    <div className="flex gap-2">
                      <span
                        className={`text-[10px] mt-1 font-black mono ${log.type === "player" ? "text-emerald-500" : "opacity-10"}`}
                      >
                        {log.type === "player" ? "❯" : "•"}
                      </span>
                      <div className="flex-grow flex flex-col min-w-0">
                        <div
                          className={`leading-relaxed relative group/log`}
                          style={logStyle}
                        >
                          {editingIndex === actualIndex ? (
                            <div className="space-y-2 w-full my-2">
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full p-3 bg-black/40 border border-emerald-500/30 rounded-xl text-white font-sans text-[16px] leading-relaxed focus:outline-none focus:border-emerald-500/60 custom-scrollbar min-h-[300px]"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveEdit(actualIndex)}
                                  className="flex-1 py-3 bg-emerald-500 text-black text-[11px] font-black uppercase rounded-xl active:bg-emerald-400 transition-all shadow-lg active:scale-95"
                                >
                                  Lưu thay đổi
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase rounded-xl active:bg-white/10 transition-all active:scale-95"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {renderContent(
                                log.content,
                                log.type,
                                logs.length - 1 - actualIndex,
                              )}
                              {(log.type === "player" ||
                                log.type === "narrator") &&
                                !isLoading && (
                                  <button
                                    onClick={() =>
                                      handleStartEdit(actualIndex, log.content)
                                    }
                                    className="absolute -top-1 -right-1 p-2 bg-neutral-900 border border-white/10 rounded-lg text-neutral-500 active:text-emerald-500 opacity-40 active:opacity-100 transition-all shadow-xl z-10"
                                    title="Chỉnh sửa nội dung (Edit Draw)"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </button>
                                )}
                            </>
                          )}
                        </div>

                        {log.type === "narrator" && onRegenerateImage && (
                          <div className="mt-3 mb-2 flex flex-wrap gap-2">
                            <button
                              onClick={() => onRegenerateImage(actualIndex)}
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-lg active:bg-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                            >
                              <RefreshCw
                                className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
                              />
                              <span className="font-bold" style={logStyle}>
                                {log.imageUrl ? "Tạo lại ảnh" : "Tạo ảnh"}
                              </span>
                            </button>

                            {onGenerateSuggestions && (
                              <button
                                onClick={onGenerateSuggestions}
                                disabled={isLoading}
                                className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg active:bg-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                              >
                                <Sparkles
                                  className={`w-3 h-3 ${isLoading ? "animate-pulse" : ""}`}
                                />
                                <span className="font-bold" style={logStyle}>
                                  Tạo thêm Gợi ý hành động mới
                                </span>
                              </button>
                            )}
                          </div>
                        )}

                        {log.imageUrl && (
                          <div className="space-y-1.5 my-2">
                            <NarratorImage
                              imageUrl={log.imageUrl}
                              alt="Scene illustration"
                            />
                            {log.imageMetadata && (
                              <div className="flex flex-wrap items-center gap-2 px-2 py-1 bg-black/40 border border-white/5 rounded-lg">
                                <span
                                  className="text-emerald-500/60"
                                  style={logStyle}
                                >
                                  [ SYNC_OK ]
                                </span>
                                <span
                                  className="text-neutral-600"
                                  style={logStyle}
                                >
                                  {log.imageMetadata.duration}s
                                </span>
                                <span
                                  className="text-neutral-600"
                                  style={logStyle}
                                >
                                  {log.imageMetadata.model}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {log.type === "narrator" &&
                          log.suggestedActions &&
                          log.suggestedActions.length > 0 &&
                          actualIndex === lastNarratorIndex && (
                            <div className="flex flex-col gap-2 mt-4">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span
                                  className="text-emerald-500/40 font-bold"
                                  style={logStyle}
                                >
                                  Gợi ý hành động
                                </span>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {log.suggestedActions.map(
                                  (sObj: any, idx: number) => {
                                    const actionText =
                                      typeof sObj === "string"
                                        ? sObj
                                        : sObj.action || "Tiếp tục";
                                    const actionTime =
                                      typeof sObj === "string"
                                        ? 15
                                        : sObj.time || 15;
                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-stretch gap-1 animate-in fade-in slide-in-from-left-2 duration-300"
                                        style={{
                                          animationDelay: `${idx * 100}ms`,
                                        }}
                                      >
                                        <button
                                          onClick={() =>
                                            !isLoading &&
                                            handleSubmit(
                                              undefined,
                                              actionText,
                                              actionTime,
                                            )
                                          }
                                          disabled={isLoading}
                                          className={`flex-grow p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 active:scale-[0.98] active:bg-emerald-500/10 transition-all flex items-center justify-between gap-3 shadow-lg ${isLoading ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}`}
                                          style={logStyle}
                                        >
                                          <div className="flex items-center gap-2 text-left">
                                            <span className="text-emerald-500/30 shrink-0">
                                              ❯
                                            </span>
                                            <span className="leading-tight">
                                              {actionText}
                                            </span>
                                          </div>
                                          <span className="px-1.5 py-0.5 bg-black/60 rounded-lg text-[8px] text-emerald-500/40 border border-white/5 shrink-0">
                                            {formatActionTime(actionTime)}
                                          </span>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopy(actionText, idx);
                                          }}
                                          className="px-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl active:scale-90 transition-all shadow-lg flex items-center justify-center"
                                        >
                                          {copiedIndex === idx ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                                          ) : (
                                            <Copy className="w-3.5 h-3.5 text-emerald-500/30" />
                                          )}
                                        </button>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-32 right-4 w-10 h-10 rounded-full bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center z-50 animate-in fade-in zoom-in duration-300 active:scale-90"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg)] border-t border-white/10 shrink-0 relative pb-safe"
      >
        {isLoading && (
          <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-10">
              <div
                className={`absolute top-0 left-0 w-full h-0.5 ${aiTheme.scanline} animate-[scan_2s_linear_infinite]`}
              ></div>
            </div>

            <div className="w-full max-w-xs space-y-6 relative z-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div
                    className={`w-16 h-16 border-2 ${aiTheme.primary.replace("text-", "border-")}/20 rounded-full animate-spin`}
                  ></div>
                  <div
                    className={`absolute inset-0 border-t-2 ${aiTheme.primary.replace("text-", "border-")} rounded-full animate-[spin_1s_linear_infinite]`}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles
                      className={`w-6 h-6 ${aiTheme.iconColor} animate-pulse`}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3
                    className={`${aiTheme.primary} mono text-base font-black tracking-[0.3em] uppercase italic`}
                  >
                    {aiTheme.label}
                  </h3>
                  <p
                    className={`${aiTheme.secondary} mono text-[9px] font-bold uppercase tracking-widest opacity-60`}
                  >
                    {getAiProcessingStep(elapsedTime)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <span
                    className={`text-[8px] mono font-black ${aiTheme.secondary} uppercase tracking-tighter`}
                  >
                    Neural_Sync:{" "}
                    {Math.min(100, Math.floor((elapsedTime / 25) * 100))}%
                  </span>
                  <span
                    className={`${aiTheme.primary} mono text-xl font-black tabular-nums`}
                  >
                    {formatTime(elapsedTime)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <div
                    className={`h-full bg-gradient-to-r ${aiTheme.accent} transition-all duration-1000 ease-out ${aiTheme.glow}`}
                    style={{
                      width: `${Math.min((elapsedTime / 25) * 100, 100)}%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={onStopAI}
                    className="w-full py-4 bg-rose-500 text-white font-black uppercase text-xs rounded-2xl hover:bg-rose-400 transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-3 animate-pulse active:scale-95"
                  >
                    <div className="w-4 h-4 bg-white rounded-sm"></div>
                    Dừng xử lý ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center -mt-3 mb-1">
          <button
            type="button"
            onClick={() => setIsInputCollapsed(!isInputCollapsed)}
            className="w-14 h-6 flex items-center justify-center rounded-t-xl bg-neutral-900 border-x border-t border-white/10 text-neutral-500 shadow-lg active:bg-neutral-800 transition-colors"
          >
            {isInputCollapsed ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
          </button>
        </div>

        {isInputCollapsed ? (
          <div className="p-2 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
            <button
              type="button"
              onClick={() => setIsInputCollapsed(false)}
              className="flex-grow p-3 rounded-xl border border-white/5 bg-black/20 text-neutral-500 text-left text-xs mono italic"
            >
              Chạm để mở bảng điều khiển...
            </button>
            {isLoading ? (
              <button
                type="button"
                onClick={onStopAI}
                className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all animate-pulse z-[110]"
              >
                <div className="w-3 h-3 bg-white rounded-sm"></div>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-12 h-12 rounded-xl bg-emerald-500 text-black flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-20 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {/* Mobile Pagination & Controls */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-black/40 border border-white/5 rounded-xl shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                    if (scrollRef.current)
                      scrollRef.current.scrollTo({ top: 0, behavior: "auto" });
                  }}
                  disabled={currentPage === 1}
                  className="p-2 text-neutral-500 active:text-emerald-500 disabled:opacity-20 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                  <span className="mono text-[9px] font-black text-emerald-500/80 uppercase">
                    {currentPage}/{totalPages}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    if (scrollRef.current)
                      scrollRef.current.scrollTo({ top: 0, behavior: "auto" });
                  }}
                  disabled={currentPage === totalPages}
                  className="p-2 text-neutral-500 active:text-emerald-500 disabled:opacity-20 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollToNearestAction("up")}
                  className="p-2 text-neutral-500 active:text-cyan-400 transition-colors"
                  title="Hành động trước"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToNearestAction("down")}
                  className="p-2 text-neutral-500 active:text-cyan-400 transition-colors"
                  title="Hành động sau"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-white/5 mx-1"></div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/5 rounded-lg">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="mono text-[8px] font-black text-neutral-500 uppercase tracking-tighter">
                    Matrix
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`flex flex-col gap-2 bg-black/20 border p-2 rounded-2xl transition-all relative overflow-hidden ${isLoading ? "border-emerald-500/20" : "border-white/5 focus-within:border-emerald-500/40 shadow-2xl"}`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-1 font-black mono text-emerald-500 text-lg opacity-40">
                  ❯
                </span>
                <div className="flex-grow flex flex-col gap-1">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    disabled={isLoading}
                    rows={1}
                    placeholder={isLoading ? "Đang xử lý..." : placeholder}
                    className={`w-full bg-transparent border-none outline-none text-white ${fontSizeClass} mono resize-none py-1 max-h-[120px] placeholder:text-neutral-700`}
                  />
                  {!input && lastAction?.command && !isLoading && (
                    <button
                      type="button"
                      onClick={() => setInput(lastAction.command)}
                      className="self-start px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] text-neutral-600 active:text-emerald-500 active:bg-emerald-500/10 transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Khôi phục:{" "}
                      <span className="italic truncate max-w-[120px]">
                        {lastAction.command}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                <div className="flex gap-1 flex-1">
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      disabled={isLoading}
                      className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 ${logs.length > 0 && logs[logs.length - 1].type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-white/5 border-white/10 text-neutral-500"}`}
                      title="Tải lại"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
                      />
                      <span className="text-[8px] font-black uppercase">
                        Tải Lại
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onOpenAiHint}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-50 transition-all"
                    title="Nhắc AI"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase">
                      Nhắc AI
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={onToggleDiagnostics}
                    className="flex-1 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                    title="Chẩn đoán"
                  >
                    <ArrowUp className="w-3 h-3 rotate-45" />
                    <span className="text-[8px] font-black uppercase">
                      Diag
                    </span>
                  </button>
                </div>

                {isLoading ? (
                  <button
                    type="button"
                    onClick={onStopAI}
                    className="flex-[2] py-3 rounded-xl bg-rose-500 text-white mono text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all animate-pulse z-[110]"
                  >
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                    Dừng
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="flex-[2] py-3 rounded-xl bg-emerald-500 text-black mono text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Gửi lệnh
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
