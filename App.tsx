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
  Heart,
  LineChart,
  ExternalLink,
  Zap
} from 'lucide-react';

import { auth, db, isOfflineMode } from './firebase';
import { 
  View, 
  BankAccount, 
  Transaction, 
  TransactionType, 
  DEFAULT_CATEGORIES, 
  ACCOUNT_COLORS,
  StockMarketData
} from './types';
import { getFinancialAdvice, getDailyInspiration, getTaiwanStockAnalysis } from './geminiService';

// --- Auth Screen Component ---
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
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight text-center">SmartFinance AI</h1>
        <p className="text-slate-500 font-medium mt-2">智能理財，從今天開始</p>
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
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><X className="w-4 h-4" /> {error}</div>}
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
      <div className="bg-slate-50 p-4 rounded-xl mb-4">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">目前登入</p>
        <p className="text-sm font-bold text-slate-700 truncate">{userEmail}</p>
      </div>
      <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 text-red-500 bg-red-50 rounded-xl font-bold hover:bg-red-100 transition-all">
        <LogOut className="w-4 h-4" /> 登出系統
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
  const [dailyQuote, setDailyQuote] = useState<string>('');
  const [stockData, setStockData] = useState<StockMarketData | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);

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

  const refreshStocks = async () => {
    setStockLoading(true);
    const data = await getTaiwanStockAnalysis();
    setStockData(data);
    setStockLoading(false);
  };

  useEffect(() => {
    if (user || isDemoUser) {
      refreshQuote();
      refreshStocks();
    }
    
    const demoAccounts = [
      { id: '1', name: '主要現金', balance: 52400, color: 'bg-blue-500' },
      { id: '2', name: '投資專戶', balance: 185000, color: 'bg-purple-500' }
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  if (!user && !isDemoUser) return <AuthScreen isLogin={isLoginView} onToggle={() => setIsLoginView(!isLoginView)} onSubmit={handleAuth} error={authError} onDemo={() => setIsDemoUser(true)} />;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar currentView={view} setView={setView} onLogout={() => { setIsDemoUser(false); if(auth) signOut(auth); }} userEmail={user?.email || 'Demo User'} />
      
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {view === 'dashboard' && (
            <div className="animate-in fade-in duration-500 space-y-8">
              {/* Daily Quote Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 p-8 rounded-[2.5rem] shadow-sm group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest mb-4">
                      <Compass className="w-4 h-4" /> 今日靈感探索
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed max-w-3xl italic">
                      「{dailyQuote || '加載靈感中...'}」
                    </p>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                        <Heart className="w-4 h-4 text-rose-400 fill-rose-400" /> 持續理財，實現美好生活
                      </div>
                    </div>
                  </div>
                  <button onClick={refreshQuote} disabled={quoteLoading} className="p-3 bg-white rounded-2xl shadow-sm text-blue-600 hover:scale-110 transition-all disabled:opacity-50">
                    <RefreshCw className={`w-5 h-5 ${quoteLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Stock Market Pulse Card */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group">
                <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/30"><LineChart className="w-8 h-8" /></div>
                    <div>
                      <h3 className="text-2xl font-black">台股趨勢觀測站</h3>
                      <p className="text-slate-400 font-medium">前一日市場動態與成交量分析</p>
                    </div>
                  </div>
                  <button onClick={refreshStocks} disabled={stockLoading} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl text-sm font-bold transition-all border border-white/10 disabled:opacity-50">
                    {stockLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                    更新數據
                  </button>
                </div>

                {stockData ? (
                  <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">成交量排行</h4>
                        <span className="text-[10px] bg-blue-50 text-blue-600 font-black px-2 py-0.5 rounded-md">VOLUME RANKING</span>
                      </div>
                      <div className="space-y-3">
                        {stockData.topVolumes.slice(0, 3).map((stock, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-4">
                              <span className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center rounded-lg font-black text-xs">{i + 1}</span>
                              <p className="font-bold text-slate-900">{stock.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-slate-800">{stock.volume}</p>
                              <p className={`text-xs font-bold ${stock.change.includes('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{stock.change}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">熱門族群 & AI 統整</h4>
                        <div className="flex gap-2">
                          {stockData.hotSectors.map((sector, i) => (
                            <span key={i} className="text-[10px] bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Zap className="w-3 h-3 fill-emerald-500" /> {sector}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 relative">
                        <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-blue-200 opacity-50" />
                        <p className="text-slate-700 leading-relaxed font-medium">
                          {stockData.summary}
                        </p>
                        {stockData.sources.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-blue-100 flex flex-wrap gap-4">
                            {stockData.sources.slice(0, 2).map((src, i) => (
                              <a key={i} href={src.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
                                <ExternalLink className="w-3 h-3" /> {src.title.slice(0, 15)}...
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-20 flex flex-col items-center justify-center text-slate-300">
                    {stockLoading ? <Loader2 className="w-12 h-12 animate-spin mb-4" /> : <LineChart className="w-12 h-12 mb-4" />}
                    <p className="font-black">正在連結證券市場數據...</p>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest">總資產淨值</p>
                  <h3 className="text-4xl font-black text-slate-900">${accounts.reduce((s, a) => s + a.balance, 0).toLocaleString()}</h3>
                </div>
                <div className="bg-emerald-500 p-8 rounded-[2rem] text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-between h-40">
                  <p className="text-emerald-100 text-xs font-black uppercase tracking-widest">本月收入</p>
                  <h3 className="text-4xl font-black">${transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0).toLocaleString()}</h3>
                </div>
                <div className="bg-rose-500 p-8 rounded-[2rem] text-white shadow-lg shadow-rose-500/20 flex flex-col justify-between h-40">
                  <p className="text-rose-100 text-xs font-black uppercase tracking-widest">本月支出</p>
                  <h3 className="text-4xl font-black">${transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0).toLocaleString()}</h3>
                </div>
              </div>

              {/* AI Trigger */}
              <div className="p-8 bg-slate-900 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="flex items-center gap-4 text-center md:text-left">
                  <div className="bg-blue-600 p-3 rounded-2xl"><BrainCircuit className="text-white w-8 h-8" /></div>
                  <div>
                    <h4 className="text-xl font-bold text-white">智慧財務分析報告</h4>
                    <p className="text-slate-400 text-sm">讓 Gemini 深度洞察您的消費與儲蓄</p>
                  </div>
                </div>
                <button 
                  onClick={async () => { setAiLoading(true); const advice = await getFinancialAdvice(accounts, transactions); setAiAdvice(advice); setView('reports'); setAiLoading(false); }}
                  className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all flex items-center gap-2"
                >
                  {aiLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5 text-blue-600" />}
                  立即開始 AI 分析
                </button>
              </div>
            </div>
          )}

          {view === 'accounts' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900">資產帳戶管理</h2>
                <button onClick={() => setIsAccountModalOpen(true)} className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-lg shadow-blue-600/20 hover:scale-110 transition-all">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 ${acc.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}><CreditCard className="w-8 h-8" /></div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{acc.name}</h3>
                        <p className="text-3xl font-black tracking-tight mt-1 text-slate-800">${acc.balance.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'transactions' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <h2 className="text-3xl font-black text-slate-900">交易流水記錄</h2>
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-black uppercase text-slate-400 tracking-widest">
                      <th className="px-8 py-5">日期</th>
                      <th className="px-8 py-5">分類</th>
                      <th className="px-8 py-5">備註</th>
                      <th className="px-8 py-5 text-right">金額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6 text-sm font-bold text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="px-8 py-6"><span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black">{tx.category}</span></td>
                        <td className="px-8 py-6 text-sm text-slate-700">{tx.note || '-'}</td>
                        <td className={`px-8 py-6 text-right font-black text-lg ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>
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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <h2 className="text-3xl font-black text-slate-900">AI 智能財務報告</h2>
              {aiAdvice ? (
                <div className="bg-white p-10 rounded-[3rem] border border-blue-100 shadow-xl leading-relaxed whitespace-pre-wrap font-medium text-slate-700 relative">
                   <div className="flex items-center gap-3 mb-8">
                     <div className="bg-blue-600 p-3 rounded-2xl text-white"><Sparkles className="w-6 h-6" /></div>
                     <h3 className="text-2xl font-black text-slate-900">診斷分析結果</h3>
                   </div>
                  {aiAdvice}
                </div>
              ) : (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <Sparkles className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">尚無分析資料，請至儀表板點擊「開始分析」按鈕。</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={addAccount} className="bg-white rounded-[2.5rem] w-full max-w-md p-8 space-y-6 shadow-2xl">
            <h3 className="text-2xl font-black mb-4">新增資產帳戶</h3>
            <div className="space-y-4">
              <input name="name" required className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="帳戶名稱 (如：現金、國泰世華)" />
              <input name="balance" type="number" required className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="當前金額" />
              <select name="color" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none appearance-none">
                {ACCOUNT_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">確認新增</button>
              <button type="button" onClick={() => setIsAccountModalOpen(false)} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600">取消返回</button>
            </div>
          </form>
        </div>
      )}

      {isTxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={addTransaction} className="bg-white rounded-[2.5rem] w-full max-w-md p-8 space-y-6 shadow-2xl">
            <h3 className="text-2xl font-black mb-4">記錄一筆新交易</h3>
            <div className="flex gap-4">
              <label className="flex-1 bg-rose-50 p-4 rounded-2xl text-center cursor-pointer font-black text-rose-600 border border-rose-100 has-[:checked]:bg-rose-500 has-[:checked]:text-white transition-all">
                <input type="radio" name="type" value={TransactionType.EXPENSE} defaultChecked className="hidden" /> 支出
              </label>
              <label className="flex-1 bg-emerald-50 p-4 rounded-2xl text-center cursor-pointer font-black text-emerald-600 border border-emerald-100 has-[:checked]:bg-emerald-500 has-[:checked]:text-white transition-all">
                <input type="radio" name="type" value={TransactionType.INCOME} className="hidden" /> 收入
              </label>
            </div>
            <div className="space-y-4">
              <input name="amount" type="number" required className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500" placeholder="交易金額" />
              <select name="category" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none">
                {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select name="accountId" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none" />
              <input name="note" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none" placeholder="簡單備註..." />
            </div>
            <div className="flex flex-col gap-2">
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">儲存這筆交易</button>
              <button type="button" onClick={() => setIsTxModalOpen(false)} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600">取消</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
