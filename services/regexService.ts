
import { Player, RegexRule } from "../types";

export class RegexScriptEngine {
  private activeRules: RegexRule[] = [];
  private static readonly MAX_ITERATIONS = 100;
  private logCache = new Map<string, number>();

  public setActiveScripts(rules: RegexRule[]) {
    // Sort logic from pipeline-executor:
    // Prompt-only first, then others, and also by order
    this.activeRules = [...rules].sort((a, b) => {
      if (a.promptOnly && !b.promptOnly) return -1;
      if (!a.promptOnly && b.promptOnly) return 1;
      return a.order - b.order;
    });
  }

  public replaceMacros(text: string, context?: { player?: Player, charName?: string }): string {
    if (!text) return "";
    let result = text;

    if (context?.player) {
      const p = context.player;
      result = result.replace(/{{user}}/gi, p.name || "người chơi");
      result = result.replace(/{{player}}/gi, p.name || "người chơi");
      result = result.replace(/{{description}}/gi, p.appearance || p.personality || "");
    }

    if (context?.charName) {
      result = result.replace(/{{char}}/gi, context.charName);
    }

    const now = new Date();
    result = result.replace(/{{time}}/gi, now.toLocaleTimeString());
    result = result.replace(/{{date}}/gi, now.toLocaleDateString());

    return result;
  }

  private isPotentiallyDangerous(pattern: string): boolean {
    const dangerousPatterns = [
      /(\(.+\)[*+]){2,}/,       // (a+)+
      /\[.+\][*+]\[.+\][*+]/,   // [a]*[b]*
      /\(.+\)\{.*,\}\(.+\)\{.*,\}/ // (a){1,}(b){1,}
    ];
    return dangerousPatterns.some(re => re.test(pattern));
  }

  private parseRegexLiteral(literal: string): { pattern: string; flags: string } | null {
    const match = literal.match(/^\/(.+?)\/([gimsuy]*)$/);
    if (!match) return null;
    return {
      pattern: match[1],
      flags: match[2] || 'gm'
    };
  }

  private prepareReplacement(template: string, mode: number): string {
    switch (mode) {
      case 1: // Escape regex
        return template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      case 2: // Unescape
        return template.replace(/\\(.)/g, '$1');
      default:
        return template;
    }
  }

  private applyTrimStrings(text: string, trims: string[]): string {
    return trims.reduce((acc, trimStr) => {
      const escaped = trimStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return acc.replace(new RegExp(`^${escaped}|${escaped}$`, 'g'), '');
    }, text);
  }

  public applyScripts(text: string, context?: { player?: Player, charName?: string, isPrompt?: boolean, isMarkdown?: boolean, depth?: number }): string {
    if (!text) return "";
    let currentText = this.replaceMacros(text, context);

    for (const rule of this.activeRules) {
      if (!rule.enabled || !rule.pattern) continue;

      // Filtering logic
      const placementArr = Array.isArray(rule.placement) ? rule.placement : (typeof rule.placement === 'number' ? [rule.placement] : []);
      if (context?.isPrompt && (rule.markdownOnly || (rule.placement && !placementArr.includes(1)))) continue;
      if (context?.isMarkdown && (rule.promptOnly || (rule.placement && !placementArr.includes(2)))) continue;

      // Depth filtering
      if (rule.minDepth !== undefined && rule.minDepth !== null) {
          if (context?.depth === undefined || context.depth < rule.minDepth) continue;
      }
      if (rule.maxDepth !== undefined && rule.maxDepth !== null) {
          if (context?.depth === undefined || context.depth > rule.maxDepth) continue;
      }

      try {
        let regexPattern = this.replaceMacros(rule.pattern, context);
        let regexFlags = rule.flags || 'g';

        const parsedLiteral = this.parseRegexLiteral(regexPattern);
        if (parsedLiteral) {
            regexPattern = parsedLiteral.pattern;
            regexFlags = parsedLiteral.flags;
        }

        if (this.isPotentiallyDangerous(regexPattern)) {
            console.warn(`[RegexEngine] Bỏ qua rule nguy hiểm (Potentially Dangerous): ${rule.name}`);
            continue;
        }

        const regex = new RegExp(regexPattern, regexFlags);
        let replacementTemplate = this.replaceMacros(rule.replacement, context);
        replacementTemplate = this.prepareReplacement(replacementTemplate, rule.substituteRegex || 0);

        let result = currentText;

        result = result.replace(regex, (...args) => {
            const matchStr = args[0];
            const captureGroups = args.slice(1, -2);
            
            return replacementTemplate.replace(/\$(\d+|&)/g, (_, group) => {
                if (group === '&') return matchStr;
                const index = parseInt(group, 10);
                return captureGroups[index - 1] ?? '';
            });
        });

        if (rule.trimStrings && rule.trimStrings.length > 0) {
            result = this.applyTrimStrings(result, rule.trimStrings);
        }

        if (currentText !== result) {
            const logKey = `mod_${rule.id}_${context?.isPrompt ? 'prompt' : 'ui'}`;
            const now = Date.now();
            if (!this.logCache.has(logKey) || now - this.logCache.get(logKey)! > 5000) {
               console.log(`[RegexEngine] Rule "${rule.name}" đã sửa đổi văn bản (${context?.isPrompt ? 'Prompt' : 'UI'}).`);
               this.logCache.set(logKey, now);
            }
        }

        currentText = result;
      } catch (e) {
        const errKey = `err_${rule.id}`;
        const now = Date.now();
        if (!this.logCache.has(errKey) || now - this.logCache.get(errKey)! > 5000) {
            console.error(`[RegexEngine] Lỗi thiết lập RegexScript: Chạy rule "${rule.name}" bị failed. Vui lòng kiểm tra lại cấu trúc Regex.`, e);
            this.logCache.set(errKey, now);
        }
      }
    }

    return currentText;
  }
}

export const regexService = new RegexScriptEngine();
