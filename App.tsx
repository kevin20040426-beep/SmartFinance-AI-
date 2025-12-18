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

// --- Auth Component ---
const AuthScreen: React.FC<{ 
  onToggle: () => void, 
  isLogin: boolean, 
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
  error: string,
  onDemo: () => void
}> = ({ onToggle, isLogin, onSubmit, error, onDemo }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 px-4">
    <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
      <div className="flex flex-col items-center mb-10">
        <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/30 mb-4 transform -rotate-3">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">SmartFinance AI</h1>
        <p className="text-slate-500 font-medium">智能理財，從今天開始</p>
      </div>

      {isOfflineMode && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm font-medium">
          偵測到離線模式，系統將自動以訪客身分啟動預覽。
        </div>
      )}

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
          disabled={isOfflineMode}
          className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20 mt-2 disabled:opacity-50"
        >
          {isLogin ? '立即登入' : '建立帳號'}
        </button>
      </form>

      <button 
        onClick={onDemo}
        className="w-full mt-4 bg-slate-800 text-white py-3.5 rounded-xl font-bold hover:bg-slate-900 transition-all"
      >
        直接進入預覽模式 (訪客)
      </button>

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
            {userEmail[0]?.toUpperCase() || 'V'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{userEmail.split('@')[0] || 'Guest'}</p>
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState('');
  const [view, setView] = useState<View>('dashboard');
  
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  useEffect(() => {
    if (!auth || isOfflineMode) {
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
    // 預覽數據
    const demoAccounts: BankAccount[] = [
      { id: '1', name: '主要現金', balance: 52400, color: 'bg-blue-500' },
      { id: '2', name: '國泰帳戶', balance: 185000, color: 'bg-green-500' }
    ];
    const demoTx: Transaction[] = [
      { id: 't1', accountId: '1', amount: 120, type: TransactionType.EXPENSE, category: '飲食', note: '路易莎咖啡', date: new Date().toISOString() },
      { id: 't2', accountId: '2', amount: 48000, type: TransactionType.INCOME, category: '薪資', note: '10月薪資', date: new Date().toISOString() }
    ];

    if (isDemoUser || !user || !db) {
      setAccounts(demoAccounts);
      setTransactions(demoTx);
      return;
    }

    const qAccounts = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubscribeAccounts = onSnapshot(qAccounts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
      setAccounts(data.length > 0 ? data : demoAccounts);
    });

    const qTx = query(
      collection(db, 'transactions'), 
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(50)
    );
    const unsubscribeTx = onSnapshot(qTx, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data.length > 0 ? data : demoTx);
    });

    return () => {
      unsubscribeAccounts();
      unsubscribeTx();
    };
  }, [user, isDemoUser]);

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

  const handleLogout = () => {
    if (isDemoUser) setIsDemoUser(false);
    if (auth) signOut(auth);
    setUser(null);
  };

  const addAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAcc: BankAccount = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      balance: parseFloat(formData.get('balance') as string),
      color: formData.get('color') as string,
    };

    if (db && user && !isDemoUser) {
      await addDoc(collection(db, 'accounts'), { ...newAcc, userId: user.uid, createdAt: new Date().toISOString() });
    } else {
      setAccounts([...accounts, newAcc]);
    }
    setIsAccountModalOpen(false);
  };

  const deleteAccount = async (id: string) => {
    if (confirm('確定要刪除此帳戶嗎？')) {
      if (db && user && !isDemoUser) {
        await deleteDoc(doc(db, 'accounts', id));
      } else {
        setAccounts(accounts.filter(a => a.id !== id));
      }
    }
  };

  const addTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const type = formData.get('type') as TransactionType;
    const accountId = formData.get('accountId') as string;

    const newTx: any = {
      accountId,
      amount,
      type,
      category: formData.get('category') as string,
      note: formData.get('note') as string,
      date: formData.get('date') as string,
    };

    if (db && user && !isDemoUser) {
      await addDoc(collection(db, 'transactions'), { ...newTx, userId: user.uid });
      const account = accounts.find(a => a.id === accountId);
      if (account) {
        const newBalance = type === TransactionType.INCOME ? account.balance + amount : account.balance - amount;
        await updateDoc(doc(db, 'accounts', accountId), { balance: newBalance });
      }
    } else {
      setTransactions([{ id: Date.now().toString(), ...newTx }, ...transactions]);
      setAccounts(accounts.map(a => a.id === accountId ? { ...a, balance: type === TransactionType.INCOME ? a.balance + amount : a.balance - amount } : a));
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
        <p className="text-slate-500 font-medium">正在載入您的財務空間...</p>
      </div>
    );
  }

  if (!user && !isDemoUser) {
    return (
      <AuthScreen 
        isLogin={isLoginView} 
        onToggle={() => setIsLoginView(!isLoginView)} 
        onSubmit={handleAuth} 
        error={authError}
        onDemo={() => setIsDemoUser(true)}
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
        userEmail={user?.email || 'Demo User'} 
      />

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">你好, {user?.email?.split('@')[0] || '投資家'} 👋</h2>
                  <p className="text-slate-500 mt-1 font-medium">這是您目前的財務概況</p>
                </div>
                <button 
                  onClick={() => setIsTxModalOpen(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-600/20"
                >
                  <Plus className="w-5 h-5" /> 新增交易
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Wallet className="w-16 h-16" /></div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">總資產淨值</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">${totalBalance.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">本月收入</p>
                    <h3 className="text-3xl font-black text-emerald-600 tracking-tighter">+${monthIncome.toLocaleString()}</h3>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-500 opacity-20" />
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">本月支出</p>
                    <h3 className="text-3xl font-black text-rose-600 tracking-tighter">-${monthExpense.toLocaleString()}</h3>
                  </div>
                  <TrendingDown className="w-8 h-8 text-rose-500 opacity-20" />
                </div>
              </div>

              {/* AI Card */}
              <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-5 mix-blend-overlay"></div>
                <div className="relative z-10 text-center md:text-left">
                  <h3 className="text-3xl font-black mb-3">您的財務診斷報告已準備好</h3>
                  <p className="text-blue-100 font-medium">使用 Gemini 3 AI 即時分析您的收支平衡並提供專業建議。</p>
                </div>
                <button 
                  onClick={askAI}
                  disabled={aiLoading}
                  className="relative z-10 bg-white text-blue-700 px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  {aiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                  開始 AI 分析
                </button>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <section>
                  <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-500" /> 資產帳戶</h4>
                  <div className="space-y-4">
                    {accounts.map(acc => (
                      <div key={acc.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-5 hover:border-blue-200 transition-all shadow-sm group">
                        <div className={`w-14 h-14 rounded-2xl ${acc.color} flex items-center justify-center text-white shadow-lg`}><CreditCard className="w-7 h-7" /></div>
                        <div className="flex-1"><p className="font-bold text-slate-900">{acc.name}</p></div>
                        <p className="font-black text-xl text-slate-800 tracking-tight">${acc.balance.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-indigo-500" /> 近期活動</h4>
                  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                    {transactions.slice(0, 5).map(tx => (
                      <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}><Sparkles className="w-5 h-5" /></div>
                          <div>
                            <p className="font-bold text-slate-900">{tx.category}</p>
                            <p className="text-xs font-medium text-slate-400">{tx.note || '無備註'}</p>
                          </div>
                        </div>
                        <p className={`font-black text-lg ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {view === 'accounts' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
               <div className="flex justify-between items-center">
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight">資產管理</h2>
                 <button onClick={() => setIsAccountModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold"><Plus className="w-5 h-5" /></button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group">
                    <button onClick={() => deleteAccount(acc.id)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-5 h-5" /></button>
                    <div className={`w-16 h-16 ${acc.color} rounded-2xl mb-6 flex items-center justify-center text-white shadow-xl`}><CreditCard className="w-8 h-8" /></div>
                    <h3 className="text-xl font-black text-slate-900">{acc.name}</h3>
                    <p className="text-3xl font-black text-slate-900 mt-4 tracking-tighter">${acc.balance.toLocaleString()}</p>
                  </div>
                ))}
               </div>
             </div>
          )}

          {view === 'transactions' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">所有交易</h2>
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                     <tr><th className="px-8 py-5">日期</th><th className="px-8 py-5">分類</th><th className="px-8 py-5">備註</th><th className="px-8 py-5 text-right">金額</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6 text-sm font-bold text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="px-8 py-6"><span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black">{tx.category}</span></td>
                        <td className="px-8 py-6 text-sm text-slate-800">{tx.note}</td>
                        <td className={`px-8 py-6 text-right font-black ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>{tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {view === 'reports' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI 財務診斷</h2>
               {aiAdvice ? (
                 <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-blue-50 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><BrainCircuit className="w-8 h-8" /></div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">Gemini 智囊團分析</h3>
                        <p className="text-blue-600 font-bold text-xs uppercase tracking-widest">Powered by Gemini 3 Flash</p>
                      </div>
                    </div>
                    <div className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                      {aiAdvice}
                    </div>
                 </div>
               ) : (
                 <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <Sparkles className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">目前尚無分析報告，點擊儀表板的分析按鈕開始。</p>
                 </div>
               )}
            </div>
          )}
        </div>
      </main>

      {/* Modals - Simplified for fix */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-black mb-6">新增資產</h3>
            <form onSubmit={addAccount} className="space-y-4">
              <input name="name" required className="w-full p-4 bg-slate-50 rounded-xl border-none" placeholder="帳戶名稱" />
              <input name="balance" type="number" required className="w-full p-4 bg-slate-50 rounded-xl border-none" placeholder="初始金額" />
              <select name="color" className="w-full p-4 bg-slate-50 rounded-xl border-none">
                {ACCOUNT_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">確認新增</button>
              <button onClick={() => setIsAccountModalOpen(false)} type="button" className="w-full py-2 text-slate-400">取消</button>
            </form>
          </div>
        </div>
      )}

      {isTxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-black mb-6">新增交易</h3>
            <form onSubmit={addTransaction} className="space-y-4">
              <div className="flex gap-2">
                <label className="flex-1"><input type="radio" name="type" value={TransactionType.EXPENSE} defaultChecked /> 支出</label>
                <label className="flex-1"><input type="radio" name="type" value={TransactionType.INCOME} /> 收入</label>
              </div>
              <input name="amount" type="number" required className="w-full p-4 bg-slate-50 rounded-xl border-none" placeholder="金額" />
              <select name="category" className="w-full p-4 bg-slate-50 rounded-xl border-none">
                {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select name="accountId" className="w-full p-4 bg-slate-50 rounded-xl border-none">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-slate-50 rounded-xl border-none" />
              <input name="note" className="w-full p-4 bg-slate-50 rounded-xl border-none" placeholder="備註" />
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">儲存明細</button>
              <button onClick={() => setIsTxModalOpen(false)} type="button" className="w-full py-2 text-slate-400">取消</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}