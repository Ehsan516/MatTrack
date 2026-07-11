import React, { useState } from 'react';
import { AuthStep } from '../types';
import { dataService } from '../services/dataService';

interface AuthProps {
  onComplete: () => void;
}

const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  const [step, setStep] = useState<AuthStep>('LOGIN');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      if (step === 'SIGNUP') {
        await dataService.signUp(email, password, username || 'Grappler');
        setStep('VERIFY');
      } else if (step === 'LOGIN') {
        const { user } = await dataService.signIn(email, password);
        if (user) {
          onComplete();
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      await dataService.verifyEmail(email, verificationCode);
      onComplete();
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await dataService.resendVerification(email);
      alert("Verification code resent to your email.");
    } catch (err: any) {
      alert(err.message || "Resend failed.");
    } finally {
      setResending(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'LOGIN':
      case 'SIGNUP':
        return (
          <div className="col gap-4" style={{ width: '100%' }}>
            <div className="col gap-2" style={{ textAlign: 'center' }}>
              <h1 className="modal-title" style={{ fontSize: '1.5rem' }}>
                {step === 'LOGIN' ? 'Welcome Back' : 'Join the Mat'}
              </h1>
              {error && <p className="badge red" style={{ justifyContent: 'center', padding: '8px 12px', whiteSpace: 'normal' }}>{error}</p>}
            </div>

            <div className="col gap-3">
              {step === 'SIGNUP' && (
                <div>
                  <label className="field-label">Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="jiujitsu_joe" className="field" />
                </div>
              )}
              <div>
                <label className="field-label">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="grappler@email.com" className="field" />
              </div>
              <div>
                <label className="field-label">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="field" />
              </div>
            </div>

            <button onClick={handleAuth} disabled={loading} className="btn btn-primary btn-full">
              {loading ? 'Processing...' : step === 'LOGIN' ? 'Sign In' : 'Create Account'}
            </button>

            <button onClick={() => setStep(step === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="link-btn" style={{ alignSelf: 'center' }}>
              {step === 'LOGIN' ? 'No account? Create profile' : 'Already on MatTrack? Log In'}
            </button>
          </div>
        );

      case 'VERIFY':
        return (
          <div className="col gap-5" style={{ width: '100%' }}>
            <div className="col gap-3" style={{ textAlign: 'center', alignItems: 'center' }}>
              <div className="modal-icon blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <h1 className="modal-title">Check Inbox</h1>
                <p className="modal-desc" style={{ marginBottom: 0, marginTop: 4 }}>Enter the 6-digit code sent to <span style={{ color: 'var(--blue-vivid)', fontWeight: 700 }}>{email}</span></p>
              </div>
              {error && <p className="badge red" style={{ justifyContent: 'center', padding: '8px 12px' }}>{error}</p>}
            </div>

            <div className="col gap-4" style={{ textAlign: 'center' }}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="000000"
                className="field"
                style={{ textAlign: 'center', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '0.3em', height: 76, borderRadius: 24 }}
              />

              <button onClick={handleVerify} disabled={loading || verificationCode.length < 6} className="btn btn-primary btn-full">
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div className="col">
                <button onClick={handleResend} disabled={resending} className="link-btn">
                  {resending ? 'Resending Code...' : "Didn't get a code? Resend"}
                </button>
                <button onClick={() => setStep('SIGNUP')} className="link-btn">
                  Back to Signup
                </button>
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="shell" style={{ alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-20%', width: '60%', height: '60%', background: 'var(--blue-light)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <div className="col" style={{ alignItems: 'center', marginBottom: 40, position: 'relative' }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--blue-vivid)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 8px 24px rgba(37,99,235,0.35)' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M2 3h20"/><path d="M5 3v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3"/></svg>
        </div>
        <span className="nav-wordmark" style={{ fontSize: '1.5rem' }}>Mat<span>Track</span></span>
      </div>
      <div className="relative" style={{ width: '100%', maxWidth: 340, display: 'flex', justifyContent: 'center' }}>{renderStep()}</div>
    </div>
  );
};

export default Auth;
