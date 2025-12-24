
import React, { useState, useMemo, useEffect } from 'react';
import { Match, UserPreferences, SearchResult } from './types';
import { fetchMatchesWithGemini } from './services/geminiService';
import FilterForm from './components/FilterForm';
import MatchCard from './components/MatchCard';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 每分钟更新一次当前时间，确保过期过滤有效
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = async (newPrefs: UserPreferences) => {
    setIsLoading(true);
    setError(null);
    setPrefs(newPrefs);
    try {
      const result = await fetchMatchesWithGemini(newPrefs.teams);
      setData(result);
    } catch (err: any) {
      console.error("Search failed:", err);
      // 显示具体的错误信息，帮助用户排查
      const errorMessage = err.message || JSON.stringify(err) || "未知错误";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 分类逻辑：将未来的比赛分为“推荐”和“其他”
  const categorizedMatches = useMemo(() => {
    if (!data || !prefs) return { recommended: [], others: [] };
    
    const futureMatches = data.matches
      .filter(match => match.timestamp >= currentTime)
      .sort((a, b) => a.timestamp - b.timestamp);

    const recommended: Match[] = [];
    const others: Match[] = [];

    futureMatches.forEach(match => {
      const hourStr = match.beijingTime.split(' ')[1].split(':')[0];
      const hour = parseInt(hourStr);
      
      let isMatch = false;
      if (prefs.startHour < prefs.endHour) {
        isMatch = hour >= prefs.startHour && hour < prefs.endHour;
      } else {
        // 处理跨夜时间段
        isMatch = hour >= prefs.startHour || hour < prefs.endHour;
      }

      if (isMatch) {
        recommended.push(match);
      } else {
        others.push(match);
      }
    });

    return { recommended, others };
  }, [data, prefs, currentTime]);

  return (
    <div className="min-h-screen pb-12">
      {/* Header with Pitch Theme and Classic FontAwesome Logo */}
      <header className="pitch-pattern text-white py-14 px-4 shadow-2xl mb-8 relative overflow-hidden border-b-4 border-emerald-700">
        {/* Pitch Lines Overlay */}
        <div className="absolute inset-0 pitch-lines opacity-30"></div>
        
        {/* Dynamic Background Elements */}
        <div className="absolute -top-10 -right-10 p-8 opacity-20 transform rotate-12 transition-transform hover:scale-110 duration-1000">
          <i className="fas fa-futbol text-[240px]"></i>
        </div>
        <div className="absolute -bottom-10 -left-10 p-8 opacity-10 transform -rotate-12 text-white">
          <i className="fas fa-futbol text-[180px]"></i>
        </div>

        {/* Center Circle Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-[1px] border-white/5 rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-center gap-6">
            {/* Simple Animated Football Logo Container */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-400 to-green-300 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/40 shadow-2xl flex items-center justify-center w-24 h-24 md:w-28 md:h-28">
                <i className="fas fa-futbol text-white text-5xl md:text-6xl animate-bounce-slow"></i>
              </div>
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-black mb-3 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-tight">
                球赛小助手
              </h1>
              <p className="text-emerald-50 text-base md:text-xl font-medium max-w-2xl bg-black/20 md:bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/5 inline-block shadow-lg">
                <i className="fas fa-search-location mr-2 text-emerald-300"></i>
                智能搜寻未来赛程 · 贴心匹配看球习惯
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <FilterForm onSearch={handleSearch} isLoading={isLoading} />
            
            {data && data.sources.length > 0 && (
              <div className="mt-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <i className="fas fa-link text-emerald-500"></i>
                  数据来源
                </h3>
                <ul className="text-xs space-y-2">
                  {data.sources.slice(0, 5).map((s, i) => (
                    <li key={i}>
                      <a 
                        href={s.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline block truncate"
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex flex-col gap-2 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3 font-bold text-lg">
                <i className="fas fa-exclamation-triangle"></i>
                <span>配置错误</span>
              </div>
              <p className="text-sm opacity-90 break-all pl-8">{error}</p>
              
              {error.includes("API Key") && (
                <div className="mt-2 pl-8 text-xs text-slate-600 bg-red-100/50 p-2 rounded">
                  <p className="font-bold mb-1">如何解决：</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li className="mb-1">
                      <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-semibold"
                      >
                        点击此处获取免费 Gemini API Key
                      </a>
                    </li>
                    <li>进入 Vercel 项目控制台 &rarr; Settings &rarr; Environment Variables</li>
                    <li>添加 Key: <code className="bg-white px-1 rounded border">VITE_API_KEY</code></li>
                    <li>添加 Value: 粘贴您刚获取的密钥</li>
                    <li>保存后，回到 Deployments 页面点击 <strong>Redeploy</strong> (重新部署)</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {!data && !isLoading && !error && (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 shadow-sm">
              <div className="mb-4 inline-block p-6 bg-emerald-50 rounded-full text-emerald-400 ring-8 ring-emerald-50/50">
                <i className="fas fa-futbol text-5xl animate-pulse"></i>
              </div>
              <p className="text-xl font-bold text-slate-600">还没关注球队？</p>
              <p className="text-sm mt-2">在左侧选择您喜爱的联赛和球队，由 Gemini 扫描全网最新资讯</p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-xl animate-pulse h-32 border border-slate-200 shadow-sm"></div>
              ))}
              <div className="text-center py-6">
                <div className="inline-flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <i className="fas fa-futbol absolute inset-0 w-fit h-fit m-auto text-emerald-300 opacity-50"></i>
                  </div>
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold shadow-sm">
                    <i className="fas fa-satellite-dish mr-2"></i>
                    正在精准解析各大联赛赛程...
                  </div>
                </div>
              </div>
            </div>
          )}

          {data && (
            <>
              {/* 1. 推荐比赛部分 */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                    推荐观赛
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      ({categorizedMatches.recommended.length})
                    </span>
                  </h2>
                  {prefs && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      黄金时段
                    </span>
                  )}
                </div>

                {categorizedMatches.recommended.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {categorizedMatches.recommended.map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 p-10 rounded-2xl text-center text-slate-500 text-sm shadow-inner">
                    <i className="fas fa-couch text-4xl mb-3 opacity-20 block"></i>
                    <p className="font-medium text-slate-400">设置的时段内暂无比赛，也许可以睡个好觉？</p>
                  </div>
                )}
              </div>

              {/* 2. 其他比赛部分 */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-6 bg-slate-300 rounded-full"></span>
                    非观赛时段
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      ({categorizedMatches.others.length})
                    </span>
                  </h2>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    时间冲突
                  </span>
                </div>

                {categorizedMatches.others.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale-[0.3] hover:grayscale-0">
                    {categorizedMatches.others.map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-slate-400 text-xs italic">
                    没有找到其他时段的比赛。
                  </div>
                )}
              </div>
              
              {data.rawText && (
                <div className="mt-12 p-6 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg">
                      <i className="fas fa-magic"></i>
                    </div>
                    <h3 className="text-sm font-bold text-emerald-800">AI 赛事情报总结</h3>
                  </div>
                  <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-loose">
                    {data.rawText.replace(/```json[\s\S]*```/, '').trim()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="mt-12 py-12 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        <div className="mb-4 flex justify-center">
          <i className="fas fa-futbol text-2xl text-slate-200"></i>
        </div>
        <p className="font-bold text-slate-500">球赛小助手</p>
        <p className="mt-1 opacity-60 italic">因为热爱，所以专业</p>
      </footer>
      
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
        .pitch-pattern {
          background-color: #059669;
          background-image: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 80px,
            rgba(0, 0, 0, 0.05) 80px,
            rgba(0, 0, 0, 0.05) 160px
          );
        }
      `}</style>
    </div>
  );
};

export default App;
