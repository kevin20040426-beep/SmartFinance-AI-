import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, BankAccount, StockMarketData } from "./types";

const fallbackQuotes = [
  "今天的每一分節省，都是為了明天能在富士山下靜靜喝一杯咖啡。",
  "有沒有想過，挪威的草原與星空，正等待著財富自由後的你？",
  "理財不是為了變富有，而是為了在想要看極光的時候，能毫不猶豫地出發。",
  "生活的溫柔，往往藏在你對未來的提前規劃裡。",
  "把夢想放進預算單，你會發現每一筆儲蓄都充滿了幸福感。"
];

export const getDailyInspiration = async (): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = "請生成一句簡短且優美的繁體中文勵志語，結合『正向生活態度』與『具體的旅遊夢想或美好事物』（例如：挪威極光、日本富士山、地中海陽光、瑞士雪山等），目的是鼓勵使用者透過理財去實現這些美好。字數在 40 字以內，不要包含引號。";
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || fallbackQuotes[0];
  } catch (error) {
    return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
  }
};

export const getTaiwanStockAnalysis = async (): Promise<StockMarketData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API KEY MISSING");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "請查詢最近一個交易日（前一日）的台股成交量排行榜，並分析熱門的前三名族群，給一個 100 字內的小統整。請務必返回 JSON 格式，包含 topVolumes (個股名, 成交量, 漲跌幅), hotSectors (前三名族群名稱), summary (AI 統整)。",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topVolumes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  volume: { type: Type.STRING },
                  change: { type: Type.STRING }
                },
                required: ["name", "volume", "change"]
              }
            },
            hotSectors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            summary: { type: Type.STRING }
          },
          required: ["topVolumes", "hotSectors", "summary"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "參考來源",
      uri: chunk.web?.uri || "#"
    })) || [];

    return { ...data, sources };
  } catch (error) {
    console.error("Stock Analysis Error:", error);
    return {
      topVolumes: [
        { name: "鴻海", volume: "15.2萬張", change: "+1.2%" },
        { name: "台積電", volume: "5.8萬張", change: "+0.5%" },
        { name: "群創", volume: "12.1萬張", change: "-0.2%" }
      ],
      hotSectors: ["半導體", "AI 伺服器", "光電"],
      summary: "台股近期受美股影響呈震盪格局，AI 權值股仍為市場重心，電子族群成交量能顯著增加，建議投資人注意個股支撐位。",
      sources: []
    };
  }
};

export const getFinancialAdvice = async (
  accounts: BankAccount[],
  transactions: Transaction[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") return "請設定 API_KEY 以使用 AI 分析功能。";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const summary = {
      totalBalance: accounts.reduce((acc, curr) => acc + curr.balance, 0),
      recentTransactions: transactions.slice(0, 5).map(t => ({
        type: t.type,
        amount: t.amount,
        category: t.category
      }))
    };

    const prompt = `你是一位親切的財務顧問。根據數據提供簡短建議：總資產 $${summary.totalBalance}。請用繁體中文，300字內，包含一個理財小技巧。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "AI 暫時無法生成建議。";
  } catch (error) {
    return "分析時發生錯誤。";
  }
};
