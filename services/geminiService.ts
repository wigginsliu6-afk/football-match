
import { GoogleGenAI } from "@google/genai";
import { Match, SearchResult } from "../types";

export const fetchMatchesWithGemini = async (teams: string[]): Promise<SearchResult> => {
  // 回退：直接使用 process.env.API_KEY
  // index.tsx 中的 polyfill 会负责将 VITE_API_KEY 注入到这里
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key 未找到。请检查环境变量设置。");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const teamsStr = teams.join(", ");
  
  // 获取当前北京时间供模型参考
  const now = new Date();
  const beijingNowStr = now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
  
  const prompt = `
    当前北京时间是：${beijingNowStr}。
    
    请务必查找以下足球队在未来 30 天（从现在开始计算的一个月内）的所有官方比赛赛程：${teamsStr}。
    
    【重要要求】：
    1. 必须包含该球队作为“主队”或“客队”的所有比赛。
    2. 必须使用 Google Search 工具来验证赛程的准确性。
    3. 返回的 JSON 数据中，时间必须转换为北京时间，格式严格为 "YYYY-MM-DD HH:mm" (例如 "2024-05-20 20:00")。
    
    请首先以自然语言简要总结赛程看点，然后**必须**在最后附上一个 JSON 代码块。JSON 格式如下：
    \`\`\`json
    [
      {
        "homeTeam": "主队中文名",
        "awayTeam": "客队中文名",
        "competition": "赛事名称(如英超)",
        "beijingTime": "2024-05-20 20:00"
      }
    ]
    \`\`\`
    如果不返回 JSON 块，我无法处理数据。
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
    // 安全获取 Grounding 来源
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "来源链接",
      uri: chunk.web?.uri || "#",
    })).filter((s: any) => s.uri !== "#") || [];

    const jsonMatch = rawText.match(/```json\s+([\s\S]*?)\s+```/);
    let matches: Match[] = [];
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        matches = parsed.map((m: any, idx: number) => {
          // 确保时间字符串按北京时间解析，替换 - 为 / 以兼容部分浏览器
          const timeString = m.beijingTime.replace(/-/g, '/');
          const timestamp = new Date(`${timeString} GMT+0800`).getTime();
          
          return {
            ...m,
            id: `${m.homeTeam}-${m.awayTeam}-${idx}-${Date.now()}`, // 增加随机性防止 key 重复
            timestamp: isNaN(timestamp) ? 0 : timestamp // 防止无效日期
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
  } catch (error: any) {
    console.error("Gemini API Error Full Details:", error);
    throw error;
  }
};
