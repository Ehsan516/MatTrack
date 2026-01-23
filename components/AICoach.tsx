
import React, { useState } from 'react';
import { getAITrainingAdvice } from '../services/geminiService';
import { UserRole, SportType } from '../types';

interface AICoachProps {
  sport: SportType;
  role: UserRole;
  isPremium: boolean;
  onUpgrade: () => void;
}

const AICoach: React.FC<AICoachProps> = ({ sport, role, isPremium, onUpgrade }) => {
  const [goal, setGoal] = useState('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetAdvice = async () => {
    if (!isPremium) return;
    if (!goal) return;
    setLoading(true);
    const result = await getAITrainingAdvice(sport, 'Purple', goal); 
    setAdvice(result);
    setLoading(false);
  };

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-500/20 rounded-3xl flex items-center justify-center text-amber-500">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <div className="max-w-xs">
          <h2 className="text-2xl font-bold">Premium Content</h2>
          <p className="text-slate-400 mt-2">Personalized AI coaching, drill generation, and technique logs are exclusive to Premium members.</p>
        </div>
        <button 
          onClick={onUpgrade}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-4 px-10 rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95"
        >
          Upgrade for £4.99/mo
        </button>
        <p className="text-[10px] text-slate-600">Cancel anytime. 100% of revenue goes to platform development.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 3l1.912 5.886L20 10l-5.088 1.114L13 17l-1.912-5.886L6 10l5.088-1.114L12 3z"/></svg>
        </div>
        <div>
          <h2 className="text-xl font-bold">MatTrack AI Coach</h2>
          <p className="text-slate-400 text-sm">Welcome to your Premium training partner</p>
        </div>
      </header>

      <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">What are you working on?</span>
          <textarea 
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Improving my triangle escapes, better judo takedowns..."
            className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none h-32 resize-none transition-all"
          ></textarea>
        </label>
        
        <button 
          onClick={handleGetAdvice}
          disabled={loading || !goal}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
          ) : "Generate Coach Advice"}
        </button>
      </section>

      {advice && (
        <section className="bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-2xl animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">AI</div>
            <h3 className="font-bold text-indigo-400">Coach's Perspective</h3>
          </div>
          <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
            {advice}
          </div>
        </section>
      )}
    </div>
  );
};

export default AICoach;
