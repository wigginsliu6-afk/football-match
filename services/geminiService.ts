
import { GoogleGenAI } from "@google/genai";
import { Match, SearchResult, ApiSettings } from "../types";

/**
 * 获取并清洗 API Key (环境变量作为后备)
 */
const getCleanEnvApiKey = (): string => {
  let key = "";
  try {
    key = process.env.API_KEY || (window as any).process?.env?.API_KEY || "";
  } catch (e) {
    key = "";
  }
  return key.trim().replace(/^["']|["']$/g, "");
};

/**
 * Fetch match schedules using Gemini API with configurable settings.
 */
export const fetchMatchesWithGemini = async (teams: string[], settings?: ApiSettings): Promise<SearchResult> => {
  // 1. 确定 API Key：优先使用设置中的 Key，其次使用环境变量
  const envKey = getCleanEnvApiKey();
  const finalApiKey = settings?.apiKey ? settings.apiKey.trim() : envKey;

  // 2. 确定 Base URL (代理地址)
  const baseUrl = settings?.baseUrl ? settings.baseUrl.trim() : undefined;

  // 3. 校验 Key
  if (!finalApiKey || finalApiKey === "undefined" || finalApiKey.length < 10) {
    const debugInfo = `(Key状态: ${!finalApiKey ? '空' : '无效'}, 来源: ${settings?.apiKey ? '自定义' : '环境变量'})`;
    throw new Error(`API_KEY_MISSING_OR_INVALID|${debugInfo}`);
  }

  try {
    // 4. 初始化 SDK，支持 Base URL
    const clientOptions: any = { apiKey: finalApiKey };
    if (baseUrl) {
      // 移除末尾的斜杠，防止路径拼接错误
      clientOptions.baseUrl = baseUrl.replace(/\/$/, "");
    }

    const ai = new GoogleGenAI(clientOptions);
    const teamsStr = teams.join(", ");
    
    // 获取当前北京时间
    const now = new Date();
    const beijingNowStr = now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
    
    // 5. 根据设置决定是否开启搜索工具
    // 默认为开启 (undefined 视为 true)
    const useSearch = settings?.useSearchGrounding !== false;
    const tools = useSearch ? [{ googleSearch: {} }] : undefined;

    const prompt = `
      当前北京时间是：${beijingNowStr}。
      
      请务必查找以下足球队在未来 30 天（从现在开始计算的一个月内）的所有官方比赛赛程：${teamsStr}。
      
      【重要要求】：
      1. 必须包含该球队作为“主队”或“客队”的所有比赛。
      ${useSearch ? '2. 必须使用 Google Search 工具来验证赛程的准确性。' : '2. 请基于你已有的知识库回答。'}
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
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: tools,
      },
    });

    const rawText = response.text || "";
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
          const timeString = m.beijingTime.replace(/-/g, '/');
          const timestamp = new Date(`${timeString} GMT+0800`).getTime();
          
          return {
            ...m,
            id: `${m.homeTeam}-${m.awayTeam}-${idx}-${Date.now()}`,
            timestamp: isNaN(timestamp) ? 0 : timestamp
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
    const keyHint = finalApiKey ? `${finalApiKey.substring(0, 4)}...${finalApiKey.substring(finalApiKey.length - 4)}` : 'none';
    const enhancedError = new Error(error.message || "Unknown API Error");
    (enhancedError as any).status = error.status;
    (enhancedError as any).keyHint = keyHint;
    (enhancedError as any).keyLength = finalApiKey.length;
    (enhancedError as any).usingProxy = !!baseUrl;
    
    console.error("Gemini API Error Detail:", {
      status: error.status,
      message: error.message,
      keyHint,
      usingProxy: !!baseUrl
    });
    throw enhancedError;
  }
};
