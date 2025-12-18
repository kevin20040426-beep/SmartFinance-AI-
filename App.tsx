
import React, { useState, useEffect } from 'react';
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
  X,
  Sparkles,
  ChevronRight
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

// --- Sub-components ---

const AuthScreen: React.FC<{ 
  onToggle: () => void, 
  isLogin: boolean, 
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
  error: string 
}> = ({ onToggle, isLogin, onSubmit, error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 px-4">
    <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
      <div className="flex flex-col items-center mb-10">
        <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/30 mb-4 transform -rotate-3">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">SmartFinance AI</h1>
        <p className="text-slate-500 font-medium">智能理財，從今天開始</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">電子郵件</label>
          <input 
            name="email" 
            type="email" 
            required 
            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            placeholder="example@mail.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">密碼</label>
          <input 
            name="password" 
            type="password" 
            required 
            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            placeholder="••••••••"
          />
        </div>
        {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <X className="w-4 h-4" /> {error}
        </div>}
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20 mt-2"
        >
          {isLogin ? '立即登入' : '建立帳號'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button 
          onClick={onToggle}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          {isLogin ? '新用戶？立即註冊' : '已有帳號？返回登入'}
        </button>
      </div>
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
    { id: 'dashboard', icon: LayoutDashboard, label: '儀表板' },
    { id: 'accounts', icon: CreditCard, label: '我的帳戶' },
    { id: 'transactions', icon: ArrowLeftRight, label: '交易明細' },
    { id: 'reports', icon: PieChart, label: '分析報告' },
  ];

  return (
    <div className="w-72 bg-white h-screen flex flex-col border-r border-slate-200 hidden lg:flex sticky top-0 shadow-sm">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl text-slate-800 tracking-tight">SmartFinance</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-200 group ${
              currentView === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110`} />
            <span className="font-bold">{item.label}</span>
            {currentView === item.id && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto border-t border-slate-100">
        <div className="bg-slate-50 p-4 rounded-2xl mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
            {userEmail[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{userEmail.split('@')[0]}</p>
            <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-all"
        >
          <LogOut className="w-4 h-4" />
          登出系統
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

  useEffect(() => {
    if (!user || !db) {
      if (isOfflineMode || !db) {
        setAccounts([
          { id: '1', name: '主要現金', balance: 52400, color: 'bg-blue-500' },
          { id: '2', name: '國泰帳戶', balance: 185000, color: 'bg-green-500' }
        ]);
        setTransactions([
          { id: 't1', accountId: '1', amount: 120, type: TransactionType.EXPENSE, category: '飲食', note: '路易莎咖啡', date: new Date().toISOString() },
          { id: 't2', accountId: '2', amount: 48000, type: TransactionType.INCOME, category: '薪資', note: '10月薪資', date: new Date().toISOString() }
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
      setAuthError(err.message || '認證失敗。');
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
    if (confirm('確定要刪除此帳戶嗎？')) {
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

    await addDoc(collection(db, 'transactions'), {
      accountId,
      amount,
      type,
      category,
      note,
      date,
      userId: user.uid
    });

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
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">正在安全加載您的財務數據...</p>
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
    <div className="min-h-screen flex bg-slate-50 selection:bg-blue-100">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        onLogout={handleLogout} 
        userEmail={user.email || ''} 
      />

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* Dashboard View */}
          {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">你好, {user.email?.split('@')[0]} 👋</h2>
                  <p className="text-slate-500 mt-1 font-medium">這是您目前的智慧財務概況</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsTxModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all font-bold"
                  >
                    <Plus className="w-5 h-5" />
                    新增交易
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                    <Wallet className="w-16 h-16" />
                  </div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">總資產淨值</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">${totalBalance.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">本月累計收入</p>
                    <h3 className="text-3xl font-black text-emerald-600 tracking-tighter">+${monthIncome.toLocaleString()}</h3>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">本月累計支出</p>
                    <h3 className="text-3xl font-black text-rose-600 tracking-tighter">-${monthExpense.toLocaleString()}</h3>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
                    <TrendingDown className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-black text-slate-800 tracking-tight">資產帳戶</h4>
                    <button onClick={() => setView('accounts')} className="text-sm font-bold text-blue-600 hover:underline">管理全部</button>
                  </div>
                  <div className="space-y-4">
                    {accounts.length === 0 && <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">尚未新增任何帳戶</div>}
                    {accounts.slice(0, 4).map(acc => (
                      <div key={acc.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-5 hover:border-blue-200 transition-colors shadow-sm group">
                        <div className={`w-14 h-14 rounded-2xl ${acc.color} flex items-center justify-center text-white shadow-lg`}>
                          <CreditCard className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{acc.name}</p>
                          <p className="text-xs font-medium text-slate-400">目前餘額</p>
                        </div>
                        <p className="font-black text-xl text-slate-800 tracking-tight">${acc.balance.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-black text-slate-800 tracking-tight">近期活動</h4>
                    <button onClick={() => setView('transactions')} className="text-sm font-bold text-blue-600 hover:underline">查看完整明細</button>
                  </div>
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    {transactions.length === 0 && <div className="p-12 text-center text-slate-400">目前沒有交易紀錄</div>}
                    <div className="divide-y divide-slate-50">
                      {transactions.slice(0, 5).map(tx => (
                        <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{tx.category}</p>
                              <p className="text-xs font-medium text-slate-400">{new Date(tx.date).toLocaleDateString()} · {tx.note || '無備註'}</p>
                            </div>
                          </div>
                          <p className={`font-black text-lg tracking-tight ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              {/* AI Advisor Card - Enhanced Design */}
              <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 shadow-2xl shadow-blue-600/20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-widest mb-4 backdrop-blur-md">
                      <BrainCircuit className="w-4 h-4" /> Powered by Gemini 3 Pro
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-4 leading-tight">
                      準備好優化您的財務健康了嗎？
                    </h3>
                    <p className="text-blue-100 font-medium max-w-lg text-lg">
                      Gemini AI 能即時分析您的支出趨勢，提供精準的儲蓄建議與風險預警。
                    </p>
                  </div>
                  <button 
                    onClick={askAI}
                    disabled={aiLoading}
                    className="w-full md:w-auto bg-white text-blue-700 px-10 py-5 rounded-[1.5rem] font-black text-lg hover:bg-blue-50 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 group"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        開始 AI 診斷
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Accounts View */}
          {view === 'accounts' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">我的帳戶</h2>
                <button 
                  onClick={() => setIsAccountModalOpen(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20"
                >
                  <Plus className="w-5 h-5" /> 新增帳戶
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative group">
                    <button 
                      onClick={() => deleteAccount(acc.id)}
                      className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className={`w-16 h-16 ${acc.color} rounded-2xl mb-6 flex items-center justify-center text-white shadow-xl`}>
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{acc.name}</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 mb-4">Savings Account</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">${acc.balance.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions View */}
          {view === 'transactions' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">交易紀錄</h2>
                <button 
                  onClick={() => setIsTxModalOpen(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20"
                >
                  <Plus className="w-5 h-5" /> 記一筆
                </button>
              </div>
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        <th className="px-8 py-5">日期</th>
                        <th className="px-8 py-5">類型/分類</th>
                        <th className="px-8 py-5">帳戶來源</th>
                        <th className="px-8 py-5">備註說明</th>
                        <th className="px-8 py-5 text-right">金額 (TWD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6 text-sm font-bold text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${tx.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                              {tx.category}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-slate-800">{accounts.find(a => a.id === tx.accountId)?.name || '未知帳戶'}</td>
                          <td className="px-8 py-6 text-sm text-slate-400 font-medium italic">{tx.note || '—'}</td>
                          <td className={`px-8 py-6 text-right font-black text-lg tracking-tight ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reports View */}
          {view === 'reports' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">財務診斷報告</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h4 className="text-lg font-black text-slate-800 mb-8">本月收支平衡</h4>
                  <div className="h-64 flex items-end justify-center gap-12 pb-4 border-b border-slate-50">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105" style={{height: `${Math.max(10, (monthIncome / (monthIncome + monthExpense)) * 200)}px`}}></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">收入</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 bg-rose-500 rounded-2xl shadow-lg shadow-rose-500/20 transition-all hover:scale-105" style={{height: `${Math.max(10, (monthExpense / (monthIncome + monthExpense)) * 200)}px`}}></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">支出</span>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-between items-center text-sm">
                    <p className="font-bold text-slate-500">儲蓄率</p>
                    <p className="font-black text-blue-600 text-xl">{monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0}%</p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h4 className="text-lg font-black text-slate-800 mb-8">主要支出類別</h4>
                  <div className="space-y-6">
                    {DEFAULT_CATEGORIES.filter(c => transactions.some(t => t.category === c && t.type === TransactionType.EXPENSE)).slice(0, 5).map(cat => {
                      const amount = transactions
                        .filter(t => t.category === cat && t.type === TransactionType.EXPENSE)
                        .reduce((s, t) => s + t.amount, 0);
                      const percent = monthExpense > 0 ? (amount / monthExpense) * 100 : 0;
                      return (
                        <div key={cat} className="group">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-bold text-slate-700">{cat}</span>
                            <span className="font-black text-slate-900">${amount.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-1000 group-hover:bg-blue-500" style={{width: `${percent}%`}}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {aiAdvice && (
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-500">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Sparkles className="w-40 h-40" />
                  </div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-600/30">
                      <BrainCircuit className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Gemini AI 診斷分析</h3>
                      <p className="text-blue-600 font-bold text-xs uppercase tracking-widest">Personalized Financial Report</p>
                    </div>
                  </div>
                  <div className="relative prose prose-slate max-w-none text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                    {aiAdvice}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Account Modal - Enhanced Styled */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">新增資產帳戶</h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={addAccount} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">帳戶名稱</label>
                <input name="name" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="例如：中信數位帳戶" />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">當前餘額 (TWD)</label>
                <input name="balance" type="number" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-widest">識別色彩</label>
                <div className="flex gap-3">
                  {ACCOUNT_COLORS.map(c => (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="color" value={c} defaultChecked={c === ACCOUNT_COLORS[0]} className="hidden peer" />
                      <div className={`w-10 h-10 rounded-xl ${c} border-4 border-transparent peer-checked:border-slate-900 peer-checked:scale-110 shadow-sm transition-all`}></div>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 shadow-xl transition-all">確認建立</button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal - Enhanced Styled */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">記錄收支</h3>
              <button onClick={() => setIsTxModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={addTransaction} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="type" value={TransactionType.EXPENSE} defaultChecked className="hidden peer" />
                  <div className="py-3 text-center rounded-2xl border-2 border-slate-100 peer-checked:border-rose-500 peer-checked:bg-rose-50 peer-checked:text-rose-600 transition-all font-black uppercase text-xs tracking-widest">支出</div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="type" value={TransactionType.INCOME} className="hidden peer" />
                  <div className="py-3 text-center rounded-2xl border-2 border-slate-100 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-600 transition-all font-black uppercase text-xs tracking-widest">收入</div>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">金額</label>
                  <input name="amount" type="number" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">分類</label>
                  <select name="category" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold">
                    {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">選擇帳戶</label>
                <select name="accountId" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold">
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">日期</label>
                  <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">備註</label>
                  <input name="note" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" placeholder="..." />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all">儲存明細</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
