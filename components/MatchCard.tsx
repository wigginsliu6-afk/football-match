
import React from 'react';
import { Match } from '../types';

interface MatchCardProps {
  match: Match;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const timeStr = match.beijingTime.split(' ')[1];
  const dateStr = match.beijingTime.split(' ')[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center group-hover:bg-indigo-50/30 transition-colors">
        <div className="flex items-center gap-2">
          <i className="fas fa-trophy text-amber-500 text-[10px]"></i>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{match.competition}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">北京时间</span>
      </div>
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="flex-1 text-right">
            <div className="text-sm text-slate-400 mb-1">主场</div>
            <div className="font-bold text-slate-800 text-base md:text-lg leading-tight">{match.homeTeam}</div>
          </div>
          <div className="px-2 text-slate-300 font-black italic text-sm">VS</div>
          <div className="flex-1 text-left">
            <div className="text-sm text-slate-400 mb-1">客场</div>
            <div className="font-bold text-slate-800 text-base md:text-lg leading-tight">{match.awayTeam}</div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center min-w-[120px] bg-slate-50 rounded-lg py-2 px-4 border border-slate-100">
          <div className="text-xl font-black text-indigo-600 tracking-tighter">{timeStr}</div>
          <div className="text-[10px] text-slate-500 font-bold">{dateStr}</div>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
