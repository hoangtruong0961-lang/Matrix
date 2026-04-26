import { WorldInfoEntry, WorldInfoBook, WorldInfoLogic, LorebookGlobalSettings, Player, Relationship, LorebookTemporalStatus } from '../types';
import extract from 'png-chunks-extract';
import { Buffer } from 'buffer';
import pako from 'pako';
import { embeddingService } from './embeddingService';

export const DEFAULT_LOREBOOK_SETTINGS: LorebookGlobalSettings = {
  scanDepth: 5,
  includeNames: true,
  tokenBudget: 1000,
  minActivations: 0,
  maxDepth: 10,
  recursiveScanning: true,
  maxRecursionSteps: 3,
  caseSensitive: false,
  matchWholeWords: true,
  scanNpcDescription: true,
  scanNpcPersonality: true,
  scanScenario: true,
  scanNpcNotes: true,
  scanCreatorNotes: true,
  vectorEnabled: false,
  vectorThreshold: 0.8
};

export interface LorebookScanContext {
  history: { type: string, content: string, name?: string }[];
  action: string;
  player: Player;
  currentNpcNames: string[];
  npcs: Relationship[];
  settings?: LorebookGlobalSettings;
  turnCount: number;
}

export class LorebookService {
  /**
   * Scans text against a set of Lorebook entries and returns the ones that should be activated.
   */
  async scan(ctx: LorebookScanContext): Promise<{ 
    entries: WorldInfoEntry[], 
    newStatus: Record<string, LorebookTemporalStatus>,
    overflow: boolean 
  }> {
    const { history, action, player, currentNpcNames, npcs, turnCount } = ctx;
    const settings = ctx.settings || player.worldInfoSettings || DEFAULT_LOREBOOK_SETTINGS;
    const books = player.worldInfoBooks || [];
    const activeIds = player.activeLorebookIds || [];
    const currentStatus = { ...(player.lorebookStatus || {}) };

    const relevantBooks = books.filter(b => b.enabled && (activeIds.includes(b.id)));
    const allEntries = relevantBooks.flatMap(b => b.entries).filter(e => e.enabled);

    // 1. Prepare Text Buffers
    const scanDepth = settings.scanDepth;
    const recentMessages = history.slice(-Math.max(1, scanDepth));
    
    // Main buffer: recent messages
    let mainBuffer = recentMessages.map(m => {
      if (settings.includeNames && m.name) {
        return `${m.name}: ${m.content}`;
      }
      return m.content;
    }).join('\n');
    mainBuffer += `\n${action}`;

    // Additional sources buffer
    let sourcesBuffer = "";
    if (settings.scanScenario && player.background) sourcesBuffer += player.background + "\n";
    
    npcs.forEach(npc => {
      // Current selected/present NPCs
      if (currentNpcNames.includes(npc.name)) {
        if (settings.scanNpcDescription && npc.background) sourcesBuffer += npc.background + "\n";
        if (settings.scanNpcPersonality && npc.personality) sourcesBuffer += npc.personality + "\n";
        if (settings.scanNpcNotes && (npc as any).notes) sourcesBuffer += (npc as any).notes + "\n";
        if (settings.scanCreatorNotes && (npc as any).creatorNotes) sourcesBuffer += (npc as any).creatorNotes + "\n";
      }
    });

    const fullBuffer = (mainBuffer + "\n" + sourcesBuffer).trim();

    // 2. Pre-process Temporal State (decrement counts)
    // We only decrement once per turn. Assuming turnCount is passed.
    Object.keys(currentStatus).forEach(id => {
      const s = currentStatus[id];
      if (s.lastTriggeredTurn < turnCount) {
        if (s.stickyRemaining > 0) s.stickyRemaining--;
        if (s.cooldownRemaining > 0) s.cooldownRemaining--;
      }
    });

    // 3. First Pass Activation (Keywords + Vector)
    let activated: WorldInfoEntry[] = [];
    const activatedIds = new Set<string>();

    const checkEntry = async (entry: WorldInfoEntry, textToScan: string, isRecursive: boolean): Promise<boolean> => {
      if (activatedIds.has(entry.id)) return false;

      // a. Temporal Check
      if (currentStatus[entry.id]) {
        const s = currentStatus[entry.id];
        if (s.stickyRemaining > 0) return true; // Sticky entries are always active
        if (s.cooldownRemaining > 0) return false; // Cooldown active
      }
      
      // b. Delay Check
      if (entry.delay && turnCount < entry.delay) return false;

      // c. Recursion Check
      if (isRecursive && entry.noRecursion) return false;
      if (!isRecursive && entry.delayUntilRecursion) return false;

      // d. Probability Check
      if (entry.probability < 100) {
        if (Math.random() * 100 > entry.probability) return false;
      }

      // e. Character Filter
      if (entry.includeCharacters && entry.includeCharacters.length > 0) {
        if (!entry.includeCharacters.some(name => currentNpcNames.includes(name))) return false;
      }
      if (entry.excludeCharacters && entry.excludeCharacters.length > 0) {
        if (entry.excludeCharacters.some(name => currentNpcNames.includes(name))) return false;
      }

      // f. Keyword Match
      const kwMatch = this.checkKeysMatched(textToScan, entry.keys, entry.useRegex, entry.caseSensitive, settings.matchWholeWords);
      
      // g. Secondary Logic
      let matched = kwMatch;
      if (kwMatch && entry.secondaryKeys && entry.secondaryKeys.length > 0) {
        const secMatchedCount = this.getMatchedCount(textToScan, entry.secondaryKeys, entry.useRegex, entry.caseSensitive, settings.matchWholeWords);
        const allSec = secMatchedCount === entry.secondaryKeys.length;
        const anySec = secMatchedCount > 0;
        
        switch (entry.logic) {
          case 'AND_ANY': matched = anySec; break;
          case 'AND_ALL': matched = allSec; break;
          case 'NOT_ANY': matched = !anySec; break;
          case 'NOT_ALL': matched = !allSec; break;
        }
      }

      // h. Vector Match (Semantic)
      if (!matched && settings.vectorEnabled && entry.vectorized && entry.embedding) {
        try {
          const textEmbedding = await embeddingService.getEmbedding(textToScan);
          const similarity = embeddingService.cosineSimilarity(textEmbedding, entry.embedding);
          if (similarity >= (settings.vectorThreshold || 0.8)) {
            matched = true;
          }
        } catch (e) {
          console.error("Vector match failed:", e);
        }
      }

      return matched;
    };

    // First scan pass
    for (const entry of allEntries) {
      if (await checkEntry(entry, fullBuffer, false)) {
        activated.push(entry);
        activatedIds.add(entry.id);
      }
    }

    // 4. Recursive Scanning
    if (settings.recursiveScanning) {
      let currentRecursionDepth = 0;
      let newRecursiveFound = true;
      const maxSteps = settings.maxRecursionSteps || 3;

      while (newRecursiveFound && (maxSteps === 0 || currentRecursionDepth < maxSteps)) {
        newRecursiveFound = false;
        currentRecursionDepth++;

        // Buffer for recursive scanning: combine content of all currently activated entries
        const recursiveBuffer = activated
          .filter(e => !e.preventFurtherRecursion)
          .map(e => e.content)
          .join('\n');

        if (!recursiveBuffer.trim()) break;

        for (const entry of allEntries) {
          if (!activatedIds.has(entry.id)) {
            if (await checkEntry(entry, recursiveBuffer, true)) {
              activated.push(entry);
              activatedIds.add(entry.id);
              newRecursiveFound = true;
            }
          }
        }
      }
    }

    // 5. Min Activations (Scan further back if needed)
    if (settings.minActivations > 0 && activated.length < settings.minActivations) {
      const maxDepth = Math.max(settings.maxDepth || 10, scanDepth);
      for (let d = scanDepth + 1; d <= maxDepth; d++) {
        if (activated.length >= settings.minActivations) break;
        
        const extraHistory = history.slice(-d, -(d - 1))[0];
        if (!extraHistory) break;
        
        const extraText = settings.includeNames && extraHistory.name 
          ? `${extraHistory.name}: ${extraHistory.content}` 
          : extraHistory.content;

        for (const entry of allEntries) {
          if (!activatedIds.has(entry.id)) {
            if (await checkEntry(entry, extraText, false)) {
              activated.push(entry);
              activatedIds.add(entry.id);
            }
          }
        }
      }
    }

    // 6. Handle Exclusion Groups
    activated = this.handleExclusionGroups(activated);

    // 7. Budgeting & Finalizing
    // Simple token estimate: words * 1.5
    let totalEstimatedTokens = 0;
    const finalEntries: WorldInfoEntry[] = [];
    let overflow = false;

    // Sort by order for insertion priority
    activated.sort((a, b) => a.order - b.order);

    for (const entry of activated) {
      const entryTokens = Math.ceil(entry.content.split(/\s+/).length * 1.5);
      if (totalEstimatedTokens + entryTokens <= settings.tokenBudget) {
        totalEstimatedTokens += entryTokens;
        finalEntries.push(entry);
        
        // Update temporal state for newly triggered entries
        if (!currentStatus[entry.id] || (currentStatus[entry.id].stickyRemaining === 0 && currentStatus[entry.id].cooldownRemaining === 0)) {
          currentStatus[entry.id] = {
            lastTriggeredTurn: turnCount,
            stickyRemaining: entry.sticky || 0,
            cooldownRemaining: entry.cooldown || 0
          };
        }
      } else {
        overflow = true;
      }
    }

    return {
      entries: finalEntries.sort((a, b) => a.order - b.order),
      newStatus: currentStatus,
      overflow
    };
  }

  private checkKeysMatched(text: string, keys: string[], useRegex: boolean, caseSensitive: boolean, matchWholeWords: boolean): boolean {
    if (keys.length === 0) return false;
    
    return keys.some(key => {
      if (useRegex) {
        try {
          const regex = new RegExp(key, caseSensitive ? 'g' : 'gi');
          return regex.test(text);
        } catch (e) {
          return false;
        }
      } else {
        let needle = caseSensitive ? key : key.toLowerCase();
        let haystack = caseSensitive ? text : text.toLowerCase();
        
        if (matchWholeWords) {
          // Vietnamese specific: treat space-separated words as boundaries
          const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(^|[^a-zA-Z0-9À-ỹ_])(${escaped})([^a-zA-Z0-9À-ỹ_]|$)`, caseSensitive ? '' : 'i');
          return regex.test(text);
        }
        
        return haystack.includes(needle);
      }
    });
  }

  private getMatchedCount(text: string, keys: string[], useRegex: boolean, caseSensitive: boolean, matchWholeWords: boolean): number {
    return keys.filter(key => this.checkKeysMatched(text, [key], useRegex, caseSensitive, matchWholeWords)).length;
  }

  private handleExclusionGroups(entries: WorldInfoEntry[]): WorldInfoEntry[] {
    const groups: Record<string, WorldInfoEntry[]> = {};
    const ungrouped: WorldInfoEntry[] = [];

    entries.forEach(e => {
      if (e.group && e.group.trim()) {
        if (!groups[e.group]) groups[e.group] = [];
        groups[e.group].push(e);
      } else {
        ungrouped.push(e);
      }
    });

    const winners: WorldInfoEntry[] = [...ungrouped];

    Object.keys(groups).forEach(groupName => {
      const groupEntries = groups[groupName];
      if (groupEntries.length === 0) return;

      const sorted = groupEntries.sort((a, b) => {
        const weightA = a.groupWeight || 0;
        const weightB = b.groupWeight || 0;
        if (weightB !== weightA) return weightB - weightA;
        return (b.order || 0) - (a.order || 0);
      });
      winners.push(sorted[0]);
    });

    return winners;
  }

  /**
   * Mock implementation for importing SillyTavern JSON
   */
  importSillyTavern(jsonStr: string): WorldInfoBook | null {
    try {
      const raw = JSON.parse(jsonStr);
      return this.parseSTData(raw);
    } catch (e) {
      console.error("Failed to import SillyTavern lorebook:", e);
      return null;
    }
  }

  /**
   * Parses SillyTavern Lorebook data from a PNG file.
   */
  async importSillyTavernPng(file: File): Promise<WorldInfoBook | null> {
    try {
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const chunks = extract(uint8);

      const worldChunk = chunks.find(chunk => {
        const name = chunk.name;
        if (name === 'tEXt' || name === 'iTXt' || name === 'zTXt') {
          const data = Buffer.from(chunk.data);
          const nullIndex = data.indexOf(0);
          const keyword = data.slice(0, nullIndex).toString('utf8');
          return keyword === 'world';
        }
        return false;
      });

      if (!worldChunk) return null;

      let jsonStr = '';
      const data = Buffer.from(worldChunk.data);
      const nullIndex = data.indexOf(0);

      if (worldChunk.name === 'tEXt') {
        const textData = data.slice(nullIndex + 1).toString('utf8');
        jsonStr = Buffer.from(textData, 'base64').toString('utf8');
      } else if (worldChunk.name === 'zTXt') {
        const compressedData = data.slice(nullIndex + 2);
        const decompressed = pako.inflate(compressedData);
        const base64Data = Buffer.from(decompressed).toString('utf8');
        jsonStr = Buffer.from(base64Data, 'base64').toString('utf8');
      } else if (worldChunk.name === 'iTXt') {
        const compressionFlag = data[nullIndex + 1];
        let currentPos = nullIndex + 3;
        let nullCount = 0;
        while (nullCount < 2 && currentPos < data.length) {
          if (data[currentPos] === 0) nullCount++;
          currentPos++;
        }
        const textData = data.slice(currentPos);
        
        if (compressionFlag === 1) {
          const decompressed = pako.inflate(textData);
          const base64Data = Buffer.from(decompressed).toString('utf8');
          jsonStr = Buffer.from(base64Data, 'base64').toString('utf8');
        } else {
          const base64Data = textData.toString('utf8');
          jsonStr = Buffer.from(base64Data, 'base64').toString('utf8');
        }
      }

      return this.importSillyTavern(jsonStr);
    } catch (e) {
      console.error("Failed to extract lorebook from PNG:", e);
      return null;
    }
  }

  private parseSTData(raw: any): WorldInfoBook | null {
    try {
      const entries: WorldInfoEntry[] = [];
      const rawEntries = raw.entries || raw;
      
      Object.keys(rawEntries).forEach((id, index) => {
        const e = rawEntries[id];
        const rawKeys = e.key || e.keys || [];
        const rawSecKeys = e.keysecondary || e.secondary_keys || [];
        
        const parsedKeys = Array.isArray(rawKeys) ? rawKeys : (typeof rawKeys === 'string' ? rawKeys.split(',').map((k: string) => k.trim()) : []);
        const parsedSecKeys = Array.isArray(rawSecKeys) ? rawSecKeys : (typeof rawSecKeys === 'string' ? rawSecKeys.split(',').map((k: string) => k.trim()) : []);

        entries.push({
          id: e.id?.toString() || Math.random().toString(36).substr(2, 9),
          title: e.comment || e.id || `Entry ${index}`,
          keys: parsedKeys.filter(Boolean),
          secondaryKeys: parsedSecKeys.filter(Boolean),
          content: e.content || '',
          enabled: !e.disable,
          order: e.extensions?.order ?? e.order ?? 100,
          probability: e.extensions?.probability ?? (e.probability !== undefined ? e.probability : 100),
          placement: this.mapSTPlacement(e.extensions?.placement ?? e.placement ?? e.extensions?.position ?? e.insertion_order ?? e.position),
          role: (() => {
            const r = e.extensions?.role ?? e.role;
            return (r == 1 || r === 'user') ? 'user' : ((r == 2 || r === 'model' || r === 'assistant' || r === 'char') ? 'model' : 'system');
          })(),
          depth: e.extensions?.depth ?? e.depth ?? 0,
          caseSensitive: !!(e.extensions?.caseSensitive ?? e.caseSensitive),
          useRegex: !!(e.extensions?.useRegex ?? e.useRegex),
          logic: this.mapSTLogic(e.extensions?.selectiveLogic ?? e.extensions?.logic ?? e.selectiveLogic ?? e.logic),
          group: e.extensions?.excludeRecursion || e.excludeRecursion ? 'exclude_recursion' : (e.extensions?.group ?? e.group),
          groupWeight: e.extensions?.groupWeight ?? e.groupWeight ?? 100,
          includeCharacters: e.extensions?.includeCharacters ?? e.includeCharacters ?? [],
          excludeCharacters: e.extensions?.excludeCharacters ?? e.excludeCharacters ?? []
        });
      });

      return {
        id: raw.name || `lore_${Date.now()}`,
        name: raw.name || 'Imported Lorebook',
        description: raw.description || '',
        entries,
        enabled: true,
        updatedAt: Date.now()
      };
    } catch (e) {
      return null;
    }
  }

  private mapSTPlacement(stOrder: any): any {
    if (typeof stOrder === 'string') {
      const parsed = parseInt(stOrder);
      if (!isNaN(parsed)) {
        stOrder = parsed;
      } else {
        return stOrder; // It's already an mapped string like 'before_char'
      }
    }
    
    // ST Insertion Orders: 
    // 0: Before Char, 1: After Char, 2: Before Example, 3: After Example, 4: AN Top, 5: AN Bottom, 6: @ Depth
    const mapping: any = {
      0: 'before_char',
      1: 'after_char',
      2: 'before_examples',
      3: 'after_examples',
      4: 'authors_note_top',
      5: 'authors_note_bottom',
      6: 'at_depth'
    };
    return mapping[stOrder] || 'after_char';
  }

  private mapSTLogic(stLogic: any): WorldInfoLogic {
    let parsed = parseInt(stLogic);
    if (isNaN(parsed)) return 'AND_ANY';
    // 0: AND ANY, 1: AND ALL, 2: NOT ANY, 3: NOT ALL
    const mapping: WorldInfoLogic[] = ['AND_ANY', 'AND_ALL', 'NOT_ANY', 'NOT_ALL'];
    return mapping[parsed] || 'AND_ANY';
  }
}

export const lorebookService = new LorebookService();
