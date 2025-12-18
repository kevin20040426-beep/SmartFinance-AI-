
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  color: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
  date: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
}

export type View = 'dashboard' | 'accounts' | 'transactions' | 'reports';

export const DEFAULT_CATEGORIES = [
  '飲食', '交通', '薪資', '獎金', '購物', '房租', '醫療', '教育', '投資', '娛樂', '其他'
];

export const ACCOUNT_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'
];
