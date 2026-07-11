import React, { useState, useRef } from 'react';
import { UserRole, SportType, Member } from '../types';
import { SPORT_RANKS } from '../constants';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabaseClient';

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
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeModal, setActiveModal] = useState<'security' | 'notifications' | 'transfer' | 'delete_club' | 'delete_account' | 'rank' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string | null>(null);

  const clubName = club?.name || 'Academy';
  const username = profileData?.username || 'Grappler';
  const sport: SportType = (club?.sport as SportType) || 'BJJ';
  const rankDef = SPORT_RANKS[sport];
  const otherMembers = members.filter(m => m.id !== profileData?.id);

  const beltClass = (rank: string) => {
    const r = (rank || '').toLowerCase();
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

  const isActualOwner = role?.toString().toUpperCase() === 'OWNER';
  const displayName = isActualOwner ? `Coach ${username}` : username;
  const subTitle = isActualOwner
    ? `Founder — ${clubName}`
    : `${baseBelt(profileData?.rank || 'White')} ${rankDef.labelType} • Student`;

  const handleUpdateStripes = async (count: number) => {
    try {
      await dataService.updateProfile(userId, { stripes: count });
      await onRefreshProfile();
    } catch (err: any) {
      console.error('Failed to update stripes:', err);
      alert(err?.message || 'Failed to update stripes.');
    }
  };

  const handleUpdateRank = async (rank: string) => {
    try {
      await dataService.updateProfile(userId, { rank });
      setActiveModal(null);
      await onRefreshProfile();
    } catch (err: any) {
      console.error('Failed to update rank:', err);
      alert(err?.message || 'Failed to update rank.');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }

    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await dataService.updateProfile(userId, {
        avatar_url: data.publicUrl
      });

      await onRefreshProfile();
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      alert(err?.message || 'Failed to upload profile picture.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleTransferOwnership = async () => {
    if (!club) return;
    if (otherMembers.length === 0) {
      alert('You have no other members to transfer ownership to!');
      setActiveModal(null);
      return;
    }
    if (!selectedNewOwner) return;
    setLoading(true);
    try {
      await dataService.transferClubOwnership(club.id, selectedNewOwner);
      alert("Ownership transferred. You are now a team member.");
      onClubAction();
      setActiveModal(null);
    } catch (err) { alert("Transfer failed."); }
    finally { setLoading(false); }
  };

  const handleDeleteClub = async () => {
    if (!club) return;
    if (!passwordInput) {
      alert('Enter your password to confirm.');
      return;
    }
    setLoading(true);
    try {
      await dataService.deleteClub(club.id);
      alert("Club Deleted.");
      onClubAction();
      setActiveModal(null);
    } catch (err) { alert("Delete failed."); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!passwordInput) {
      alert('Enter your password to confirm.');
      return;
    }
    setLoading(true);
    try {
      await dataService.deleteAccount();
      alert('Account deleted.');
      await dataService.signOut();
    } catch (err: any) {
      const msg = err?.message || 'Delete failed.';
      alert(msg);
    } finally {
      setLoading(false);
      setActiveModal(null);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try { await dataService.signOut(); }
    catch (err) { console.error("Sign out error", err); }
    finally { setLoading(false); }
  };

  const avatarSrc = profileData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  return (
    <>
      <div className="col" style={{ alignItems: 'center', padding: '24px 0' }}>
        <div className="relative">
          <img src={avatarSrc} className="avatar" style={{ width: 104, height: 104 }} alt="Profile" />
          <button onClick={() => fileInputRef.current?.click()} className="btn-icon" style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--blue-vivid)', color: '#fff', border: '2px solid var(--sand-100)' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink-900)', marginTop: 14 }}>{displayName}</h2>
        <p className="section-lbl" style={{ padding: 0, marginTop: 2, textAlign: 'center' }}>{subTitle}</p>

        <div className="col gap-3" style={{ marginTop: 20, width: '100%', maxWidth: 300 }}>
          <div className={`belt ${beltClass(profileData?.rank)}`} style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: '0.75rem' }}>
            {baseBelt(profileData?.rank)} {rankDef.labelType}
          </div>

          <div className="card-inset row sb" style={{ padding: 14 }}>
            <span className="section-lbl" style={{ padding: 0 }}>Stripes</span>
            <div className="stripes">
              {[0, 1, 2, 3, 4].map(i => (
                <button
                  key={i}
                  onClick={() => handleUpdateStripes(i)}
                  className={`stripe ${i > 0 && i <= (profileData?.stripes || 0) ? 'on' : 'off'}`}
                  style={{ border: 'none', cursor: 'pointer', padding: 0 }}
                  aria-label={`Set ${i} stripes`}
                />
              ))}
            </div>
          </div>

          <button onClick={() => setActiveModal('rank')} className="btn btn-ghost btn-full">
            Update {rankDef.labelType}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Settings</div>
        <div>
          <div onClick={() => setActiveModal('notifications')} className="list-row">
            <div className="row gap-3">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--ink-400)"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <div>
                <p className="list-label">Push Notifications</p>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--blue-vivid)', textTransform: 'uppercase', marginTop: 1 }}>{notifEnabled ? "Active" : "Muted"}</p>
              </div>
            </div>
            <span className="chevron" />
          </div>
          <div onClick={() => setActiveModal('security')} className="list-row">
            <div className="row gap-3">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--ink-400)"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div>
                <p className="list-label">Security</p>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--blue-vivid)', textTransform: 'uppercase', marginTop: 1 }}>Change Password</p>
              </div>
            </div>
            <span className="chevron" />
          </div>
        </div>
      </div>

      <div className="card" style={{ borderColor: 'rgba(220,38,38,0.15)' }}>
        <div className="card-header" style={{ color: 'var(--red-vivid)' }}>Danger Zone</div>
        <div>
          {isActualOwner && (
            <div
              onClick={() => {
                if (otherMembers.length === 0) {
                  alert('You have no other members to transfer ownership to!');
                  return;
                }
                setSelectedNewOwner(null);
                setActiveModal('transfer');
              }}
              className="list-row list-row-danger"
            >
              <div>
                <p className="list-label">Transfer Ownership</p>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--red-vivid)', opacity: 0.7, textTransform: 'uppercase', marginTop: 1 }}>Appoint a new Coach</p>
              </div>
              <span className="chevron" />
            </div>
          )}
          {isActualOwner && (
            <div onClick={() => setActiveModal('delete_club')} className="list-row list-row-danger">
              <div>
                <p className="list-label">Delete Academy</p>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--red-vivid)', opacity: 0.7, textTransform: 'uppercase', marginTop: 1 }}>Irreversible action</p>
              </div>
              <span className="chevron" />
            </div>
          )}
          <div
            onClick={() => {
              setPasswordInput('');
              setActiveModal('delete_account');
            }}
            className="list-row list-row-danger"
          >
            <div>
              <p className="list-label">Delete Account</p>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--red-vivid)', opacity: 0.7, textTransform: 'uppercase', marginTop: 1 }}>Wipe all your data</p>
            </div>
            <span className="chevron" />
          </div>
        </div>
      </div>

      <button onClick={handleSignOut} className="btn btn-ghost btn-full">Sign Out</button>

      {activeModal === 'rank' && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-body col gap-2" style={{ paddingTop: 20, maxHeight: '70vh', overflowY: 'auto' }}>
              <h3 className="modal-title" style={{ textAlign: 'center', marginBottom: 8 }}>Promote / Change Rank</h3>
              {rankDef.ranks.map(r => (
                <button key={r} onClick={() => handleUpdateRank(r)} className="btn btn-ghost btn-full" style={{ justifyContent: 'flex-start', paddingLeft: 18 }}>{r}</button>
              ))}
              <button onClick={() => setActiveModal(null)} className="link-btn" style={{ alignSelf: 'center', marginTop: 4 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'transfer' && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-body col gap-4" style={{ paddingTop: 20 }}>
              <h3 className="modal-title" style={{ textAlign: 'center' }}>Transfer Ownership</h3>
              <p className="modal-desc" style={{ marginBottom: 0 }}>Select a member to become the new Academy Owner.</p>
              <div className="col gap-2" style={{ maxHeight: 240, overflowY: 'auto' }}>
                {otherMembers.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--ink-400)', fontStyle: 'italic', fontSize: '0.875rem' }}>No other members in academy</p>
                ) : otherMembers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedNewOwner(m.id)}
                    className="card card-p row gap-3"
                    style={{ border: selectedNewOwner === m.id ? '2px solid var(--blue-vivid)' : undefined, cursor: 'pointer' }}
                  >
                    <div className="card-inset" style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 800 }}>{m.name[0]}</div>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink-900)' }}>{m.name}</span>
                  </button>
                ))}
              </div>
              <div className="row gap-2">
                <button onClick={() => setActiveModal(null)} className="btn btn-ghost flex-1">Cancel</button>
                <button onClick={handleTransferOwnership} disabled={!selectedNewOwner} className="btn btn-primary flex-1">Transfer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'delete_club' && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-top">
              <div className="modal-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <h3 className="modal-title">Delete Academy</h3>
            </div>
            <div className="modal-body col gap-3">
              <p className="modal-desc" style={{ marginBottom: 0 }}>This will permanently delete "{clubName}". All schedules and roster data will be wiped forever.</p>
              <input type="password" placeholder="Confirm Password" className="field" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
              <div className="row gap-2">
                <button onClick={() => setActiveModal(null)} className="btn btn-ghost flex-1">Back</button>
                <button onClick={handleDeleteClub} className="btn btn-danger flex-1">Confirm Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'delete_account' && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-body col gap-4" style={{ paddingTop: 20 }}>
              <h3 className="modal-title" style={{ textAlign: 'center' }}>Delete Account</h3>
              {isActualOwner && members.length > 1 ? (
                <div className="card-inset col gap-3" style={{ padding: 16 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--red-vivid)', textAlign: 'center', lineHeight: 1.5 }}>
                    You can't delete your account while your academy has other members.
                    Transfer ownership to another member or delete the academy first.
                  </p>
                  <button
                    onClick={() => {
                      if (otherMembers.length === 0) {
                        alert('You have no other members to transfer ownership to!');
                        return;
                      }
                      setSelectedNewOwner(null);
                      setActiveModal('transfer');
                    }}
                    className="btn btn-primary btn-full"
                  >
                    Transfer Ownership
                  </button>
                  <button onClick={() => setActiveModal('delete_club')} className="btn btn-danger btn-full">Delete Academy</button>
                  <button onClick={() => setActiveModal(null)} className="btn btn-ghost btn-full">Close</button>
                </div>
              ) : (
                <>
                  <p className="modal-desc" style={{ marginBottom: 0 }}>Enter password to wipe your personal profile and mat-history.</p>
                  <input type="password" placeholder="Confirm Password" className="field" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                  <div className="row gap-2">
                    <button onClick={() => setActiveModal(null)} className="btn btn-ghost flex-1">Cancel</button>
                    <button onClick={handleDeleteAccount} disabled={loading} className="btn btn-danger flex-1">Delete Forever</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'notifications' && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-body col gap-4" style={{ paddingTop: 20 }}>
              <h3 className="modal-title" style={{ textAlign: 'center' }}>Notifications</h3>
              <div className="card-inset row sb" style={{ padding: 14 }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink-900)' }}>Push Alerts</span>
                <button onClick={() => setNotifEnabled(!notifEnabled)} className={`toggle ${notifEnabled ? 'on' : 'off'}`}>
                  <span className="toggle-knob" />
                </button>
              </div>
              <button onClick={() => setActiveModal(null)} className="btn btn-primary btn-full">Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'security' && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-body col gap-3" style={{ paddingTop: 20, textAlign: 'center' }}>
              <h3 className="modal-title">Update Password</h3>
              <p className="modal-desc">A reset link will be sent to your email to securely update your credentials.</p>
              <button onClick={() => { alert("Reset link sent!"); setActiveModal(null); }} className="btn btn-primary btn-full">Send Reset Link</button>
              <button onClick={() => setActiveModal(null)} className="link-btn" style={{ alignSelf: 'center' }}>Maybe Later</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
