
import { GameGenre, CodexEntry, WritingStyle, ResponseLength, AppSettings, PromptTrigger, WorldInfoEntry } from "../types";
import { CORE_MODULE } from "../prompts/coreModule";
import { NPC_MODULE } from "../prompts/npcModule";
import { INTEGRITY_MODULE, SOCIAL_INTELLIGENCE_MODULE } from "../prompts/integrityModule";
import { PHYSICAL_MODULE } from "../prompts/physicalModule";
import { ADULT_MODULE } from "../prompts/adultModule";
import { ADULT_ADVANCED_LITERARY_RULES } from "../prompts/adultAdvancedLiteraryRules";
import { SAFE_MODE_RULES } from "../prompts/safeModeRules";
import { DIGNITY_MODULE } from "../prompts/dignityModule";
import { NPC_INTELLIGENCE_RULES } from "../prompts/npcIntelligenceRules";
import { BEAUTIFY_CONTENT_RULES } from "../prompts/beautifyContentRules";
import { memoryService } from "./memoryService";
import { embeddingService } from "./embeddingService";

// Length rules
import { LENGTH_500_RULES } from "../prompts/length/length_500";
import { LENGTH_1000_RULES } from "../prompts/length/length_1000";
import { LENGTH_2000_RULES } from "../prompts/length/length_2000";
import { LENGTH_4000_RULES } from "../prompts/length/length_4000";
import { LENGTH_6000_RULES } from "../prompts/length/length_6000";
import { LENGTH_10000_RULES } from "../prompts/length/length_10000";

// Genre-specific rules
import { FEMALE_PHYSICAL_WUXIA_RULES } from "../prompts/femalePhysicalWuxiaRules";
import { FEMALE_PHYSICAL_URBAN_RULES } from "../prompts/femalePhysicalUrbanRules";
import { FEMALE_PHYSICAL_FANTASY_RULES } from "../prompts/femalePhysicalFantasyRules";

import { 
  CONVERT_STYLE_RULES, 
  WUXIA_CLASSIC_STYLE_RULES, 
  PALACE_ANCIENT_STYLE_RULES, 
  LIGHT_NOVEL_STYLE_RULES,
  SPICE_AND_WOLF_STYLE_RULES,
  HORROR_STYLE_RULES,
  TAWA_STYLE_RULES,
  TRUYEN_SAC_STYLE_RULES,
  ROMANCE_STYLE_RULES,
  HUMOR_STYLE_RULES,
  CHILL_STYLE_RULES,
  MYSTERY_STYLE_RULES,
  EPIC_WAR_STYLE_RULES,
  STYLE_OPENER,
  STYLE_CLOSER
} from "../prompts/writingStyleRules";
import { 
  TAWA_THINKING_LOGIC, 
  TAWA_CHARACTER_ENGINE, 
  TAWA_CORE_PROTOCOLS, 
  TAWA_NSFW_GUIDE, 
  TAWA_ASMR_PROTOCOL 
} from "../prompts/tawaModule";

export interface RagContext {
  action: string;
  genre: GameGenre;
  isAdultEnabled: boolean;
  hasNpcs: boolean;
  writingStyle?: WritingStyle;
  writingStyles?: WritingStyle[];
  responseLength?: ResponseLength;
  unlockedCodex?: CodexEntry[];
  actionEmbedding?: number[];
  settings?: AppSettings;
  triggerType?: PromptTrigger;
  lorebookEntries?: WorldInfoEntry[];
  lorebookOverflow?: boolean;
}

export class RagService {
  /**
   * Truy xuất quy tắc theo thể loại
   */
  private getGenreRules(genre: GameGenre): string {
    switch (genre) {
      case GameGenre.WUXIA: 
      case GameGenre.CULTIVATION:
        return FEMALE_PHYSICAL_WUXIA_RULES;
      case GameGenre.URBAN_NORMAL: 
      case GameGenre.URBAN_SUPERNATURAL: 
        return FEMALE_PHYSICAL_URBAN_RULES;
      case GameGenre.FANTASY_HUMAN:
      case GameGenre.FANTASY_MULTIRACE: 
        return FEMALE_PHYSICAL_FANTASY_RULES;
      default: return "";
    }
  }

  private getStyleRules(style: WritingStyle): string {
    switch (style) {
      case WritingStyle.LIGHT_NOVEL:
        return LIGHT_NOVEL_STYLE_RULES;
      case WritingStyle.SPICE_AND_WOLF:
        return SPICE_AND_WOLF_STYLE_RULES;
      case WritingStyle.CONVERT:
        return CONVERT_STYLE_RULES;
      case WritingStyle.WUXIA:
        return WUXIA_CLASSIC_STYLE_RULES;
      case WritingStyle.PALACE:
        return PALACE_ANCIENT_STYLE_RULES;
      case WritingStyle.HORROR:
        return HORROR_STYLE_RULES;
      case WritingStyle.TAWA:
        return TAWA_STYLE_RULES;
      case WritingStyle.TRUYEN_SAC:
        return TRUYEN_SAC_STYLE_RULES;
      case WritingStyle.ROMANCE:
        return ROMANCE_STYLE_RULES;
      case WritingStyle.HUMOR:
        return HUMOR_STYLE_RULES;
      case WritingStyle.CHILL:
        return CHILL_STYLE_RULES;
      case WritingStyle.MYSTERY:
        return MYSTERY_STYLE_RULES;
      case WritingStyle.EPIC_WAR:
        return EPIC_WAR_STYLE_RULES;
      default:
        return TAWA_STYLE_RULES;
    }
  }

  /**
   * Truy xuất các mục Codex liên quan
   */
  private getCodexContext(action: string, codex?: CodexEntry[]): string {
    if (!codex || codex.length === 0 || !action) return "";
    
    const relevantEntries = codex.filter(entry => {
      const keywords = (entry.title || '').toLowerCase().split(" ");
      return keywords.some(key => key.length > 2 && action.toLowerCase().includes(key));
    });

    if (relevantEntries.length === 0) return "";

    return `
      KIẾN THỨC THẾ GIỚI (UNLOCKED LORE):
      ${relevantEntries.map(e => `[${e.title}]: ${e.content}`).join("\n")}
    `;
  }

  /**
   * Hàm chính để lấy Prompt đã tối ưu hóa (RAG)
   */
  public assembleOptimizedPrompt(context: RagContext): string {
    const chunks: string[] = [];

    // 1. Codex Context
    const codex = this.getCodexContext(context.action, context.unlockedCodex);
    if (codex) chunks.push(codex);

    // 1.1 Semantic Memory Context
    const memoryContext = memoryService.getMemoryContext(context.actionEmbedding);
    if (memoryContext) chunks.push(memoryContext);

    // 1.2 World Info (Lorebook) Context groupings
    const groupedEntries: Record<string, WorldInfoEntry[]> = {
      'before_char': [],
      'after_char': [],
      'before_examples': [],
      'after_examples': [],
      'authors_note_top': [],
      'authors_note_bottom': [],
      'at_depth': []
    };

    if (context.lorebookEntries && context.lorebookEntries.length > 0) {
      context.lorebookEntries.forEach(e => {
        const placement = e.placement || 'after_char';
        if (groupedEntries[placement]) {
          groupedEntries[placement].push(e);
        } else {
          groupedEntries['after_char'].push(e);
        }
      });
      // Sort each group by order
      for (const placement in groupedEntries) {
        groupedEntries[placement].sort((a, b) => a.order - b.order);
      }
    }

    const formatEntries = (entries: WorldInfoEntry[], prefix: string) => {
       if (!entries || entries.length === 0) return '';
       const content = entries.map(e => `[${e.role ? e.role.toUpperCase() + ' - ' : ''}${e.title}]: ${e.content}`).join('\n');
       return `[${prefix}]:\n${content}`;
    };

    if (groupedEntries['before_char'].length > 0) chunks.push(formatEntries(groupedEntries['before_char'], 'HỆ THỐNG - DỮ LIỆU THẾ GIỚI (TRƯỚC MÔ TẢ)'));
    
    // Core Module & Tawa Logic Enhancement (represents "Char/Persona" area)
    chunks.push(CORE_MODULE);
    chunks.push(TAWA_THINKING_LOGIC); // Inject Tawa's 7-step thinking logic
    chunks.push(DIGNITY_MODULE);
    chunks.push(TAWA_CORE_PROTOCOLS); // Supplement with Tawa's anti-gamification
    chunks.push(NPC_INTELLIGENCE_RULES);
    chunks.push(BEAUTIFY_CONTENT_RULES);

    if (groupedEntries['after_char'].length > 0) chunks.push(formatEntries(groupedEntries['after_char'], 'HỆ THỐNG - DỮ LIỆU THẾ GIỚI (SAU MÔ TẢ)'));
    
    if (groupedEntries['before_examples'].length > 0) chunks.push(formatEntries(groupedEntries['before_examples'], 'DỮ LIỆU THẾ GIỚI (TRƯỚC VÍ DỤ)'));
    if (groupedEntries['after_examples'].length > 0) chunks.push(formatEntries(groupedEntries['after_examples'], 'DỮ LIỆU THẾ GIỚI (SAU VÍ DỤ)'));

    // Genre Rules
    const genreRules = this.getGenreRules(context.genre);
    if (genreRules) chunks.push(genreRules);

    // NPC & Physical Rules
    if (context.hasNpcs) {
      chunks.push(NPC_MODULE);
      chunks.push(TAWA_CHARACTER_ENGINE); // Enhance NPC depth with Tawa's engine
      chunks.push(INTEGRITY_MODULE);
      chunks.push(SOCIAL_INTELLIGENCE_MODULE);
      chunks.push(PHYSICAL_MODULE);
      
      if (!context.isAdultEnabled) {
        chunks.push(SAFE_MODE_RULES);
      }
    }

    // Adult Module & Tawa Sensory Enhancement
    if (context.isAdultEnabled) {
      chunks.push(ADULT_MODULE);
      chunks.push(TAWA_NSFW_GUIDE); // Tawa's biological sensory guide
      chunks.push(TAWA_ASMR_PROTOCOL); // Tawa's high-fidelity audio protocol
      chunks.push(ADULT_ADVANCED_LITERARY_RULES);
    } else {
      chunks.push("LƯU Ý: Nội dung 18+ đang bị TẮT. Tuyệt đối KHÔNG miêu tả bất kỳ hành động nhạy cảm nào.");
    }

    if (groupedEntries['authors_note_top'].length > 0) chunks.push(formatEntries(groupedEntries['authors_note_top'], 'GHI CHÚ TÁC GIẢ (ĐẦU)'));

    // Writing Style
    const stylesToUse = context.writingStyles && context.writingStyles.length > 0 
      ? context.writingStyles 
      : [context.writingStyle || WritingStyle.TAWA];

    const styleInstructions = stylesToUse.map(style => this.getStyleRules(style)).filter(Boolean);

    if (styleInstructions.length > 0) {
      chunks.push(STYLE_OPENER);
      styleInstructions.forEach((instruction, index) => {
        chunks.push(`VĂN PHONG ${index + 1}:\n${instruction}`);
      });
      chunks.push(`Hãy kết hợp nhuần nhuyễn các văn phong trên (tối đa 2 loại) để tạo ra một trải nghiệm độc đáo, tuân thủ nghiêm ngặt các quy tắc của chúng trong suốt câu chuyện.`);
      chunks.push(STYLE_CLOSER);
    }

    if (groupedEntries['authors_note_bottom'].length > 0) chunks.push(formatEntries(groupedEntries['authors_note_bottom'], 'GHI CHÚ TÁC GIẢ (CUỐI)'));

    // at_depth handling: ST places depth 0 close to the bottom
    const coreLore = groupedEntries['at_depth']
       .filter(e => (e.depth || 0) === 0)
       .sort((a, b) => a.order - b.order)
       .map(e => `[${e.role ? e.role.toUpperCase() + ' - ' : ''}CORE INFO: ${e.title}]: ${e.content}`)
       .join('\n');
    if (coreLore) chunks.push(`[HỆ THỐNG - DỮ LIỆU THẾ GIỚI CỐT LÕI (CORE DEPTH)]:\n${coreLore}`);

    // depth > 0 is actually handled by injecting into chat history, but since we use systemInstruction mainly,
    // we'll append the rest at the end if we cannot inject them into history.
    const deepLore = groupedEntries['at_depth']
       .filter(e => (e.depth || 0) > 0)
       .sort((a, b) => b.depth! - a.depth!) // deeper items appear higher
       .map(e => `[${e.role ? e.role.toUpperCase() + ' - ' : ''}CHÈN TẠI ĐỘ SÂU ${e.depth}]: ${e.content}`)
       .join('\n');
    if (deepLore) chunks.push(`[DỮ LIỆU THẾ GIỚI (ĐỘ SÂU BỔ SUNG)]:\n${deepLore}`);

    if (context.lorebookOverflow) {
      chunks.push(`[HỆ THỐNG]: Cảnh báo! Một số dữ liệu Lorebook quan trọng đã bị bỏ qua do vượt quá ngân sách bối cảnh.`);
    }

    // Response Length Rules
    if (context.responseLength) {
      switch (context.responseLength) {
        case ResponseLength.WORDS_500:
          chunks.push(LENGTH_500_RULES);
          break;
        case ResponseLength.WORDS_1000:
          chunks.push(LENGTH_1000_RULES);
          break;
        case ResponseLength.WORDS_2000:
          chunks.push(LENGTH_2000_RULES);
          break;
        case ResponseLength.WORDS_4000:
          chunks.push(LENGTH_4000_RULES);
          break;
        case ResponseLength.WORDS_6000:
          chunks.push(LENGTH_6000_RULES);
          break;
        case ResponseLength.WORDS_10000:
          chunks.push(LENGTH_10000_RULES);
          break;
      }
    }

    // 8. Custom Presets
    if (context.settings?.presetConfig?.activePresetId) {
        const activePreset = context.settings.presetConfig.presets.find(p => p.id === context.settings!.presetConfig!.activePresetId);
        if (activePreset && activePreset.prompts) {
            const activePrompts = activePreset.prompts.filter(p => {
                if (!p.enabled) return false;
                if (!context.triggerType) return p.trigger.includes('normal') || p.trigger.includes('all');
                return p.trigger.includes('all') || p.trigger.includes(context.triggerType);
            }).sort((a, b) => (a.relativeOrder || 0) - (b.relativeOrder || 0));

            // For now, we append all valid prompts into the system core.
            // TODO: In a more complex architecture, we would separate them by role (system/user/model) 
            // and pass them separately to Gemini.
            activePrompts.forEach(p => {
                if (p.role === 'system') {
                    chunks.push(`[SYSTEM RULE: ${p.name}]\n${p.content}`);
                }
            });
        }
    }

    return chunks.filter(c => c.trim() !== "").join("\n\n");
  }
}

export const ragService = new RagService();
