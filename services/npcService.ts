
import { Relationship, BodyDescription, NpcCondition, NpcNetwork } from '../types';

export const isValidValue = (val: any): boolean => {
  if (val === undefined || val === null || val === '') return false;
  if (typeof val === 'string') {
    const v = val.trim().toLowerCase();
    const placeholders = [
      '??', 'n/a', 'chưa rõ', 'đang cập nhật', 'unknown', 'none', 'đang cập nhật...', 
      'không rõ', 'ẩn số', 'bí mật', 'không có', 'trống', 'chưa xác định', 'chưa có',
      'không xác định', 'không rõ thông tin', 'chưa có thông tin', 'chưa cập nhật',
      'n/a', 'null', 'undefined', 'placeholder', '???', '-', '---', '...', '?', 'x',
      'empty', 'chưa biết', 'bí ẩn', 'không biết', 'tùy ý', 'tùy chọn', 'chưa đặt', 'chưa thiết lập'
    ];
    return !placeholders.includes(v);
  }
  return true;
};

export const compensateNpcData = (npc: Relationship, _currentYear: number): Relationship => {
  // Đảm bảo NPC luôn có ID duy nhất nếu chưa có
  const result = { ...npc };
  if (!result.id) {
    // Fallback nếu useGameLogic không gán ID theo số thứ tự
    result.id = `npc_fb_${Date.now()}`;
  }

  // Chuẩn hóa mảng đối tượng
  if (result.skills) result.skills = normalizeObjectArray(result.skills);
  if (result.inventory) result.inventory = normalizeObjectArray(result.inventory);
  if (result.conditions) result.conditions = normalizeConditionsArray(result.conditions);
  if (result.network) result.network = normalizeNetworkArray(result.network);

  return result;
};

// Helper to normalize arrays of objects (inventory, skills, assets)
export const normalizeObjectArray = (arr: any[]) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (typeof item === 'string') {
      return { name: item, description: 'Chưa có mô tả chi tiết.' };
    }
    if (item && typeof item === 'object') {
      const name = item.name || item.title || 'Vô danh';
      const description = item.description || item.desc || 'Chưa có mô tả chi tiết.';
      return {
        name: (name === undefined || name === null || String(name) === 'undefined') ? 'Vô danh' : String(name),
        description: (description === undefined || description === null || String(description) === 'undefined') ? 'Chưa có mô tả chi tiết.' : String(description)
      };
    }
    return { name: 'Vô danh', description: 'Chưa có mô tả chi tiết.' };
  });
};

export const normalizeConditionsArray = (arr: any[]): NpcCondition[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (typeof item === 'string') {
      return { name: item, type: 'temporary', description: 'Chưa có mô tả chi tiết.' };
    }
    if (item && typeof item === 'object') {
      const name = item.name || item.title || 'Trạng thái không tên';
      const description = item.description || item.desc || 'Chưa có mô tả chi tiết.';
      const type: 'temporary' | 'permanent' = item.type === 'permanent' ? 'permanent' : 'temporary';
      return {
        name: (name === undefined || name === null || String(name) === 'undefined') ? 'Trạng thái không tên' : String(name),
        description: (description === undefined || description === null || String(description) === 'undefined') ? 'Chưa có mô tả chi tiết.' : String(description),
        type
      };
    }
    return { name: 'Trạng thái không tên', type: 'temporary', description: 'Chưa có mô tả chi tiết.' };
  });
};

export const normalizeNetworkArray = (arr: any[]): NpcNetwork[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (item && typeof item === 'object') {
      return {
        npcId: String(item.npcId || ''),
        npcName: item.npcName ? String(item.npcName) : undefined,
        relation: String(item.relation || 'Người quen'),
        description: item.description ? String(item.description) : undefined,
        affinity: typeof item.affinity === 'number' ? item.affinity : 500
      };
    }
    return { npcId: '', relation: 'Người quen', affinity: 500 };
  }).filter(item => item.npcId !== '');
};


export const mergeNpcData = (oldNpc: Relationship, newNpc: Relationship, narratorText: string, _currentYear: number, _justification?: string): Relationship => {
  const result = { ...oldNpc };
  const changes: Record<string, { old: any, new: any }> = {};
  const newFields: string[] = oldNpc.newFields || [];

  const numericStats = ['affinity', 'loyalty', 'lust', 'libido', 'willpower', 'age'];

  // Trộn tất cả các trường từ AI gửi về
  Object.entries(newNpc).forEach(([key, value]) => {
    if (key === 'id' || key === 'lastChanges' || key === 'lockedFields' || key === 'newFields' || key === 'bodyDescription') return;
    
    const k = key as keyof Relationship;
    const oldVal = oldNpc[k];

    // Kiểm tra xem trường này có bị khóa không
    if (oldNpc.lockedFields?.includes(k)) {
      return;
    }
    
    if (value !== undefined && value !== null) {
      // Xử lý các chỉ số dạng số
      let finalValue = value;
      if (numericStats.includes(k)) {
        const current = (oldVal as number) || 0;
        if (typeof value === 'string') {
          const cleaned = value.trim();
          if (cleaned.startsWith('+') && cleaned.length > 1) {
            const val = parseInt(cleaned.substring(1));
            finalValue = isNaN(val) ? current : current + val;
          } else if (cleaned.startsWith('-') && cleaned.length > 1) {
            const val = parseInt(cleaned.substring(1));
            finalValue = isNaN(val) ? current : current - val;
          } else {
            const val = parseInt(cleaned);
            finalValue = isNaN(val) ? current : val;
          }
        } else if (typeof value === 'number') {
          finalValue = value;
        }
        
        // Giới hạn trong khoảng 0-1000 cho các chỉ số quan hệ (trừ age)
        if (k !== 'age') {
          finalValue = Math.max(0, Math.min(1000, finalValue as number));
        }
      }

      // Trộn customFields thay vì ghi đè
      if (k === 'customFields' && Array.isArray(value)) {
        const mergedCustomFields = [...(oldNpc.customFields || [])];
        value.forEach(newField => {
          if (!newField || !newField.label) return;
          const existingIdx = mergedCustomFields.findIndex(f => f.label === newField.label);
          if (existingIdx > -1) {
            const oldValField = mergedCustomFields[existingIdx].value;
            if (isValidValue(newField.value) || !isValidValue(oldValField)) {
              mergedCustomFields[existingIdx] = { ...mergedCustomFields[existingIdx], ...newField };
            }
          } else if (isValidValue(newField.value)) {
            mergedCustomFields.push(newField);
          }
        });
        finalValue = mergedCustomFields;
      }

      if (finalValue !== oldVal) {
        // Bảo vệ dữ liệu hợp lệ: Không cho phép ghi đè một giá trị hợp lệ bằng một placeholder (??, Chưa rõ, v.v.)
        if (isValidValue(oldVal) && !isValidValue(finalValue)) {
          console.warn(`[NPC DATA PROTECTION] Skipping update for ${oldNpc.name} field "${k}": "${oldVal}" -> "${finalValue}" (Placeholder rejected)`);
          return;
        }

        // Nếu cả hai đều không hợp lệ, nhưng giá trị mới là rỗng hoặc null, thì không cập nhật (giữ nguyên placeholder cũ)
        if (!isValidValue(oldVal) && !isValidValue(finalValue)) {
          return;
        }

        // Check if it's a new valid value replacing a placeholder
        if (!isValidValue(oldVal) && isValidValue(finalValue)) {
          if (!newFields.includes(k)) newFields.push(k);
        }

        // Normalize arrays of objects
        if (k === 'skills' || k === 'inventory') {
          finalValue = normalizeObjectArray(finalValue as any[]);
        }
        if (k === 'network') {
          finalValue = normalizeNetworkArray(finalValue as any[]);
        }
        if (k === 'conditions') {
          finalValue = normalizeConditionsArray(finalValue as any[]);
        }
        // Ghi nhận thay đổi để hiển thị Diff trong UI
        if (typeof finalValue !== 'object' || Array.isArray(finalValue)) {
          changes[k] = { old: oldVal, new: finalValue };
        }
        (result as any)[k] = finalValue;
      }
    }
  });

  // Trộn BodyDescription riêng biệt
  if (newNpc.bodyDescription) {
    const mergedBody = { ...(result.bodyDescription || {}) };
    Object.entries(newNpc.bodyDescription).forEach(([key, value]) => {
      const k = key as keyof BodyDescription;
      const oldVal = mergedBody[k];

      // Kiểm tra xem trường body này có bị khóa không
      if (oldNpc.lockedFields?.includes(`body_${k}`)) {
        return;
      }

      if (value !== undefined && value !== null && value !== oldVal) {
        // Bảo vệ dữ liệu hợp lệ của cơ thể
        if (isValidValue(oldVal) && !isValidValue(value)) {
          return;
        }

        // Nếu cả hai đều không hợp lệ, nhưng giá trị mới là rỗng hoặc null, thì không cập nhật
        if (!isValidValue(oldVal) && !isValidValue(value)) {
          return;
        }

        if (!isValidValue(oldVal) && isValidValue(value)) {
          const fieldKey = `body_${k}`;
          if (!newFields.includes(fieldKey)) newFields.push(fieldKey);
        }
        changes[`body_${k}`] = { old: oldVal, new: value };
        (mergedBody as any)[k] = value;
      }
    });
    result.bodyDescription = mergedBody;
  }

  // Xác định sự hiện diện dựa trên văn bản dẫn truyện
  const narratorMentions = oldNpc.name ? narratorText.includes(oldNpc.name) : false;
  result.isPresent = newNpc.isPresent !== undefined ? newNpc.isPresent : narratorMentions;
  result.lastChanges = changes;
  result.newFields = newFields;

  return result;
};

/**
 * Đồng bộ hóa các mối quan hệ đối xứng (Bidirectional Sync)
 * Ví dụ: Nếu A là "Mẹ" của B, thì B phải là "Con" của A.
 */
export const syncBidirectionalRelationships = (npcs: Relationship[], mcName: string): Relationship[] => {
  const updatedNpcs = [...npcs];
  const mcId = "mc_player";

  // Bản đồ các mối quan hệ đối xứng
  const reciprocalMap: Record<string, string> = {
    "Mẹ": "Con",
    "Cha": "Con",
    "Bố": "Con",
    "Ba": "Con",
    "Mẹ kế": "Con riêng",
    "Cha dượng": "Con riêng",
    "Con": "Cha/Mẹ",
    "Con trai": "Cha/Mẹ",
    "Con gái": "Cha/Mẹ",
    "Chị gái": "Em",
    "Em gái": "Anh/Chị",
    "Anh trai": "Em",
    "Em trai": "Anh/Chị",
    "Em": "Anh/Chị",
    "Anh": "Em",
    "Chị": "Em",
    "Vợ": "Chồng",
    "Chồng": "Vợ",
    "Người yêu": "Người yêu",
    "Bạn thân": "Bạn thân",
    "Bạn": "Bạn",
    "Kẻ thù": "Kẻ thù",
    "Chủ nhân": "Nô lệ/Hầu gái",
    "Nô lệ": "Chủ nhân",
    "Hầu gái": "Chủ nhân",
    "Sư phụ": "Đồ đệ",
    "Đồ đệ": "Sư phụ",
    "Cô": "Cháu",
    "Dì": "Cháu",
    "Chú": "Cháu",
    "Bác": "Cháu",
    "Cháu": "Cô/Dì/Chú/Bác",
    "Ông": "Cháu",
    "Bà": "Cháu",
  };

  const getReciprocal = (relation: string, gender?: string): string => {
    const base = reciprocalMap[relation] || relation;
    if (base === "Con") {
      return gender === "Nữ" ? "Con gái" : "Con trai";
    }
    if (base === "Em") {
      return gender === "Nữ" ? "Em gái" : "Em trai";
    }
    if (base === "Anh/Chị") {
      return gender === "Nữ" ? "Chị gái" : "Anh trai";
    }
    if (base === "Cha/Mẹ") {
      return gender === "Nữ" ? "Mẹ" : "Cha";
    }
    return base;
  };

  // 1. Đồng bộ hóa quan hệ của NPC với MC
  updatedNpcs.forEach(npc => {
    if (!npc.network) npc.network = [];
    
    // Tìm quan hệ của NPC này với MC
    const mcRelationIdx = npc.network.findIndex(net => net.npcId === mcId);
    if (mcRelationIdx > -1) {
      const relationToMc = npc.network[mcRelationIdx].relation;
      // Có thể thêm logic ở đây nếu cần đồng bộ ngược lại vào MC (nhưng MC stats được quản lý riêng)
    }
  });

  // 2. Đồng bộ hóa quan hệ giữa các NPC với nhau
  for (let i = 0; i < updatedNpcs.length; i++) {
    const npcI = updatedNpcs[i];
    if (!npcI.network) continue;

    npcI.network.forEach(net => {
      const targetNpcId = net.npcId;
      if (targetNpcId === mcId) return;

      const targetNpcIdx = updatedNpcs.findIndex(n => n.id === targetNpcId);
      if (targetNpcIdx > -1) {
        const npcJ = updatedNpcs[targetNpcIdx];
        if (!npcJ.network) npcJ.network = [];

        // Kiểm tra xem NPC J đã có quan hệ ngược lại với NPC I chưa
        const reverseIdx = npcJ.network.findIndex(n => n.npcId === npcI.id);
        if (reverseIdx === -1) {
          // Thêm quan hệ đối xứng
          npcJ.network.push({
            npcId: npcI.id,
            npcName: npcI.name,
            relation: getReciprocal(net.relation, npcI.gender),
            affinity: net.affinity || 500
          });
        }
      }
    });
  }

  return updatedNpcs;
};

function renderSafeText(data: any): string {
  if (!data) return "";
  if (typeof data === 'string') return data;
  return String(data);
}
