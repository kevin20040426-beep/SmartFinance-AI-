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
  ChevronRight,
  Compass,
  RefreshCw,
  Heart
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
import { getFinancialAdvice, getDailyInspiration } from './geminiService';

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

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">電子郵件</label>
          <input name="email" type="email" required className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" placeholder="example@mail.com" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">密碼</label>
          <input name="password" type="password" required className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" placeholder="••••••••" />
        </div>
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm flex items-center gap-2"><X className="w-4 h-4" /> {error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20 mt-2">
          {isLogin ? '立即登入' : '建立帳號'}
        </button>
      </form>

      <button onClick={onDemo} className="w-full mt-4 bg-slate-800 text-white py-3.5 rounded-xl font-bold hover:bg-slate-900 transition-all">
        直接進入預覽模式 (訪客)
      </button>

      <div className="mt-8 text-center">
        <button onClick={onToggle} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
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
}> = ({ currentView, setView, onLogout, userEmail }) => (
  <div className="w-72 bg-white h-screen flex flex-col border-r border-slate-200 hidden lg:flex sticky top-0">
    <div className="p-8">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg"><Wallet className="w-6 h-6 text-white" /></div>
        <span className="font-black text-2xl text-slate-800 tracking-tight">SmartFinance</span>
      </div>
    </div>
    <nav className="flex-1 px-4 space-y-1.5">
      {[
        { id: 'dashboard', icon: LayoutDashboard, label: '儀表板' },
        { id: 'accounts', icon: CreditCard, label: '我的帳戶' },
        { id: 'transactions', icon: ArrowLeftRight, label: '交易明細' },
        { id: 'reports', icon: PieChart, label: '分析報告' },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id as View)}
          className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all group ${
            currentView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <item.icon className="w-5 h-5" />
          <span className="font-bold">{item.label}</span>
          {currentView === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
        </button>
      ))}
    </nav>
    <div className="p-6 mt-auto border-t">
      <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 text-red-500 bg-red-50 rounded-xl font-bold hover:bg-red-100 transition-all">
        <LogOut className="w-4 h-4" /> 登出
      </button>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState('');
  const [view, setView] = useState<View>('dashboard');
  
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailyQuote, setDailyQuote] = useState<string>('加載靈感中...');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);

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

  const refreshQuote = async () => {
    setQuoteLoading(true);
    const quote = await getDailyInspiration();
    setDailyQuote(quote);
    setQuoteLoading(false);
  };

  useEffect(() => {
    refreshQuote();
    
    const demoAccounts = [
      { id: '1', name: '主要現金', balance: 52400, color: 'bg-blue-500' },
      { id: '2', name: '儲蓄帳戶', balance: 185000, color: 'bg-green-500' }
    ];
    const demoTx = [
      { id: 't1', accountId: '1', amount: 120, type: TransactionType.EXPENSE, category: '飲食', note: '拿鐵咖啡', date: new Date().toISOString() },
      { id: 't2', accountId: '2', amount: 45000, type: TransactionType.INCOME, category: '薪資', note: '月薪入帳', date: new Date().toISOString() }
    ];

    if (isDemoUser || !user || !db) {
      setAccounts(demoAccounts);
      setTransactions(demoTx);
      return;
    }

    const unsubAccounts = onSnapshot(query(collection(db, 'accounts'), where('userId', '==', user.uid)), (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() } as BankAccount));
      setAccounts(data.length > 0 ? data : demoAccounts);
    });

    const unsubTx = onSnapshot(query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc'), limit(50)), (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(data.length > 0 ? data : demoTx);
    });

    return () => { unsubAccounts(); unsubTx(); };
  }, [user, isDemoUser]);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth) return;
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    try {
      setAuthError('');
      if (isLoginView) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) { setAuthError(err.message); }
  };

  const addAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAcc = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      balance: parseFloat(formData.get('balance') as string),
      color: formData.get('color') as string,
    };
    if (db && user && !isDemoUser) await addDoc(collection(db, 'accounts'), { ...newAcc, userId: user.uid });
    else setAccounts([...accounts, newAcc]);
    setIsAccountModalOpen(false);
  };

  const addTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as TransactionType;
    const amount = parseFloat(formData.get('amount') as string);
    const accountId = formData.get('accountId') as string;

    const newTx = {
      accountId, amount, type,
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>;

  if (!user && !isDemoUser) return <AuthScreen isLogin={isLoginView} onToggle={() => setIsLoginView(!isLoginView)} onSubmit={handleAuth} error={authError} onDemo={() => setIsDemoUser(true)} />;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar currentView={view} setView={setView} onLogout={() => { setIsDemoUser(false); if(auth) signOut(auth); }} userEmail={user?.email || 'Demo User'} />
      
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {view === 'dashboard' && (
            <div className="animate-in fade-in duration-500 space-y-8">
              {/* Daily Inspiration Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 p-8 rounded-[2.5rem] shadow-sm group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest mb-4">
                      <Compass className="w-4 h-4" /> 今日靈感探索
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed max-w-3xl italic">
                      「{dailyQuote}」
                    </p>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                        <Heart className="w-4 h-4 text-rose-400 fill-rose-400" /> 持續理財，實現美好生活
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={refreshQuote}
                    disabled={quoteLoading}
                    className="p-3 bg-white rounded-2xl shadow-sm text-blue-600 hover:scale-110 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${quoteLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">歡迎回來，{user?.email?.split('@')[0] || '訪客'}</h2>
                  <p className="text-slate-500 font-medium">您的財務航圖已更新</p>
                </div>
                <button onClick={() => setIsTxModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> 記一筆
                </button>
              </header>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">總資產</p>
                  <h3 className="text-4xl font-black text-slate-900">${accounts.reduce((s, a) => s + a.balance, 0).toLocaleString()}</h3>
                </div>
                <div className="bg-emerald-500 p-8 rounded-[2rem] text-white shadow-lg shadow-emerald-500/20">
                  <p className="text-emerald-100 text-xs font-black uppercase tracking-widest mb-2">本月收入</p>
                  <h3 className="text-4xl font-black">${transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0).toLocaleString()}</h3>
                </div>
                <div className="bg-rose-500 p-8 rounded-[2rem] text-white shadow-lg shadow-rose-500/20">
                  <p className="text-rose-100 text-xs font-black uppercase tracking-widest mb-2">本月支出</p>
                  <h3 className="text-4xl font-black">${transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0).toLocaleString()}</h3>
                </div>
              </div>

              {/* AI Trigger */}
              <div className="p-1 px-8 py-8 bg-slate-900 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-2xl"><BrainCircuit className="text-white w-8 h-8" /></div>
                  <div className="text-white">
                    <h4 className="text-xl font-bold">需要更精準的財務建議嗎？</h4>
                    <p className="text-slate-400 text-sm">讓 Gemini 3 分析您的消費習慣</p>
                  </div>
                </div>
                <button 
                  onClick={async () => { setAiLoading(true); const advice = await getFinancialAdvice(accounts, transactions); setAiAdvice(advice); setView('reports'); setAiLoading(false); }}
                  className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all flex items-center gap-2"
                >
                  {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5 text-blue-600" />}
                  立即開始分析
                </button>
              </div>
            </div>
          )}

          {view === 'accounts' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black">資產帳戶</h2>
                <button onClick={() => setIsAccountModalOpen(true)} className="bg-blue-600 text-white p-3 rounded-xl"><Plus /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 ${acc.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}><CreditCard className="w-8 h-8" /></div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{acc.name}</h3>
                        <p className="text-2xl font-black tracking-tight mt-1">${acc.balance.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'transactions' && (
            <div className="space-y-8">
              <h2 className="text-3xl font-black text-slate-900">交易流水</h2>
              <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50"><tr className="text-left text-xs font-black uppercase text-slate-400 tracking-widest"><th className="px-8 py-5">日期</th><th className="px-8 py-5">分類</th><th className="px-8 py-5">金額</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6 text-sm font-bold text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="px-8 py-6"><span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black">{tx.category}</span></td>
                        <td className={`px-8 py-6 font-black ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'reports' && (
            <div className="space-y-8">
              <h2 className="text-3xl font-black">AI 智能報告</h2>
              {aiAdvice ? (
                <div className="bg-white p-10 rounded-[3rem] border border-blue-100 shadow-xl leading-relaxed whitespace-pre-wrap font-medium text-slate-700">
                  <div className="flex items-center gap-3 mb-6"><Sparkles className="text-blue-600" /><h3 className="text-xl font-black">診斷結果</h3></div>
                  {aiAdvice}
                </div>
              ) : <p className="text-center text-slate-400 py-20 font-bold">尚無分析資料，請回儀表板點擊「開始分析」</p>}
            </div>
          )}
        </div>
      </main>

      {/* Simplified Modals */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={addAccount} className="bg-white rounded-[2.5rem] w-full max-w-md p-8 space-y-4">
            <h3 className="text-2xl font-black mb-4">新增帳戶</h3>
            <input name="name" required className="w-full p-4 bg-slate-50 rounded-xl outline-none" placeholder="名稱" />
            <input name="balance" type="number" required className="w-full p-4 bg-slate-50 rounded-xl outline-none" placeholder="餘額" />
            <select name="color" className="w-full p-4 bg-slate-50 rounded-xl outline-none">
              {ACCOUNT_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">確認</button>
            <button type="button" onClick={() => setIsAccountModalOpen(false)} className="w-full text-slate-400">取消</button>
          </form>
        </div>
      )}

      {isTxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={addTransaction} className="bg-white rounded-[2.5rem] w-full max-w-md p-8 space-y-4">
            <h3 className="text-2xl font-black mb-4">記錄交易</h3>
            <div className="flex gap-4">
              <label className="flex-1 bg-rose-50 p-4 rounded-xl text-center cursor-pointer font-bold"><input type="radio" name="type" value={TransactionType.EXPENSE} defaultChecked /> 支出</label>
              <label className="flex-1 bg-emerald-50 p-4 rounded-xl text-center cursor-pointer font-bold"><input type="radio" name="type" value={TransactionType.INCOME} /> 收入</label>
            </div>
            <input name="amount" type="number" required className="w-full p-4 bg-slate-50 rounded-xl outline-none" placeholder="金額" />
            <select name="category" className="w-full p-4 bg-slate-50 rounded-xl outline-none">
              {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select name="accountId" className="w-full p-4 bg-slate-50 rounded-xl outline-none">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-slate-50 rounded-xl outline-none" />
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">存檔</button>
            <button type="button" onClick={() => setIsTxModalOpen(false)} className="w-full text-slate-400">取消</button>
          </form>
        </div>
      )}
    </div>
  );
}