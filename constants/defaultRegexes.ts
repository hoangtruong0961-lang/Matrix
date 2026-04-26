import { RegexRule } from '../types';

export const DEFAULT_GLOBAL_REGEXES: RegexRule[] = [
  // Default Thinking Removal
  {
    id: "default-thinking-removal",
    name: "Xóa bỏ chuỗi tư duy đi kèm (Mặc định)",
    pattern: "/<thinking>([\\s\\S]*?)<\\/thinking>/gm",
    replacement: "",
    flags: "gm",
    enabled: true,
    order: 0,
    scope: 'global'
  },
  // A. SANITIZATION (Prompt Only - Hide from AI)
  {
    id: "hide-npc-status",
    name: "Ẩn <NPC_status> khỏi AI",
    pattern: "/<NPC_status>[\\s\\S]*?<\\/NPC_status>/gi",
    replacement: "",
    flags: "gi",
    enabled: true,
    order: 10,
    scope: 'global',
    promptOnly: true,
    placement: [1]
  },
  {
    id: "hide-user-status",
    name: "Ẩn <user_now_status> khỏi AI",
    pattern: "/<user_now_status>[\\s\\S]*?<\\/user_now_status>/gi",
    replacement: "",
    flags: "gi",
    enabled: true,
    order: 11,
    scope: 'global',
    promptOnly: true,
    placement: [1]
  },
  {
    id: "hide-choice",
    name: "Ẩn <choice> khỏi AI",
    pattern: "/<choice>[\\s\\S]*?<\\/choice>/gi",
    replacement: "",
    flags: "gi",
    enabled: true,
    order: 12,
    scope: 'global',
    promptOnly: true,
    placement: [1]
  },
  {
    id: "hide-battle-panel",
    name: "Ẩn bảng chiến đấu khỏi AI",
    pattern: "/<Battle_Panel_Guide\\d*>[\\s\\S]*?<\\/Battle_Panel_Guide\\d*>/gi",
    replacement: "",
    flags: "gi",
    enabled: true,
    order: 13,
    scope: 'global',
    promptOnly: true,
    placement: [1]
  },
  {
    id: "hide-comprehensive-status",
    name: "Ẩn <comprehensive_now_status>",
    pattern: "/<comprehensive_now_status>[\\s\\S]*?<\\/comprehensive_now_status>/gi",
    replacement: "",
    flags: "gi",
    enabled: true,
    order: 14,
    scope: 'global',
    promptOnly: true,
    placement: [1]
  },

  // B. VISUALIZATION (Markdown Only - Render for User)
  {
    id: "render-user-status",
    name: "Render UI <user_now_status>",
    pattern: "/<user_now_status>([\\s\\S]*?)<\\/user_now_status>/gi",
    replacement: "<div style=\"margin:1rem 0; border:1px solid rgba(16,185,129,0.3); border-radius:0.75rem; overflow:hidden; background:rgba(5,5,5,0.8);\"><details><summary style=\"cursor:pointer; padding:0.75rem 1rem; background:rgba(16,185,129,0.1); color:#10b981; font-weight:700; user-select:none; outline:none;\">📊 Thanh trạng thái {{user}}</summary><div style=\"padding:1rem; font-family:'JetBrains Mono',monospace; font-size:0.875rem; color:#e5e5e5; white-space:pre-wrap;\">$1</div></details></div>",
    flags: "gi",
    enabled: true,
    order: 20,
    scope: 'global',
    markdownOnly: true,
    placement: [2]
  },
  {
    id: "render-npc-status",
    name: "Render UI <NPC_status>",
    pattern: "/<NPC_status>([\\s\\S]*?)<\\/NPC_status>/gi",
    replacement: "<div style=\"margin:1rem 0; border:1px solid rgba(139,92,246,0.3); border-radius:0.75rem; overflow:hidden; background:rgba(5,5,5,0.8);\"><details><summary style=\"cursor:pointer; padding:0.75rem 1rem; background:rgba(139,92,246,0.1); color:#8b5cf6; font-weight:700; user-select:none; outline:none;\">👤 Thanh trạng thái NPC</summary><div style=\"padding:1rem; font-family:'JetBrains Mono',monospace; font-size:0.875rem; color:#e5e5e5; white-space:pre-wrap;\">$1</div></details></div>",
    flags: "gi",
    enabled: true,
    order: 21,
    scope: 'global',
    markdownOnly: true,
    placement: [2]
  },
  {
    id: "render-choice",
    name: "Render UI <choice>",
    pattern: "/<choice>([\\s\\S]*?)<\\/choice>/gi",
    replacement: "<div style=\"margin: 1rem 0; padding: 1.5rem; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 1rem; background: radial-gradient(circle at top left, rgba(14, 165, 233, 0.15), transparent 70%), #050505; box-shadow: 0 4px 20px rgba(14, 165, 233, 0.1);\"><h4 style=\"margin-top: 0; color: #38bdf8; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.1em; display:flex; align-items:center; gap:0.5rem;\"><span style=\"display:inline-block; width:8px; height:8px; border-radius:50%; background:#38bdf8; box-shadow:0 0 10px #38bdf8;\"></span>Lựa Chọn Vận Mệnh</h4><div style=\"color: #e2e8f0; line-height: 1.7; white-space:pre-wrap;\">\n\n$1\n</div></div>",
    flags: "gi",
    enabled: true,
    order: 22,
    scope: 'global',
    markdownOnly: true,
    placement: [2]
  },
  {
    id: "render-battle-panel",
    name: "Render UI <Battle_Panel_Guide>",
    pattern: "/<Battle_Panel_Guide\\d*>([\\s\\S]*?)<\\/Battle_Panel_Guide\\d*>/gi",
    replacement: "<div style=\"margin:1rem 0; border-radius:1rem; overflow:hidden; border:1px solid rgba(225,29,72,0.3);\"><div style=\"background:linear-gradient(90deg, rgba(225,29,72,0.2) 0%, rgba(16,185,129,0.2) 100%); padding:0.5rem 1rem; text-align:center; font-weight:900; letter-spacing:0.1em; border-bottom:1px solid rgba(225,29,72,0.3); font-family:'Space Grotesk',sans-serif; color:#f43f5e;\">⚔️ BẢNG CHIẾN ĐẤU</div><div style=\"padding:1rem; background:#0a0a0a; font-family:'JetBrains Mono', monospace; font-size:0.875rem; color:#e5e5e5; white-space:pre-wrap;\">$1</div></div>",
    flags: "gi",
    enabled: true,
    order: 23,
    scope: 'global',
    markdownOnly: true,
    placement: [2]
  },
  {
    id: "render-ai-guide",
    name: "Render UI <AI_guide>",
    pattern: "/<AI_guide>([\\s\\S]*?)<\\/AI_guide>/gi",
    replacement: "<details style=\"margin:1rem 0; border-left:3px solid #64748b; padding-left:1rem; color:#94a3b8;\"><summary style=\"cursor:pointer; font-style:italic; font-size:0.875rem; user-select:none; outline:none;\">Chuỗi tư duy NPC...</summary><div style=\"margin-top:0.5rem; font-size:0.875rem; white-space:pre-wrap;\">$1</div></details>",
    flags: "gi",
    enabled: true,
    order: 24,
    scope: 'global',
    markdownOnly: true,
    placement: [2]
  }
];
