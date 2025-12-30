
import React, { useState, useMemo, useEffect } from 'react';
import { Match, UserPreferences, SearchResult, ApiSettings } from './types';
import { fetchMatchesWithGemini } from './services/geminiService';
import FilterForm from './components/FilterForm';
import MatchCard from './components/MatchCard';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    apiKey: '',
    baseUrl: '',
    useSearchGrounding: true
  });

  // Load settings from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gemini_app_settings');
    if (saved) {
      try {
        setApiSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveSettings = (newSettings: ApiSettings) => {
    setApiSettings(newSettings);
    localStorage.setItem('gemini_app_settings', JSON.stringify(newSettings));
  };

  const handleSearch = async (newPrefs: UserPreferences) => {
    setIsLoading(true);
    setError(null);
    setPrefs(newPrefs);
    try {
      // Pass the current apiSettings to the service
      const result = await fetchMatchesWithGemini(newPrefs.teams, apiSettings);
      setData(result);
    } catch (err: any) {
      console.error("Search failed:", err);
      
      let errorMessage = err.message || "请求失败";
      let debugInfo = "";

      if (errorMessage.startsWith("API_KEY_MISSING_OR_INVALID")) {
        const parts = errorMessage.split('|');
        errorMessage = "⚠️ 环境变量读取失败";
        debugInfo = parts[1] || "";
      } 
      else if (errorMessage.includes("API_KEY_INVALID") || err.status === 400 || JSON.stringify(err).includes("API_KEY_INVALID")) {
        errorMessage = "⚠️ API Key 校验不通过 (400 INVALID)";
        debugInfo = `调试信息: 长度=${err.keyLength || '未知'}, 预览=${err.keyHint || '无'}`;
      }
      else if (err.status === 429 || errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "⚠️ API 配额已耗尽 (429)";
        debugInfo = "请 1 分钟后再试或检查 AI Studio 配额。";
      }

      setError(`${errorMessage}\n${debugInfo}`);
    } finally {
      setIsLoading(false);
    }
  };

  const categorizedMatches = useMemo(() => {
    if (!data || !prefs) return { recommended: [], others: [] };
    const futureMatches = data.matches
      .filter(match => match.timestamp >= currentTime)
      .sort((a, b) => a.timestamp - b.timestamp);
    const recommended: Match[] = [];
    const others: Match[] = [];
    futureMatches.forEach(match => {
      const hour = parseInt(match.beijingTime.split(' ')[1].split(':')[0]);
      const isMatch = prefs.startHour < prefs.endHour 
        ? (hour >= prefs.startHour && hour < prefs.endHour)
        : (hour >= prefs.startHour || hour < prefs.endHour);
      if (isMatch) recommended.push(match); else others.push(match);
    });
    return { recommended, others };
  }, [data, prefs, currentTime]);

  return (
    <div className="min-h-screen pb-12">
      <header className="pitch-pattern text-white py-14 px-4 shadow-2xl mb-8 relative overflow-hidden border-b-4 border-emerald-700">
        <div className="absolute inset-0 pitch-lines opacity-30"></div>
        
        {/* Settings Button */}
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-full transition-all text-white"
          title="设置 API Key 和代理"
        >
          <i className="fas fa-cog text-xl animate-spin-slow hover:rotate-90 transition-transform duration-500"></i>
        </button>

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="relative bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/40 shadow-2xl flex items-center justify-center w-24 h-24">
            <i className="fas fa-futbol text-white text-5xl animate-bounce-slow"></i>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tight">球赛小助手</h1>
            <p className="text-emerald-50 text-base md:text-xl font-medium px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/5 inline-block">
              智能搜寻赛程 · 贴心匹配习惯
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <FilterForm onSearch={handleSearch} isLoading={isLoading} />
            {data && data.sources.length > 0 && (
              <div className="mt-6 bg-white p-4 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><i className="fas fa-link text-emerald-500"></i> 数据来源</h3>
                <ul className="text-xs space-y-2">
                  {data.sources.slice(0, 3).map((s, i) => (
                    <li key={i}><a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline block truncate">{s.title}</a></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl flex flex-col gap-2 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 font-bold text-lg"><i className="fas fa-bug"></i><span>运行提示</span></div>
              <p className="text-sm opacity-90 whitespace-pre-wrap font-mono bg-white/50 p-3 rounded-lg border border-red-100">{error}</p>
              <div className="text-[10px] text-red-500 mt-2 flex flex-col gap-1">
                <p>💡 建议：点击右上角的 <i className="fas fa-cog"></i> 图标。</p>
                <p>1. 如果您在微信中，尝试填入反向代理地址 (Base URL)。</p>
                <p>2. 尝试重新粘贴 API Key。</p>
              </div>
            </div>
          )}

          {!data && !isLoading && !error && (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400">
              <div className="mb-4 inline-block p-6 bg-emerald-50 rounded-full text-emerald-400"><i className="fas fa-futbol text-5xl"></i></div>
              <p className="text-xl font-bold text-slate-600">还没关注球队？</p>
            </div>
          )}

          {isLoading && <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="bg-white p-6 rounded-xl animate-pulse h-32 border border-slate-200"></div>)}</div>}

          {data && (
            <>
              <h2 className="text-lg font-bold text-slate-800 mb-4">推荐观赛 ({categorizedMatches.recommended.length})</h2>
              <div className="grid grid-cols-1 gap-4">{categorizedMatches.recommended.map(match => <MatchCard key={match.id} match={match} />)}</div>
              {data.rawText && (
                <div className="mt-8 p-6 bg-white rounded-2xl border border-emerald-100 shadow-md">
                  <h3 className="text-sm font-bold text-emerald-800 mb-4"><i className="fas fa-magic"></i> AI 赛事情报总结</h3>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{data.rawText.replace(/```json[\s\S]*```/, '').trim()}</div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        initialSettings={apiSettings}
      />
      
      <style>{`
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pitch-pattern { background-color: #059669; background-image: repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(0,0,0,0.05) 80px, rgba(0,0,0,0.05) 160px); }
      `}</style>
    </div>
  );
};

export default App;
