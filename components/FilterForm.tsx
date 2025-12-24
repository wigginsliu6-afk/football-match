
import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { LEAGUES_DATA } from '../constants';

interface FilterFormProps {
  onSearch: (prefs: UserPreferences) => void;
  isLoading: boolean;
}

const FilterForm: React.FC<FilterFormProps> = ({ onSearch, isLoading }) => {
  const [selectedLeagues, setSelectedLeagues] = useState<string>('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [startHour, setStartHour] = useState(19);
  const [endHour, setEndHour] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeams.length === 0) {
      alert("请至少选择一支球队");
      return;
    }
    onSearch({ teams: selectedTeams, startHour, endHour });
  };

  const currentLeague = LEAGUES_DATA.find(l => l.id === selectedLeagues);

  const toggleTeam = (team: string) => {
    if (selectedTeams.includes(team)) {
      setSelectedTeams(selectedTeams.filter(t => t !== team));
    } else {
      setSelectedTeams([...selectedTeams, team]);
    }
  };

  const removeTeam = (team: string) => {
    setSelectedTeams(selectedTeams.filter(t => t !== team));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <i className="fas fa-list-ul text-indigo-500"></i>
          选择联赛与球队
        </label>
        
        {/* League Selector */}
        <select
          value={selectedLeagues}
          onChange={(e) => setSelectedLeagues(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-4 transition-all"
        >
          <option value="">-- 请选择五大联赛 --</option>
          {LEAGUES_DATA.map(league => (
            <option key={league.id} value={league.id}>{league.name}</option>
          ))}
        </select>

        {/* Team Grid (Scrollable if too many) */}
        {currentLeague && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-60 overflow-y-auto mb-4 custom-scrollbar">
            <div className="grid grid-cols-2 gap-2">
              {currentLeague.teams.map(team => (
                <button
                  key={team}
                  type="button"
                  onClick={() => toggleTeam(team)}
                  className={`text-xs p-2 rounded-lg border transition-all text-left ${
                    selectedTeams.includes(team)
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Teams Tags */}
        {selectedTeams.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <span className="text-[10px] uppercase font-bold text-indigo-400 w-full mb-1">已选球队 ({selectedTeams.length}):</span>
            {selectedTeams.map(team => (
              <span key={team} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium shadow-sm">
                {team.split(' (')[0]}
                <button type="button" onClick={() => removeTeam(team)} className="hover:text-red-500 transition-colors">
                  <i className="fas fa-times-circle"></i>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">最早观赛 (北京时间)</label>
          <select
            value={startHour}
            onChange={(e) => setStartHour(parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <option key={i} value={i}>{i === 0 ? '00:00' : `${i}:00`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">最晚观赛 (北京时间)</label>
          <select
            value={endHour}
            onChange={(e) => setEndHour(parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <option key={i} value={i}>{i === 0 ? '00:00' : `${i}:00`}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || selectedTeams.length === 0}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>正在搜寻赛程...</span>
          </>
        ) : (
          <>
            <i className="fas fa-search"></i>
            <span>智能筛选赛程</span>
          </>
        )}
      </button>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </form>
  );
};

export default FilterForm;
