
import React, { useState } from 'react';
import { Member, SportType, UserRole } from '../types';
import { SPORT_RANKS } from '../constants';

interface MemberListProps {
  members: Member[];
  sport: SportType;
  role: UserRole;
  onRefresh: () => void;
}

const MemberList: React.FC<MemberListProps> = ({ members, sport, role, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState('All');

  const filteredMembers = members.filter(m => 
    (m.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterRank === 'All' || m.rank === filterRank)
  );

  const getRankColor = (rank: string) => {
    const r = rank?.toLowerCase() || '';
    if (r.includes('white')) return 'bg-slate-100 text-slate-900';
    if (r.includes('blue')) return 'bg-blue-600 text-white';
    if (r.includes('purple')) return 'bg-purple-600 text-white';
    if (r.includes('brown')) return 'bg-amber-900 text-white';
    if (r.includes('black')) return 'bg-slate-950 text-white border border-slate-800';
    return 'bg-indigo-600 text-white';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sticky top-[73px] bg-slate-950 z-30 pb-4">
        <div className="flex justify-between items-center">
           <h2 className="text-2xl font-black italic tracking-tight text-white uppercase">Academy Roster</h2>
           <button onClick={onRefresh} className="text-indigo-400 p-2 active:rotate-180 transition-transform"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-3 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search team..."
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
        {filteredMembers.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
            <p className="text-slate-500 font-black italic uppercase text-xs">No grapplers found</p>
            <p className="text-slate-600 text-[10px] mt-1">Share your club ID to get people on the mat!</p>
          </div>
        ) : (
          filteredMembers.map(m => (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-500/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {/* Fixed: avatar_url is now part of the Member interface, removed (m as any) cast */}
                  <img src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} className="w-12 h-12 rounded-full border-2 border-slate-800 bg-slate-800 object-cover" alt={m.name} />
                  {m.isPremium && (
                    <div className="absolute -top-1 -right-1 bg-amber-400 p-0.5 rounded-full">
                      <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 italic">{m.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${getRankColor(m.rank)}`}>
                      {m.rank}
                    </span>
                    <span className="text-slate-500 text-[10px] font-bold uppercase">{m.totalSessions} classes</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-4 rounded-sm border border-slate-950 ${i < m.stripes ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'bg-slate-800'}`}></div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemberList;