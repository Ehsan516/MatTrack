import React, { useState, useRef } from 'react';
import { UserRole, SportType, Member } from '../types';
import { SPORT_RANKS } from '../constants';
import { dataService } from '../services/dataService';
import { beltClass } from '../lib/rank';
import { useFeedback } from './ui/Feedback';
import Avatar from './ui/Avatar';
import Icon, { IconName } from './ui/Icon';
import Modal from './ui/Modal';

interface ProfileProps {
  userId: string;
  role: UserRole;
  profileData: any;
  onRefreshProfile: () => void;
  members: Member[];
  club?: any;
  onClubAction: () => void;
}

const Profile: React.FC<ProfileProps> = ({
  userId,
  role,
  profileData,
  onRefreshProfile,
  members,
  club,
  onClubAction
}) => {
  const { toast } = useFeedback();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeModal, setActiveModal] = useState<'security' | 'transfer' | 'delete_club' | 'delete_account' | 'rank' | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string | null>(null);

  const clubName = club?.name || 'Academy';
  const username = profileData?.username || 'Grappler';
  const sport: SportType = (club?.sport as SportType) || 'BJJ';
  const rankDef = SPORT_RANKS[sport];
  const otherMembers = members.filter(m => m.id !== userId);
  const currentRank = profileData?.rank || 'White';
  const stripes = profileData?.stripes || 0;

  const isActualOwner = role?.toString().toUpperCase() === 'OWNER';
  const subTitle = isActualOwner ? `Owner · ${clubName}` : `Member · ${clubName}`;

  const openModal = (modal: typeof activeModal) => {
    setConfirmText('');
    setActiveModal(modal);
  };

  const handleUpdateStripes = async (count: number) => {
    try {
      await dataService.updateProfile(userId, { stripes: count });
      await onRefreshProfile();
    } catch (err: any) {
      toast(err?.message || "Couldn't update stripes.", 'error');
    }
  };

  const handleUpdateRank = async (rank: string) => {
    try {
      await dataService.updateProfile(userId, { rank });
      setActiveModal(null);
      await onRefreshProfile();
      toast(`${rankDef.labelType} updated to ${rank}`);
    } catch (err: any) {
      toast(err?.message || "Couldn't update your rank.", 'error');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file.', 'error');
      return;
    }

    setLoading(true);
    try {
      const avatarUrl = await dataService.uploadAvatar(userId, file);
      await dataService.updateProfile(userId, { avatar_url: avatarUrl });
      await onRefreshProfile();
      toast('Profile photo updated');
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      toast(err?.message || "Couldn't upload that photo.", 'error');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(club?.custom_id ?? '');
      toast('Academy code copied');
    } catch {
      toast(`Academy code: ${club?.custom_id}`, 'info');
    }
  };

  const handleTransferOwnership = async () => {
    if (!club || !selectedNewOwner) return;
    setLoading(true);
    try {
      await dataService.transferClubOwnership(club.id, selectedNewOwner);
      toast('Ownership transferred. You are now a member.');
      onClubAction();
      setActiveModal(null);
    } catch (err) {
      toast("Couldn't transfer ownership.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!club) return;
    setLoading(true);
    try {
      await dataService.deleteClub(club.id);
      toast(`${clubName} deleted`);
      onClubAction();
      setActiveModal(null);
    } catch (err) {
      toast("Couldn't delete the academy.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await dataService.deleteAccount();
      toast('Account deleted');
      await dataService.signOut();
    } catch (err: any) {
      toast(err?.message || "Couldn't delete your account.", 'error');
    } finally {
      setLoading(false);
      setActiveModal(null);
    }
  };

  const handleSendReset = async () => {
    setLoading(true);
    try {
      const email = await dataService.getSessionEmail();
      if (!email) throw new Error('No email address on this account.');
      await dataService.sendPasswordReset(email);
      toast(`Reset link sent to ${email}`);
      setActiveModal(null);
    } catch (err: any) {
      toast(err?.message || "Couldn't send the reset link.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try { await dataService.signOut(); }
    catch (err) { console.error("Sign out error", err); }
    finally { setLoading(false); }
  };

  const startTransfer = () => {
    if (otherMembers.length === 0) {
      toast('There are no other members to hand the academy to.', 'error');
      return;
    }
    setSelectedNewOwner(null);
    openModal('transfer');
  };

  return (
    <>
      <section className="card card-p col" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 28 }}>
        <div className="relative">
          <Avatar name={username} src={profileData?.avatar_url} size={88} className="avatar-ring" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="btn-icon"
            style={{ position: 'absolute', bottom: -2, right: -6, width: 34, height: 34, borderRadius: '50%', background: 'var(--btn-blue)', color: '#fff', border: '3px solid var(--sand-50)' }}
            aria-label="Change profile photo"
          >
            <Icon name="camera" size={15} />
          </button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
        </div>
        <h2 className="page-title" style={{ fontSize: '1.3125rem', marginTop: 16 }}>{username}</h2>
        <p className="page-sub">{subTitle}</p>

        <div className="card-inset col gap-3 w-full" style={{ marginTop: 20, padding: 14, alignItems: 'stretch', textAlign: 'left' }}>
          <div className="row sb">
            <div>
              <p className="section-lbl">{rankDef.labelType}</p>
              <span className={`belt lg ${beltClass(currentRank)}`} style={{ marginTop: 6 }}>{currentRank}</span>
            </div>
            <button onClick={() => openModal('rank')} className="btn btn-ghost btn-sm">Change</button>
          </div>
          {rankDef.maxStripes > 0 && (
            <div className="row sb" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <div>
                <p className="section-lbl">Stripes</p>
                <p className="muted" style={{ fontSize: '0.8125rem', marginTop: 2 }}>{stripes} of {rankDef.maxStripes} · tap to set</p>
              </div>
              <div className="stripes editable" role="group" aria-label="Stripes">
                {Array.from({ length: rankDef.maxStripes }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => handleUpdateStripes(n === stripes ? n - 1 : n)}
                    className={`stripe ${n <= stripes ? 'on' : 'off'}`}
                    aria-label={`Set ${n} stripe${n === 1 ? '' : 's'}`}
                    aria-pressed={n <= stripes}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {club && (
        <section className="card">
          <div className="card-header">Academy</div>
          <div className="list-row" style={{ cursor: 'default' }}>
            <div className="row gap-3 flex-1">
              <span className="list-icon"><Icon name="building" size={17} /></span>
              <div className="flex-1">
                <p className="list-label truncate">{clubName}</p>
                <p className="list-detail">{members.length} members · {sport}</p>
              </div>
            </div>
          </div>
          <div className="list-row" style={{ cursor: 'default' }}>
            <div className="row gap-3 flex-1">
              <span className="list-icon"><Icon name="users" size={17} /></span>
              <div className="flex-1">
                <p className="list-label">Academy code</p>
                <p className="list-detail" style={{ fontFamily: "'DM Mono', monospace" }}>{club.custom_id}</p>
              </div>
            </div>
            <button onClick={handleCopyCode} className="btn btn-ghost btn-sm">Copy</button>
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-header">Settings</div>
        <div className="list-row" onClick={() => setNotifEnabled(!notifEnabled)}>
          <div className="row gap-3 flex-1">
            <span className="list-icon"><Icon name="bell" size={17} /></span>
            <div>
              <p className="list-label">Notifications</p>
              <p className="list-detail">Announcements and class reminders</p>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setNotifEnabled(!notifEnabled); }}
            className={`toggle ${notifEnabled ? 'on' : 'off'}`}
            role="switch"
            aria-checked={notifEnabled}
            aria-label="Notifications"
          >
            <span className="toggle-knob" />
          </button>
        </div>
        <SettingsRow icon="shield" label="Password" detail="Send a reset link to your email" onClick={() => openModal('security')} />
      </section>

      <section className="card">
        <div className="card-header" style={{ color: 'var(--red-vivid)' }}>Danger zone</div>
        {isActualOwner && (
          <SettingsRow danger icon="users" label="Transfer ownership" detail="Hand the academy to another member" onClick={startTransfer} />
        )}
        {isActualOwner && (
          <SettingsRow danger icon="building" label="Delete academy" detail="Removes the timetable, roster and history" onClick={() => openModal('delete_club')} />
        )}
        <SettingsRow danger icon="trash" label="Delete account" detail="Permanently erase your profile and data" onClick={() => openModal('delete_account')} />
      </section>

      <button onClick={handleSignOut} disabled={loading} className="btn btn-ghost btn-full">
        <Icon name="logout" size={17} /> Sign out
      </button>

      {activeModal === 'rank' && (
        <Modal onClose={() => setActiveModal(null)} title={`Change ${rankDef.labelType.toLowerCase()}`} description="Pick your current rank. Your coach and teammates will see it on the roster.">
          <div className="card" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
            {rankDef.ranks.map(r => (
              <button key={r} onClick={() => handleUpdateRank(r)} className="list-row" style={{ minHeight: 48 }}>
                <span className={`belt ${beltClass(r)}`}>{r}</span>
                {r === currentRank && <span style={{ color: 'var(--blue-vivid)', display: 'flex' }}><Icon name="check" size={18} /></span>}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {activeModal === 'transfer' && (
        <Modal onClose={() => setActiveModal(null)} icon="users" title="Transfer ownership" description={`Choose who will run ${clubName}. You'll stay on as a member.`}>
          <div className="col gap-2" style={{ maxHeight: 280, overflowY: 'auto', padding: 2 }}>
            {otherMembers.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedNewOwner(m.id)}
                className={`card row gap-3 ${selectedNewOwner === m.id ? 'selected' : ''}`}
                style={{ padding: '10px 12px' }}
                aria-pressed={selectedNewOwner === m.id}
              >
                <Avatar name={m.name} src={m.avatar_url} size={34} />
                <span className="flex-1 member-name">{m.name}</span>
                <span className={`belt ${beltClass(m.rank)}`}>{m.rank}</span>
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button onClick={() => setActiveModal(null)} className="btn btn-ghost">Cancel</button>
            <button onClick={handleTransferOwnership} disabled={!selectedNewOwner || loading} className="btn btn-primary">Transfer</button>
          </div>
        </Modal>
      )}

      {activeModal === 'delete_club' && (
        <Modal
          onClose={() => setActiveModal(null)}
          icon="alert"
          tone="danger"
          title={`Delete ${clubName}?`}
          description="This permanently deletes the academy's timetable, roster, recaps and announcements. It can't be undone."
        >
          <div>
            <label className="field-label" htmlFor="confirm-club">Type <strong>{clubName}</strong> to confirm</label>
            <input id="confirm-club" className="field" value={confirmText} onChange={e => setConfirmText(e.target.value)} autoComplete="off" />
          </div>
          <div className="modal-actions">
            <button onClick={() => setActiveModal(null)} className="btn btn-ghost">Cancel</button>
            <button onClick={handleDeleteClub} disabled={confirmText.trim() !== clubName || loading} className="btn btn-danger">Delete academy</button>
          </div>
        </Modal>
      )}

      {activeModal === 'delete_account' && (
        isActualOwner && members.length > 1 ? (
          <Modal
            onClose={() => setActiveModal(null)}
            icon="alert"
            tone="danger"
            title="Hand over your academy first"
            description={`You own ${clubName}, which still has other members. Transfer ownership or delete the academy before deleting your account.`}
          >
            <button onClick={startTransfer} className="btn btn-primary btn-full">Transfer ownership</button>
            <button onClick={() => openModal('delete_club')} className="btn btn-ghost btn-full" style={{ color: 'var(--red-vivid)' }}>Delete academy</button>
          </Modal>
        ) : (
          <Modal
            onClose={() => setActiveModal(null)}
            icon="alert"
            tone="danger"
            title="Delete your account?"
            description="Your profile, rank history and bookings will be permanently erased."
          >
            <div>
              <label className="field-label" htmlFor="confirm-delete">Type <strong>DELETE</strong> to confirm</label>
              <input id="confirm-delete" className="field" value={confirmText} onChange={e => setConfirmText(e.target.value)} autoComplete="off" />
            </div>
            <div className="modal-actions">
              <button onClick={() => setActiveModal(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={confirmText !== 'DELETE' || loading} className="btn btn-danger">Delete account</button>
            </div>
          </Modal>
        )
      )}

      {activeModal === 'security' && (
        <Modal onClose={() => setActiveModal(null)} icon="mail" title="Reset your password" description="We'll email you a secure link to choose a new password.">
          <div className="modal-actions">
            <button onClick={() => setActiveModal(null)} className="btn btn-ghost">Cancel</button>
            <button onClick={handleSendReset} disabled={loading} className="btn btn-primary">{loading ? 'Sending…' : 'Send link'}</button>
          </div>
        </Modal>
      )}
    </>
  );
};

const SettingsRow: React.FC<{ icon: IconName; label: string; detail: string; onClick: () => void; danger?: boolean }> = ({ icon, label, detail, onClick, danger }) => (
  <button onClick={onClick} className={`list-row ${danger ? 'list-row-danger' : ''}`}>
    <div className="row gap-3 flex-1">
      <span className="list-icon"><Icon name={icon} size={17} /></span>
      <div>
        <p className="list-label">{label}</p>
        <p className="list-detail">{detail}</p>
      </div>
    </div>
    <span className="chevron"><Icon name="chevronRight" size={18} /></span>
  </button>
);

export default Profile;
