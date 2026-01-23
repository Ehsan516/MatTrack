
import React, { useState } from 'react';
import { Member, SportType, UserRole } from '../types';
import { SPORT_RANKS } from '../constants';

interface MemberListProps {
  members: Member[];
  sport: SportType;
  role: UserRole;
}

const MemberList: React.FC<MemberListProps> = ({ members, sport, role }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState('All');

  const filteredMembers = members.filter(m => 
    (m.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterRank === 'All' || m.rank === filterRank)
  );

  const getRankColor = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'white': return 'bg-slate-100 text-slate-900';
      case 'blue': return 'bg-blue-600 text-white';
      case 'purple': return 'bg-purple-600 text-white';
      case 'brown': return 'bg-amber-900 text-white';
      case 'black': return 'bg-slate-950 text-white border border-slate-800';
      default: return 'bg-indigo-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sticky top-[73px] bg-slate-950 z-30 pb-4">
        <div className="relative">
          <svg className="absolute left-3 top-3 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button 
            onClick={() => setFilterRank('All')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filterRank === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
          >
            All Members
          </button>
          {SPORT_RANKS[sport].ranks.map(r => (
            <button 
              key={r}
              onClick={() => setFilterRank(r)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filterRank === r ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredMembers.map(m => (
          <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-500/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={`https://picsum.photos/seed/${m.id}/100`} className="w-12 h-12 rounded-full border-2 border-slate-800" alt={m.name} />
                {m.isPremium && (
                  <div className="absolute -top-1 -right-1 bg-amber-400 p-0.5 rounded-full">
                    <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-100">{m.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getRankColor(m.rank)}`}>
                    {m.rank}
                  </span>
                  <span className="text-slate-500 text-[11px] font-medium">{m.totalSessions} sessions</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-1.5 h-4 rounded-sm border border-slate-950 ${i < m.stripes ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'bg-slate-800'}`}></div>
                ))}
              </div>
              {role === UserRole.OWNER && (
                <button className="text-slate-500 hover:text-indigo-400 p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {role === UserRole.OWNER && (
        <button className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/40 active:scale-90 transition-transform z-50">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      )}
    </div>
  );
};

export default MemberList;
