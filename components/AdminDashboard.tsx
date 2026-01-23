
import React from 'react';

const AdminDashboard: React.FC = () => {
  const platformStats = {
    totalSubscribers: 142,
    mrr: 708.58, // 142 * 4.99
    activeClubs: 89,
    growth: '+12%',
    pendingPayout: 540.20
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="bg-slate-900 border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">MatTrack Platform Admin</h2>
          <h1 className="text-3xl font-black mt-1">Creator Dashboard</h1>
          <p className="text-slate-400 text-sm mt-2">Managing your global grappling platform.</p>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <svg className="w-20 h-20 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v16m-6 0a2 2 0 002 2h2a2 2 0 002-2" /></svg>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-500 text-xs font-bold uppercase">Monthly Recurring Revenue</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-bold">£{platformStats.mrr.toFixed(2)}</h3>
            <span className="text-emerald-400 text-xs font-bold">{platformStats.growth}</span>
          </div>
          <p className="text-[10px] text-slate-600 mt-4">Calculated from {platformStats.totalSubscribers} Premium users at £4.99/mo</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-500 text-xs font-bold uppercase">Next Payout (to your bank)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-bold text-indigo-400">£{platformStats.pendingPayout.toFixed(2)}</h3>
          </div>
          <p className="text-[10px] text-slate-600 mt-4">Scheduled for Friday. Processing via App Store/Google Play.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-sm">Recent Store Transactions</h3>
          <button className="text-xs text-indigo-400 font-bold">Export CSV</button>
        </div>
        <div className="divide-y divide-slate-800">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" /></svg>
                </div>
                <div>
                  <p className="font-bold">New Subscription</p>
                  <p className="text-[10px] text-slate-500">Club ID: #00{i}84 • Apple IAP</p>
                </div>
              </div>
              <p className="font-bold text-emerald-400">+£4.99</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
        <h4 className="text-xs font-bold text-indigo-400 uppercase">Pro Tip for the Creator</h4>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          To receive these funds, ensure your **Apple Developer** and **Google Play Console** accounts are verified and your bank details are set up in their respective "Agreements, Tax, and Banking" sections. The code in the app simply triggers their native payment screens.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
