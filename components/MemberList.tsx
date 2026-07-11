import React, { useState } from 'react';
import { Member, SportType, UserRole } from '../types';
import { dataService } from '../services/dataService';

interface MemberListProps {
  members: Member[];
  sport: SportType;
  role: UserRole;
  clubId?: string;
  onRefresh: () => void;
}

const MemberList: React.FC<MemberListProps> = ({ members, role, clubId, onRefresh }) => {
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

  const beltClass = (rank: string) => {
    const r = rank?.toLowerCase() || '';
    if (r.includes('blue')) return 'belt-blue';
    if (r.includes('purple')) return 'belt-purple';
    if (r.includes('brown')) return 'belt-brown';
    if (r.includes('black')) return 'belt-black';
    return 'belt-white';
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
    <>
      <div className="row sb">
        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--ink-900)', letterSpacing: '-0.3px' }}>Academy Roster</h2>
        <button onClick={onRefresh} className="btn-icon" aria-label="Refresh roster">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
      </div>

      <div className="search-wrap">
        <span className="search-icon">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </span>
        <input
          type="text"
          placeholder="Search team..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="field"
        />
      </div>

      <div className="scroll-x">
        <button onClick={() => setFilterRank('All')} className={`chip ${filterRank === 'All' ? 'active' : ''}`}>All Members</button>
        {['White', 'Blue', 'Purple', 'Brown', 'Black'].map(r => (
          <button key={r} onClick={() => setFilterRank(r)} className={`chip ${filterRank === r ? 'active' : ''}`}>{r}</button>
        ))}
      </div>

      {filteredMembers.length === 0 ? (
        <div className="empty-state">No grapplers found</div>
      ) : (
        <div className="card">
          {filteredMembers.map(m => (
            <div key={m.id} className="member-row">
              <img src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} className="avatar" style={{ width: 44, height: 44 }} alt={m.name} />
              <div className="flex-1">
                <h4 className="member-name">{m.name}</h4>
                <div className="row gap-2 mt-1">
                  <span className={`belt ${beltClass(m.rank)}`} style={{ padding: '2px 8px', fontSize: '0.625rem' }}>{m.rank}</span>
                  {(m as any).role === 'OWNER' && <span className="badge blue">Coach</span>}
                </div>
              </div>
              <div className="row gap-3">
                <div className="stripes">
                  {[...Array(4)].map((_, i) => (
                    <span key={i} className={`stripe ${i < m.stripes ? 'on' : 'off'}`} />
                  ))}
                </div>
                {role === UserRole.OWNER && (m as any).role !== 'OWNER' && (
                  <button
                    onClick={() => handleRemove(m.id)}
                    disabled={!!loading}
                    className="btn-icon"
                    style={{ color: 'var(--red-vivid)', width: 36, height: 36 }}
                    aria-label={`Remove ${m.name}`}
                  >
                    {loading === m.id ? (
                      <div className="spinner sm" style={{ borderTopColor: 'var(--red-vivid)' }} />
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default MemberList;
