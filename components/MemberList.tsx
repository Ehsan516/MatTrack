
import React, { useState } from 'react';
import { Member, SportType, UserRole } from '../types';
import { SPORT_RANKS } from '../constants';
import { dataService } from '../services/dataService';

interface MemberListProps {
  members: Member[];
  sport: SportType;
  role: UserRole;
  clubId?: string;
  onRefresh: () => void;
}

const MemberList: React.FC<MemberListProps> = ({ members, sport, role, clubId, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState('All');
  const [loading, setLoading] = useState<string | null>(null);


  const handleRemove = async (memberId: string) => {
    if (!clubId) return;
    if (!confirm("Are you sure you want to remove this member from the academy?")) return;
    
    setLoading(memberId);
    try {
      await dataService.removeMember(clubId, memberId);
      onRefresh();
    } catch (err) {
      alert("Failed to remove member.");
    } finally {
      setLoading(null);
    }
  };

  const getRankColor = (rank: string) => {
    const r = rank?.toLowerCase() || '';
    if (r.includes('white')) return 'bg-slate-100 text-slate-900';
    if (r.includes('blue')) return 'bg-blue-600 text-white';
    if (r.includes('purple')) return 'bg-purple-600 text-white';
    if (r.includes('brown')) return 'bg-amber-900 text-white';
    if (r.includes('black')) return 'bg-slate-950 text-white border border-slate-800';
    return 'bg-indigo-600 text-white';
  };

  const baseBelt = (rank: string) => {
    const r = (rank || '').toLowerCase();
    if (r.includes('black')) return 'Black';
    if (r.includes('brown')) return 'Brown';
    if (r.includes('purple')) return 'Purple';
    if (r.includes('blue')) return 'Blue';
    if (r.includes('white')) return 'White';
    return rank || 'White';
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterRank === 'All' || baseBelt(m.rank) === filterRank)
  );



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
{['White','Blue','Purple','Brown','Black'].map(r => (
  <button
    key={r}
    onClick={() => setFilterRank(r)}
    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all
      ${filterRank === r ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
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
          </div>
        ) : (
          filteredMembers.map(m => (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-500/50 transition-all">
              <div className="flex items-center gap-4">
                <img src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} className="w-12 h-12 rounded-full border-2 border-slate-800 bg-slate-800 object-cover" alt={m.name} />
                <div>
                  <h4 className="font-bold text-slate-100 italic">{m.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${getRankColor(m.rank)}`}>
                      {m.rank}
                    </span>
                    {(m as any).role === 'OWNER' && <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 rounded font-black uppercase">Coach</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-4 rounded-sm border border-slate-950 ${i < m.stripes ? 'bg-white' : 'bg-slate-800'}`}></div>
                  ))}
                </div>
                {role === UserRole.OWNER && (m as any).role !== 'OWNER' && (
                  <button 
                    onClick={() => handleRemove(m.id)}
                    disabled={!!loading}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    {loading === m.id ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemberList;
