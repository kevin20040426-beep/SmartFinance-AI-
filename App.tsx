
import React, { useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  CreditCard, 
  ArrowLeftRight, 
  PieChart, 
  LogOut, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  BrainCircuit,
  Loader2,
  Trash2,
  X
} from 'lucide-react';

import { auth, db, isOfflineMode } from './firebase';
import { 
  View, 
  BankAccount, 
  Transaction, 
  TransactionType, 
  DEFAULT_CATEGORIES, 
  ACCOUNT_COLORS 
} from './types';
import { getFinancialAdvice } from './geminiService';

// --- Sub-components (defined outside to avoid re-renders) ---

const AuthScreen: React.FC<{ 
  onToggle: () => void, 
  isLogin: boolean, 
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
  error: string 
}> = ({ onToggle, isLogin, onSubmit, error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-900 px-4">
    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-blue-100 p-3 rounded-full mb-4">
          <Wallet className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">SmartFinance AI</h1>
        <p className="text-gray-500">您的智慧財富管家</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">電子郵件</label>
          <input 
            name="email" 
            type="email" 
            required 
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="example@mail.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">密碼</label>
          <input 
            name="password" 
            type="password" 
            required 
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
        >
          {isLogin ? '立即登入' : '註冊帳號'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button 
          onClick={onToggle}
          className="text-sm text-blue-600 hover:underline"
        >
          {isLogin ? '還沒有帳號？點此註冊' : '已有帳號？返回登入'}
        </button>
      </div>
      
      {isOfflineMode && (
        <div className="mt-4 p-2 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200">
          注意：目前處於離線展示模式，資料將僅保存在本地或不持久化。
        </div>
      )}
    </div>
  </div>
);

const Sidebar: React.FC<{ 
  currentView: View, 
  setView: (v: View) => void, 
  onLogout: () => void,
  userEmail: string 
}> = ({ currentView, setView, onLogout, userEmail }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '總覽' },
    { id: 'accounts', icon: CreditCard, label: '帳戶管理' },
    { id: 'transactions', icon: ArrowLeftRight, label: '收支紀錄' },
    { id: 'reports', icon: PieChart, label: '統計報表' },
  ];

  return (
    <div className="w-64 bg-white h-screen flex flex-col border-r border-gray-200 hidden md:flex sticky top-0">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-xl tracking-tight">SmartFinance</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              currentView === item.id 
                ? 'bg-blue-50 text-blue-600 font-semibold' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="px-4 py-2 mb-4">
          <p className="text-xs text-gray-400 truncate">{userEmail}</p>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition"
        >
          <LogOut className="w-5 h-5" />
          登出
        </button>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState('');
  const [view, setView] = useState<View>('dashboard');
  
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Modal states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Sync Auth State
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Data from Firestore
  useEffect(() => {
    if (!user || !db) {
      // Offline/Demo data
      if (isOfflineMode || !db) {
        setAccounts([
          { id: '1', name: '預設現金', balance: 50000, color: 'bg-blue-500' },
          { id: '2', name: '台銀帳戶', balance: 120000, color: 'bg-green-500' }
        ]);
        setTransactions([
          { id: 't1', accountId: '1', amount: 150, type: TransactionType.EXPENSE, category: '飲食', note: '午餐', date: new Date().toISOString() },
          { id: 't2', accountId: '2', amount: 35000, type: TransactionType.INCOME, category: '薪資', note: '本月工資', date: new Date().toISOString() }
        ]);
      }
      return;
    }

    const qAccounts = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubscribeAccounts = onSnapshot(qAccounts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
      setAccounts(data);
    });

    const qTx = query(
      collection(db, 'transactions'), 
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(50)
    );
    const unsubscribeTx = onSnapshot(qTx, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
    });

    return () => {
      unsubscribeAccounts();
      unsubscribeTx();
    };
  }, [user]);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth) return;
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      setAuthError('');
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || '認證失敗，請檢查輸入資料。');
    }
  };

  const handleLogout = () => auth && signOut(auth);

  const addAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !db) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const balance = parseFloat(formData.get('balance') as string);
    const color = formData.get('color') as string;

    await addDoc(collection(db, 'accounts'), {
      name,
      balance,
      color,
      userId: user.uid,
      createdAt: new Date().toISOString()
    });
    setIsAccountModalOpen(false);
  };

  const deleteAccount = async (id: string) => {
    if (!db) return;
    if (confirm('確定要刪除此帳戶嗎？相關交易紀錄不會自動刪除。')) {
      await deleteDoc(doc(db, 'accounts', id));
    }
  };

  const addTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !db) return;
    const formData = new FormData(e.currentTarget);
    const accountId = formData.get('accountId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const type = formData.get('type') as TransactionType;
    const category = formData.get('category') as string;
    const note = formData.get('note') as string;
    const date = formData.get('date') as string;

    // Add TX
    await addDoc(collection(db, 'transactions'), {
      accountId,
      amount,
      type,
      category,
      note,
      date,
      userId: user.uid
    });

    // Update Account Balance
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      const newBalance = type === TransactionType.INCOME 
        ? account.balance + amount 
        : account.balance - amount;
      await updateDoc(doc(db, 'accounts', accountId), { balance: newBalance });
    }

    setIsTxModalOpen(false);
  };

  const askAI = async () => {
    setAiLoading(true);
    const advice = await getFinancialAdvice(accounts, transactions);
    setAiAdvice(advice);
    setAiLoading(false);
    setView('reports');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen 
        isLogin={isLoginView} 
        onToggle={() => setIsLoginView(!isLoginView)} 
        onSubmit={handleAuth} 
        error={authError} 
      />
    );
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const monthIncome = transactions
    .filter(t => t.type === TransactionType.INCOME && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        onLogout={handleLogout} 
        userEmail={user.email || ''} 
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* Dashboard View */}
          {view === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">早安，{user.email?.split('@')[0]}</h2>
                  <p className="text-gray-500">這是您目前的財務概況</p>
                </div>
                <button 
                  onClick={() => setIsTxModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  新增紀錄
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-sm mb-1">總資產</p>
                  <h3 className="text-3xl font-bold text-gray-900">${totalBalance.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">本月收入</p>
                    <h3 className="text-2xl font-bold text-green-600">+${monthIncome.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-green-50 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">本月支出</p>
                    <h3 className="text-2xl font-bold text-red-600">-${monthExpense.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-red-50 rounded-full">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-700">我的帳戶</h4>
                    <button onClick={() => setView('accounts')} className="text-sm text-blue-600">查看更多</button>
                  </div>
                  <div className="space-y-3">
                    {accounts.length === 0 && <p className="text-gray-400 italic">尚未新增帳戶</p>}
                    {accounts.slice(0, 3).map(acc => (
                      <div key={acc.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full ${acc.color}`}></div>
                        <div className="flex-1">
                          <p className="font-medium">{acc.name}</p>
                          <p className="text-sm text-gray-500">餘額</p>
                        </div>
                        <p className="font-bold text-lg">${acc.balance.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-700">最近交易</h4>
                    <button onClick={() => setView('transactions')} className="text-sm text-blue-600">查看更多</button>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                    {transactions.length === 0 && <p className="p-6 text-gray-400 italic">尚未有交易紀錄</p>}
                    {transactions.slice(0, 5).map(tx => (
                      <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition cursor-default">
                        <div>
                          <p className="font-medium">{tx.category}</p>
                          <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()} · {tx.note || '無備註'}</p>
                        </div>
                        <p className={`font-bold ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* AI Advisor Card */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-6 h-6" />
                    <h3 className="text-xl font-bold">AI 財務健檢</h3>
                  </div>
                  <p className="text-indigo-100 max-w-md">讓 Gemini 3 Pro 深度分析您的收支狀況，提供個性化的資產管理建議。</p>
                </div>
                <button 
                  onClick={askAI}
                  disabled={aiLoading}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  即刻分析
                </button>
              </div>
            </div>
          )}

          {/* Accounts View */}
          {view === 'accounts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">帳戶管理</h2>
                <button 
                  onClick={() => setIsAccountModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> 新增帳戶
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition relative group">
                    <button 
                      onClick={() => deleteAccount(acc.id)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className={`w-12 h-12 ${acc.color} rounded-full mb-4 flex items-center justify-center text-white`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold">{acc.name}</h3>
                    <p className="text-gray-500 text-sm mb-2">儲蓄帳戶</p>
                    <p className="text-2xl font-bold text-gray-900">${acc.balance.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions View */}
          {view === 'transactions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">收支紀錄</h2>
                <button 
                  onClick={() => setIsTxModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> 新增交易
                </button>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                    <tr>
                      <th className="px-6 py-4">日期</th>
                      <th className="px-6 py-4">分類</th>
                      <th className="px-6 py-4">帳戶</th>
                      <th className="px-6 py-4">備註</th>
                      <th className="px-6 py-4 text-right">金額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4"><span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">{tx.category}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-500">{accounts.find(a => a.id === tx.accountId)?.name || '未知'}</td>
                        <td className="px-6 py-4 text-sm italic text-gray-400">{tx.note || '-'}</td>
                        <td className={`px-6 py-4 text-right font-bold ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports View */}
          {view === 'reports' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">財務分析與 AI 建議</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h4 className="font-bold mb-4">收支比例分析</h4>
                  <div className="h-64 flex items-center justify-center">
                    {/* Placeholder for real charts if Recharts added, otherwise visual representation */}
                    <div className="flex gap-4 items-end h-40">
                      <div className="w-12 bg-green-500 rounded-t" style={{height: `${(monthIncome / (monthIncome + monthExpense)) * 100}%`}}></div>
                      <div className="w-12 bg-red-500 rounded-t" style={{height: `${(monthExpense / (monthIncome + monthExpense)) * 100}%`}}></div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> 收入</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> 支出</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h4 className="font-bold mb-4">分類支出排行</h4>
                  <div className="space-y-4">
                    {DEFAULT_CATEGORIES.slice(0, 4).map(cat => {
                      const amount = transactions
                        .filter(t => t.category === cat && t.type === TransactionType.EXPENSE)
                        .reduce((s, t) => s + t.amount, 0);
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{cat}</span>
                            <span>${amount.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{width: `${Math.min(100, (amount / monthExpense) * 100)}%`}}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {aiAdvice && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-indigo-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white">
                      <BrainCircuit className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Gemini AI 專業理財建議</h3>
                  </div>
                  <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {aiAdvice}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">新增銀行帳戶</h3>
              <button onClick={() => setIsAccountModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <form onSubmit={addAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳戶名稱</label>
                <input name="name" required className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如：台銀活期" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">初始餘額</label>
                <input name="balance" type="number" required className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">主題顏色</label>
                <div className="flex gap-2">
                  {ACCOUNT_COLORS.map(c => (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="color" value={c} defaultChecked={c === ACCOUNT_COLORS[0]} className="hidden peer" />
                      <div className={`w-8 h-8 rounded-full ${c} border-2 border-transparent peer-checked:border-black transition`}></div>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg">確認新增</button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">記錄一筆交易</h3>
              <button onClick={() => setIsTxModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <form onSubmit={addTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="type" value={TransactionType.EXPENSE} defaultChecked className="hidden peer" />
                  <div className="p-3 text-center rounded-xl border-2 border-gray-100 peer-checked:border-red-500 peer-checked:text-red-500 transition font-bold">支出</div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="type" value={TransactionType.INCOME} className="hidden peer" />
                  <div className="p-3 text-center rounded-xl border-2 border-gray-100 peer-checked:border-green-500 peer-checked:text-green-500 transition font-bold">收入</div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                <input name="amount" type="number" required className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">支付/收入帳戶</label>
                <select name="accountId" required className="w-full p-2 border border-gray-200 rounded-lg outline-none">
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                <select name="category" required className="w-full p-2 border border-gray-200 rounded-lg outline-none">
                  {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2 border border-gray-200 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                <input name="note" className="w-full p-2 border border-gray-200 rounded-lg outline-none" placeholder="寫點什麼..." />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg">保存紀錄</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
