
import { GoogleGenAI } from "@google/genai";
import { GameLog, MemoryEntry, MemoryState, AiModel, AppSettings } from "../types";
import { embeddingService } from "./embeddingService";

export class MemoryService {
  private state: MemoryState = {
    worldSummary: "Câu chuyện vừa bắt đầu.",
    chronicle: "",
    memories: [],
    lastSummarizedTurn: 0,
    lastCondensedTurn: 0,
  };

  /**
   * Cập nhật bộ nhớ dựa trên logs mới
   * Sử dụng AI để trích xuất các "atomic memories" (sự kiện/sự thật nguyên tử)
   */
  public async updateMemory(logs: GameLog[], turn: number, force: boolean = false, settings?: AppSettings): Promise<void> {
    // Chỉ chạy khi có lệnh force HOẶC khi đạt đúng mốc 20 lượt (20, 40, 60...)
    // Không chạy ở lượt 0 hoặc 1 để tránh tiêu tốn API lúc khởi đầu
    if (!force && (turn < 20 || turn % 20 !== 0)) return;

    let apiKeyToUse = process.env.GEMINI_API_KEY || (process.env as any).API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    
    if (settings?.userApiKeys && settings.userApiKeys.length > 0) {
      // Use the first available user key if system key is missing or as an alternative
      apiKeyToUse = settings.userApiKeys[0];
    }

    if (!apiKeyToUse) {
      throw new Error("API key must be set when using the Gemini API. Please check your settings.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    const recentLogs = logs.slice(-20).map(l => `[${l.type.toUpperCase()}] ${l.content}`).join("\n");

    const extractionPrompt = `
      Bạn là một "Quantum Memory Manager". Nhiệm vụ của bạn là trích xuất các ký ức quan trọng từ nhật ký game RPG dưới đây.
      
      NHẬT KÝ GẦN ĐÂY:
      ${recentLogs}

      KÝ ỨC HIỆN TẠI (TÓM TẮT):
      ${this.state.worldSummary}

      HÃY TRÍCH XUẤT:
      1. Các sự thật (Facts): Về thế giới, địa điểm, quy luật, hoặc thông tin mới về nhân vật.
      2. Sự kiện (Events): Những hành động, cuộc hội thoại hoặc biến cố vừa xảy ra.
      3. Mối quan hệ (Relationships): Thay đổi trong tình cảm, thái độ hoặc thông tin về NPC.
      4. Sở thích/Thói quen (Preferences): Của MC hoặc NPC.

      TIÊU CHÍ CHẤM ĐIỂM QUAN TRỌNG (importance 1-100):
      - 90-100: Biến cố cực lớn, thay đổi vĩnh viễn thế giới hoặc vận mệnh nhân vật chính, cái chết của NPC quan trọng.
      - 70-89: Sự kiện quan trọng, gặp NPC mới có tên tuổi, thay đổi lớn trong quan hệ, hoàn thành nhiệm vụ lớn.
      - 40-69: Thông tin hữu ích, hội thoại có chiều sâu, khám phá địa điểm mới, vật phẩm hiếm.
      - 20-39: Chi tiết nhỏ, thói quen, sở thích, thông tin bổ trợ bối cảnh.
      - < 20: Thông tin vụn vặt, không đáng lưu trữ lâu dài.

      YÊU CẦU:
      - Trích xuất các thông tin giúp xây dựng bối cảnh và tính cách nhân vật.
      - Mỗi ký ức phải là một câu khẳng định ngắn gọn, độc lập.
      - Nếu lượt vừa qua không có thông tin gì mới đáng kể, hãy để "extractedMemories" là mảng rỗng [].

      TRẢ VỀ JSON (VÀ CHỈ JSON):
      {
        "newWorldSummary": "Bản tóm tắt thế giới mới. Phải bao gồm: Địa điểm hiện tại, mục tiêu ngắn hạn của MC, các NPC quan trọng đang có mặt, và tình trạng cốt truyện chính. (Ngắn gọn < 150 từ)",
        "extractedMemories": [
          { 
            "content": "Nội dung ký ức", 
            "type": "fact/event/relationship/preference", 
            "importance": 1-100,
            "reasoning": "Giải thích ngắn gọn tại sao chấm điểm này"
          }
        ]
      }
    `;

    try {
      let responseText = "";
      const flashModels = [
        AiModel.FLASH_3,
        AiModel.FLASH_25,
      ];

      let lastError = null;
      for (const modelName of flashModels) {
        try {
          
          // Ưu tiên Proxy nếu được bật
          if (settings?.proxyEnabled && settings?.proxyUrl && settings?.proxyKey) {
            const proxyResponse = await fetch(settings.proxyUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.proxyKey}`
              },
              body: JSON.stringify({
                model: settings.proxyModel || modelName,
                messages: [
                  { role: 'system', content: 'Bạn là một trợ lý trích xuất ký ức chuyên nghiệp.' },
                  { role: 'user', content: extractionPrompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
              })
            });

            if (!proxyResponse.ok) {
              throw new Error(`Proxy error: ${proxyResponse.statusText}`);
            }

            const data = await proxyResponse.json();
            responseText = data.choices?.[0]?.message?.content || data.text || "";
          } else {
            // Sử dụng API Key trực tiếp
            const response = await ai.models.generateContent({
              model: modelName,
              contents: extractionPrompt,
              config: { responseMimeType: "application/json" }
            });
            responseText = response.text || "";
          }

          if (responseText) {
            break; 
          }
        } catch (err) {
          console.warn(`[SEMANTIC_MEMORY]: ${modelName} failed, trying next fallback...`, err);
          lastError = err;
          continue;
        }
      }

      if (!responseText && lastError) {
        throw lastError;
      }

      if (responseText) {
        const jsonStr = this.extractValidJson(responseText);
        const result = JSON.parse(jsonStr);
        
        this.state.worldSummary = result.newWorldSummary || this.state.worldSummary;
        this.state.lastSummarizedTurn = turn;

        // Tự động cô đọng biên niên sử mỗi 100 lượt
            if (turn > 0 && turn % 100 === 0 && turn !== this.state.lastCondensedTurn) {
          await this.condenseHistory(logs, turn, settings);
        }

        if (result.extractedMemories && Array.isArray(result.extractedMemories)) {
          for (const mem of result.extractedMemories) {
            if (mem && mem.content) {
              await this.upsertMemory(mem.content, mem.type || 'event', mem.importance || 50, apiKeyToUse, mem.reasoning, settings);
            }
          }
        }

        // Tự động ghim ký ức trên 85 điểm và giữ lại ký ức trên 20 điểm
        this.state.memories = this.state.memories.filter(m => {
          if (m.metadata.importance > 85) {
            m.metadata.isPinned = true;
          }
          return m.metadata.importance >= 20;
        });

        // Giới hạn số lượng ký ức để tránh quá tải
        if (this.state.memories.length > 200) {
          // Ưu tiên giữ lại ký ức được ghim, sau đó là quan trọng, sau đó là mới nhất
          this.state.memories.sort((a, b) => {
            if (a.metadata.isPinned && !b.metadata.isPinned) return -1;
            if (!a.metadata.isPinned && b.metadata.isPinned) return 1;
            const scoreA = (a.metadata.importance * 2) + (a.metadata.lastUpdated / 1000000000);
            const scoreB = (b.metadata.importance * 2) + (b.metadata.lastUpdated / 1000000000);
            return scoreB - scoreA;
          });
          this.state.memories = this.state.memories.slice(0, 200);
        }
      }
    } catch (e) {
      console.error("[SEMANTIC_MEMORY]: Update failed:", e);
      throw e; // Re-throw to allow UI to handle error
    }
  }

  private extractValidJson(text: string): string {
    const jsonRegex = /\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
    const matches = text.match(jsonRegex);
    if (matches && matches.length > 0) {
      return matches.reduce((a, b) => a.length > b.length ? a : b);
    }
    const simpleMatch = text.match(/\{[\s\S]*\}/);
    return simpleMatch ? simpleMatch[0] : text;
  }

  /**
   * Thêm hoặc cập nhật một ký ức dựa trên độ tương đồng ngữ nghĩa
   */
  private async upsertMemory(content: string, type: any, importance: number, apiKey?: string, reasoning?: string, settings?: AppSettings): Promise<void> {
    const embedding = await embeddingService.getEmbedding(content, apiKey, settings);
    
    // Tìm xem có ký ức nào tương tự không (để cập nhật thay vì thêm mới)
    let existingIdx = -1;
    let maxSim = 0;

    for (let i = 0; i < this.state.memories.length; i++) {
      const sim = embeddingService.cosineSimilarity(embedding, this.state.memories[i].embedding);
      if (sim > 0.92) { // Độ tương đồng rất cao, coi như cùng một chủ đề
        if (sim > maxSim) {
          maxSim = sim;
          existingIdx = i;
        }
      }
    }

    const now = Date.now();
    if (existingIdx > -1) {
      // Cập nhật ký ức cũ
      this.state.memories[existingIdx].content = content;
      this.state.memories[existingIdx].embedding = embedding;
      this.state.memories[existingIdx].metadata.lastUpdated = now;
      this.state.memories[existingIdx].metadata.importance = Math.max(this.state.memories[existingIdx].metadata.importance, importance);
      if (reasoning) this.state.memories[existingIdx].metadata.reasoning = reasoning;
    } else {
      // Thêm ký ức mới
      this.state.memories.push({
        id: Math.random().toString(36).substring(2, 11),
        content,
        embedding,
        metadata: {
          type,
          importance,
          reasoning,
          timestamp: now,
          lastUpdated: now,
        }
      });
    }
  }

  /**
   * Lấy ngữ cảnh bộ nhớ dựa trên hành động hiện tại
   */
  public getMemoryContext(actionEmbedding?: number[]): string {
    let relevantMemories: string[] = [];
    
    if (actionEmbedding && actionEmbedding.length > 0 && this.state.memories.length > 0) {
      const scored = this.state.memories.map(m => ({
        content: m.content,
        score: embeddingService.cosineSimilarity(actionEmbedding, m.embedding)
      }));

      // Lấy top 8 ký ức liên quan nhất, lọc theo ngưỡng 0.6
      const filtered = scored
        .sort((a, b) => b.score - a.score)
        .filter(m => m.score > 0.6);

      // Nếu không có cái nào trên 0.6, lấy top 3 cái cao nhất bất kể điểm số
      relevantMemories = (filtered.length > 0 ? filtered.slice(0, 8) : scored.sort((a, b) => b.score - a.score).slice(0, 3))
        .map(m => `- ${m.content}`);
    }

    return `
      [ WORLD SUMMARY ]:
      ${this.state.worldSummary}

      [ WORLD CHRONICLE (LONG-TERM HISTORY) ]:
      ${this.state.chronicle || "Chưa có biên niên sử dài hạn."}

      [ RELEVANT SEMANTIC MEMORIES ]:
      ${relevantMemories.length > 0 ? relevantMemories.join("\n") : "Không có ký ức liên quan trực tiếp."}
    `;
  }

    /**
   * Cô đọng lịch sử 100 lượt gần nhất vào Biên niên sử (Chronicle)
   * Yêu cầu hoàn thành cơ chế này mới có thể chơi tiếp (Blocking)
   * Hỗ trợ Proxy và cơ chế thử lại vô hạn
   */
  private async condenseHistory(logs: GameLog[], turn: number, settings?: AppSettings): Promise<void> {
    const startTurn = this.state.lastCondensedTurn || 0;
    const endTurn = turn;
    
    // Lấy tất cả các bản tóm tắt từ lượt startTurn đến endTurn
    const summariesToCondense = logs
      .filter(l => l.type === 'narrator' && l.summary)
      .slice(startTurn, endTurn)
      .map((l, i) => `[Lượt ${startTurn + i + 1}]: ${l.summary}`)
      .join("\n");

    if (!summariesToCondense) return;

    const prompt = `
      Bạn là một "Chronicle Weaver" chuyên nghiệp. Nhiệm vụ của bạn là cô đọng 100 lượt chơi vừa qua thành một đoạn văn ngắn gọn nhưng đầy đủ các sự kiện quan trọng nhất.
      
      CÁC BẢN TÓM TẮT CHI TIẾT:
      ${summariesToCondense}

      YÊU CẦU:
      1. Viết một đoạn văn duy nhất (khoảng 150-200 từ).
      2. Tập trung vào: Diễn biến chính, sự thay đổi quan trọng của nhân vật, và kết quả cuối cùng của giai đoạn này.
      3. Giữ giọng văn kể chuyện, khách quan, súc tích.
      4. Ngôn ngữ: Tiếng Việt.

      HÃY TRẢ VỀ CHỈ ĐOẠN VĂN CÔ ĐỌNG.
    `;

    const modelToUse = AiModel.FLASH_3;
    const tempToUse = 0.3; // Tối ưu cho tóm tắt (giảm thiểu sáng tạo quá đà, giữ tính xác thực)

    let retryCount = 0;
    while (true) {
      try {
        
        let condensedText = "";

        // Ưu tiên Proxy nếu được bật
        if (settings?.proxyEnabled && settings?.proxyUrl && settings?.proxyKey) {
          const proxyResponse = await fetch(settings.proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.proxyKey}`
            },
            body: JSON.stringify({
              model: settings.proxyModel || modelToUse,
              messages: [
                { role: 'system', content: 'Bạn là một trợ lý tóm tắt lịch sử game chuyên nghiệp.' },
                { role: 'user', content: prompt }
              ],
              temperature: tempToUse
            })
          });

          if (!proxyResponse.ok) {
            throw new Error(`Proxy error: ${proxyResponse.statusText}`);
          }

          const data = await proxyResponse.json();
          condensedText = data.choices?.[0]?.message?.content || data.text || "";
        } else {
          // Sử dụng API Key trực tiếp
          let apiKey = process.env.GEMINI_API_KEY || (process.env as any).API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
          if (settings?.userApiKeys && settings.userApiKeys.length > 0) {
            apiKey = settings.userApiKeys[0];
          }

          if (!apiKey) throw new Error("No API Key available for condensation.");

          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: modelToUse,
            contents: [{ parts: [{ text: prompt }] }],
            config: { temperature: tempToUse }
          });
          condensedText = response.text?.trim() || "";
        }

        if (condensedText) {
          const timestamp = new Date().toLocaleDateString('vi-VN');
          const newEntry = `\n\n[ GIAI ĐOẠN LƯỢT ${startTurn + 1} - ${endTurn} (${timestamp}) ]\n${condensedText}`;
          this.state.chronicle = (this.state.chronicle || "") + newEntry;
          this.state.lastCondensedTurn = endTurn;
          return; // Thoát vòng lặp khi thành công
        } else {
          throw new Error("AI returned empty response for chronicle.");
        }
      } catch (e: any) {
        retryCount++;
        
        // Cơ chế thử lại vô hạn với delay tăng dần (max 10s)
        const delay = Math.min(1000 * retryCount, 10000);
        await new Promise(r => setTimeout(r, delay));
        
        // Nếu lỗi quá nhiều, log ra để người dùng biết hệ thống vẫn đang cố gắng
        if (retryCount % 5 === 0) {
          // Silent retry
        }
      }
    }
  }

  public setState(state: MemoryState) {
    // Đảm bảo cấu trúc dữ liệu cũ vẫn tương thích nếu có
    this.state = {
      worldSummary: state.worldSummary || "Câu chuyện vừa bắt đầu.",
      chronicle: state.chronicle || "",
      memories: state.memories || [],
      lastSummarizedTurn: state.lastSummarizedTurn || 0,
      lastCondensedTurn: state.lastCondensedTurn || 0,
    };
  }

  public getState(): MemoryState {
    return this.state;
  }

  public deleteMemory(id: string): void {
    this.state.memories = this.state.memories.filter(m => m.id !== id);
  }

  public togglePin(id: string): void {
    const mem = this.state.memories.find(m => m.id === id);
    if (mem) {
      mem.metadata.isPinned = !mem.metadata.isPinned;
    }
  }

  public bulkDelete(filter: (m: MemoryEntry) => boolean): void {
    this.state.memories = this.state.memories.filter(m => !filter(m));
  }
}

export const memoryService = new MemoryService();
