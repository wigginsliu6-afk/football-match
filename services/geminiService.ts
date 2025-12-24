
import { GoogleGenAI, Type } from "@google/genai";
import { Match, SearchResult } from "../types";

export const fetchMatchesWithGemini = async (teams: string[]): Promise<SearchResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const teamsStr = teams.join(", ");
  
  // 获取当前北京时间供模型参考
  const now = new Date();
  const beijingNowStr = now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
  
  const prompt = `
    当前北京时间是：${beijingNowStr}。
    
    请查找以下足球队在未来 30 天（从现在开始计算的一个月内）的所有比赛赛程：${teamsStr}。
    
    【重要要求】：
    1. 必须包含该球队作为“主队”或“客队”的所有比赛。
    2. 对于每一场比赛，请务必提供：
       - 比赛日期和时间（必须转换成北京时间，格式为 YYYY-MM-DD HH:mm）。
       - 主队名称。
       - 客队名称。
       - 赛事名称（如：英超、欧冠、德甲、亚洲杯等）。
    
    请首先以自然语言形式简要总结，然后必须在回复的最后提供一个 JSON 代码块，格式如下：
    \`\`\`json
    [
      {
        "homeTeam": "主队名",
        "awayTeam": "客队名",
        "competition": "赛事名",
        "beijingTime": "2024-05-20 20:00"
      }
    ]
    \`\`\`
    请确保使用 Google Search 工具来获取最实时、准确的官方赛程。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text || "";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "来源",
      uri: chunk.web?.uri || "#",
    })) || [];

    const jsonMatch = rawText.match(/```json\s+([\s\S]*?)\s+```/);
    let matches: Match[] = [];
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        matches = parsed.map((m: any, idx: number) => {
          // 确保时间字符串按北京时间解析
          const timestamp = new Date(m.beijingTime.replace(/-/g, '/') + " GMT+0800").getTime();
          return {
            ...m,
            id: `${m.homeTeam}-${m.awayTeam}-${idx}`,
            timestamp
          };
        });
      } catch (e) {
        console.error("JSON parsing failed", e);
      }
    }

    return {
      matches,
      sources,
      rawText
    };
  } catch (error) {
    console.error("Error fetching from Gemini:", error);
    throw error;
  }
};
