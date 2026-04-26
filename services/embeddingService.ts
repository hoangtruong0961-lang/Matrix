
import { GoogleGenAI } from "@google/genai";
import { AppSettings } from "../types";

export class EmbeddingService {
  private ai: GoogleGenAI | null = null;

  private getAi(providedKey?: string): GoogleGenAI {
    const apiKey = providedKey || process.env.GEMINI_API_KEY || (process.env as any).API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set for EmbeddingService");
    }
    // Always create a new instance if a key is provided to ensure we use the latest one
    if (providedKey || !this.ai) {
      return new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  /**
   * Generates an embedding for the given text using gemini-embedding-2-preview.
   * Falls back to gemini-embedding-001 if the primary model fails.
   */
  public async getEmbedding(text: string, apiKey?: string, settings?: AppSettings): Promise<number[]> {
    const primaryModel = "gemini-embedding-2-preview";
    const fallbackModel = "gemini-embedding-001";

    try {
      // Ưu tiên Proxy nếu được bật
      if (settings?.proxyEnabled && settings?.proxyUrl && settings?.proxyKey) {
        return await this.getEmbeddingViaProxy(text, settings.proxyModel || primaryModel, settings);
      }

      const ai = this.getAi(apiKey);
      const result = await ai.models.embedContent({
        model: primaryModel,
        contents: [{ parts: [{ text }] }]
      });
      return result.embeddings[0].values;
    } catch (error) {
      console.warn(`Primary embedding model ${primaryModel} failed, falling back to ${fallbackModel}:`, error);
      try {
        if (settings?.proxyEnabled && settings?.proxyUrl && settings?.proxyKey) {
          return await this.getEmbeddingViaProxy(text, fallbackModel, settings);
        }

        const ai = this.getAi(apiKey);
        const fallbackResult = await ai.models.embedContent({
          model: fallbackModel,
          contents: [{ parts: [{ text }] }]
        });
        return fallbackResult.embeddings[0].values;
      } catch (fallbackError) {
        console.error("Fallback embedding model also failed:", fallbackError);
        return new Array(768).fill(0); 
      }
    }
  }

  private async getEmbeddingViaProxy(text: string, model: string, settings: AppSettings): Promise<number[]> {
    // Lưu ý: Một số proxy có thể không hỗ trợ endpoint /v1/embeddings hoặc có format khác.
    // Giả định proxy hỗ trợ OpenAI-compatible embeddings endpoint.
    const baseUrl = settings.proxyUrl.replace(/\/chat\/completions$/, '').replace(/\/completions$/, '');
    const embeddingUrl = baseUrl.endsWith('/embeddings') ? baseUrl : `${baseUrl}/embeddings`;

    const response = await fetch(embeddingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.proxyKey}`
      },
      body: JSON.stringify({
        model: model,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`Proxy embedding error: ${response.statusText}`);
    }

    const data = await response.json();
    // OpenAI format: data[0].embedding
    if (data.data && data.data[0] && data.data[0].embedding) {
      return data.data[0].embedding;
    }
    // Gemini format via proxy might vary, check for common patterns
    if (data.embeddings && data.embeddings[0] && data.embeddings[0].values) {
      return data.embeddings[0].values;
    }
    
    throw new Error("Unknown embedding response format from proxy.");
  }

  /**
   * Generates a multimodal embedding (e.g., text + image).
   * Falls back to gemini-embedding-001 (text-only) if the primary model fails.
   */
  public async getMultimodalEmbedding(parts: any[], apiKey?: string, settings?: AppSettings): Promise<number[]> {
    const primaryModel = "gemini-embedding-2-preview";
    
    try {
      // Proxy cho multimodal embedding thường phức tạp hơn, tạm thời fallback về text-only nếu dùng proxy
      if (settings?.proxyEnabled && settings?.proxyUrl && settings?.proxyKey) {
        const textContent = parts.filter(p => p.text).map(p => p.text).join(" ");
        return await this.getEmbeddingViaProxy(textContent, settings.proxyModel || primaryModel, settings);
      }

      const ai = this.getAi(apiKey);
      const result = await ai.models.embedContent({
        model: primaryModel,
        contents: [{ parts }]
      });
      return result.embeddings[0].values;
    } catch (error) {
      console.warn("Primary multimodal embedding failed, falling back to text-only embedding:", error);
      try {
        const textContent = parts
          .filter(p => p.text)
          .map(p => p.text)
          .join(" ");
        
        if (!textContent) {
          console.error("No text content available for fallback embedding.");
          return new Array(768).fill(0);
        }

        return await this.getEmbedding(textContent, apiKey, settings);
      } catch (fallbackError) {
        console.error("Fallback multimodal embedding failed:", fallbackError);
        return new Array(768).fill(0);
      }
    }
  }

  /**
   * Calculates cosine similarity between two vectors.
   */
  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const embeddingService = new EmbeddingService();
