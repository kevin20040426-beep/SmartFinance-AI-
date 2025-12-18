
import { GoogleGenAI } from "@google/genai";
import { Transaction, BankAccount } from "./types";

export const getFinancialAdvice = async (
  accounts: BankAccount[],
  transactions: Transaction[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    return "系統未偵測到有效的 API KEY。請確保在環境變數中設定了 API_KEY。";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const summary = {
      totalBalance: accounts.reduce((acc, curr) => acc + curr.balance, 0),
      accountCount: accounts.length,
      recentTransactions: transactions.slice(0, 10).map(t => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date
      }))
    };

    const prompt = `
      你是一位專業的個人財務顧問。請根據以下使用者的財務數據提供精簡且具建設性的建議。
      數據摘要：
      - 總資產: $${summary.totalBalance}
      - 帳戶數量: ${summary.accountCount}
      - 最近 10 筆交易資料: ${JSON.stringify(summary.recentTransactions)}

      請針對以下幾點提供建議：
      1. 現有的消費模式是否有異常？
      2. 儲蓄或投資的優化建議。
      3. 一個具體的理財目標小撇步。
      請使用繁體中文，語氣親切且專業，字數控制在 300 字以內。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text || "AI 暫時無法生成建議，請稍後再試。";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "與 AI 服務連線時發生錯誤，請確認網路狀態或 API KEY 是否正確。";
  }
};
