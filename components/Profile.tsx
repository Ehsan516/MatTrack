
import React, { useState } from 'react';
import { UserRole, BankDetails } from '../types';

interface ProfileProps {
  role: UserRole;
  isPremium: boolean;
  onUpgrade: () => void;
}

const Profile: React.FC<ProfileProps> = ({ role, isPremium, onUpgrade }) => {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountHolder: 'Marcus Aurelius',
    accountNumber: '**** 5678',
    sortCode: '20-40-60',
    bankName: 'Revolut Business',
    isConnected: true
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${role === UserRole.OWNER ? 'Master' : 'Student'}`} 
            className="w-24 h-24 rounded-full border-4 border-slate-900 bg-slate-800 shadow-xl" 
            alt="Profile" 
          />
          <button className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full border-2 border-slate-950 shadow-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </button>
        </div>
        <h2 className="text-xl font-bold mt-4">{role === UserRole.OWNER ? 'Coach Marcus' : 'Alex Grappler'}</h2>
        <p className="text-slate-500 text-sm">{role === UserRole.OWNER ? 'Founder • Elite Academy' : 'Blue Belt • Student'}</p>
        
        {isPremium && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-[10px] font-bold uppercase tracking-wider">Premium Member</span>
          </div>
        )}
      </div>

      {role === UserRole.MEMBER && !isPremium && (
        <section className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20">
          <h3 className="text-lg font-bold">Unlock AI Coaching</h3>
          <p className="text-indigo-100 text-sm mt-1">Get Gemini-powered game plans and advanced analytics for just £4.99/mo.</p>
          <button 
            onClick={onUpgrade}
            className="mt-4 bg-white text-indigo-600 font-bold py-2.5 px-6 rounded-xl hover:bg-indigo-50 transition-all active:scale-95"
          >
            Upgrade Now
          </button>
        </section>
      )}

      {role === UserRole.OWNER && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-300 uppercase text-xs tracking-widest">Academy Finances</h3>
            <span className="text-[10px] font-bold text-slate-500">MANUAL BILLING</span>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-400 leading-relaxed italic">
              Note: As a Club Owner, you use the basic management features for free. Advanced features are included for academy admins.
            </p>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-slate-300 uppercase text-xs tracking-widest">Subscription & Billing</h3>
        </div>
        <div className="divide-y divide-slate-800">
          <div className="p-4 hover:bg-slate-800 transition-colors cursor-pointer group flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-slate-500 group-hover:text-indigo-400 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold">Subscription Management</p>
                <p className="text-xs text-slate-500 italic">Handled by App Store / Play Store</p>
              </div>
            </div>
          </div>
          <SettingItem icon="restore" label="Restore Purchases" detail="Sync with Apple/Google ID" />
          <SettingItem icon="bell" label="Notification Settings" />
          <SettingItem icon="shield" label="Security & Privacy" />
        </div>
      </div>

      <button className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-2xl transition-all border border-red-500/20">
        Sign Out
      </button>
      
      <div className="text-center py-4">
        <p className="text-[10px] text-slate-600 font-medium">MatTrack v1.0.4 • Creator: @You</p>
      </div>
    </div>
  );
};

const SettingItem: React.FC<{ icon: string; label: string; detail?: string }> = ({ icon, label, detail }) => {
  const icons: any = {
    restore: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    bell: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    shield: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-800 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="text-slate-500 group-hover:text-indigo-400 transition-colors">{icons[icon]}</div>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          {detail && <p className="text-xs text-indigo-400 font-medium">{detail}</p>}
        </div>
      </div>
      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7"/></svg>
    </div>
  );
};

export default Profile;
