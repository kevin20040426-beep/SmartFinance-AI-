import { GoogleGenAI } from "@google/genai";
import { Transaction, BankAccount } from "./types";

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