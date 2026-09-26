import React, { useState } from 'react';
import { Member, SportType, UserRole } from '../types';
import { dataService } from '../services/dataService';
import { SPORT_RANKS } from '../constants';
import { baseBelt, beltClass, BELT_FILTERS } from '../lib/rank';
import { useFeedback } from './ui/Feedback';
import Avatar from './ui/Avatar';
import Icon from './ui/Icon';

interface MemberListProps {
  members: Member[];
  sport: SportType;
  role: UserRole;
  clubId?: string;
  currentUserId: string;
  onRefresh: () => void;
}

const memberSince = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '';

const MemberList: React.FC<MemberListProps> = ({ members, sport, role, clubId, currentUserId, onRefresh }) => {
  const { toast, confirm } = useFeedback();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState('All');
  const [loading, setLoading] = useState<string | null>(null);

  const isOwner = role === UserRole.OWNER;
  const maxStripes = SPORT_RANKS[sport]?.maxStripes ?? 0;

  const handleRemove = async (member: Member) => {
    if (!clubId) return;
    const ok = await confirm({
      title: `Remove ${member.name}?`,
      message: "They'll lose access to this academy's timetable and announcements. They can rejoin with the academy code.",
      confirmLabel: 'Remove member',
    });
    if (!ok) return;

    setLoading(member.id);
    try {
      await dataService.removeMember(clubId, member.id);
      onRefresh();
      toast(`${member.name} removed`);
    } catch (err) {
      toast("Couldn't remove this member.", 'error');
    } finally {
      setLoading(null);
    }
  };

  // Coaches first, then by rank (highest first), then name.
  const rankOrder = SPORT_RANKS[sport]?.ranks ?? [];
  const sorted = [...members].sort((a, b) =>
    Number(b.role === 'OWNER') - Number(a.role === 'OWNER') ||
    rankOrder.indexOf(b.rank) - rankOrder.indexOf(a.rank) ||
    b.stripes - a.stripes ||
    a.name.localeCompare(b.name)
  );

  const filteredMembers = sorted.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterRank === 'All' || baseBelt(m.rank) === filterRank)
  );

  const countFor = (belt: string) => members.filter(m => baseBelt(m.rank) === belt).length;
  const beltFilters = sport === 'BJJ'
    ? [...BELT_FILTERS]
    : Array.from(new Set(members.map(m => baseBelt(m.rank))));

  return (
    <>
      <div className="row sb">
        <div>
          <h2 className="page-title">{isOwner ? 'Roster' : 'Team'}</h2>
          <p className="page-sub">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
        </div>
        <button onClick={onRefresh} className="btn-icon" aria-label="Refresh roster">
          <Icon name="refresh" size={17} />
        </button>
      </div>

      <div className="search-wrap">
        <span className="search-icon"><Icon name="search" size={17} /></span>
        <input
          type="search"
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="field"
          aria-label="Search members"
        />
      </div>

      <div className="scroll-x" role="group" aria-label="Filter by rank">
        <button onClick={() => setFilterRank('All')} className={`chip ${filterRank === 'All' ? 'active' : ''}`}>
          All <span className="chip-count">{members.length}</span>
        </button>
        {beltFilters.map(r => (
          <button key={r} onClick={() => setFilterRank(r)} className={`chip ${filterRank === r ? 'active' : ''}`}>
            {r} <span className="chip-count">{countFor(r)}</span>
          </button>
        ))}
      </div>

      {filteredMembers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="users" size={22} /></div>
          <p className="empty-state-title">No members found</p>
          <p>Try a different name or rank filter.</p>
        </div>
      ) : (
        <div className="card">
          {filteredMembers.map(m => (
            <div key={m.id} className="member-row">
              <Avatar name={m.name} src={m.avatar_url} size={42} />
              <div className="flex-1">
                <div className="row gap-2">
                  <h4 className="member-name truncate">{m.name}</h4>
                  {m.id === currentUserId && <span className="badge">You</span>}
                  {m.role === 'OWNER' && <span className="badge blue">Coach</span>}
                </div>
                <div className="row gap-2 mt-1" style={{ flexWrap: 'wrap' }}>
                  <span className={`belt ${beltClass(m.rank)}`}>{m.rank.replace(' Belt', '')}</span>
                  {maxStripes > 0 && (
                    <span className="stripes" aria-label={`${m.stripes} stripes`}>
                      {Array.from({ length: maxStripes }, (_, i) => (
                        <span key={i} className={`stripe ${i < m.stripes ? 'on' : 'off'}`} />
                      ))}
                    </span>
                  )}
                </div>
              </div>
              <div className="col" style={{ alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{m.totalSessions}</span>
                <span className="member-sub">sessions</span>
              </div>
              {isOwner && m.role !== 'OWNER' && (
                <button
                  onClick={() => handleRemove(m)}
                  disabled={!!loading}
                  className="btn-icon plain danger"
                  style={{ width: 36, height: 36, color: 'var(--ink-300)' }}
                  aria-label={`Remove ${m.name}`}
                  title={`Member since ${memberSince(m.joinDate)}`}
                >
                  {loading === m.id ? <div className="spinner sm" /> : <Icon name="trash" size={16} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default MemberList;
