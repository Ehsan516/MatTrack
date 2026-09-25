import React, { useState } from 'react';
import { AuthStep } from '../types';
import { dataService } from '../services/dataService';
import { IS_DEMO } from '../services/config';
import { useFeedback } from './ui/Feedback';
import Icon from './ui/Icon';
import { LogoMark, Wordmark } from './ui/Logo';

interface AuthProps {
  onComplete: () => void;
}

const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  const { toast } = useFeedback();
  const [step, setStep] = useState<AuthStep>('LOGIN');
  const [email, setEmail] = useState(IS_DEMO ? 'alex@northside-bjj.com' : '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(IS_DEMO ? 'demo-password' : '');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchStep = (next: AuthStep) => {
    setError(null);
    setStep(next);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await dataService.verifyEmail(email, verificationCode);
      onComplete();
    } catch (err: any) {
      setError(err.message || "That code didn't work. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await dataService.resendVerification(email);
      toast(`New code sent to ${email}`);
    } catch (err: any) {
      toast(err.message || "Couldn't resend the code.", 'error');
    } finally {
      setResending(false);
    }
  };

  const errorBox = error && (
    <div className="form-error" role="alert">
      <Icon name="alert" size={16} />
      <span>{error}</span>
    </div>
  );

  return (
    <div className="shell centered">
      <div className="col screen-enter" style={{ width: '100%', maxWidth: 360, gap: 28 }}>
        <div className="row gap-3" style={{ justifyContent: 'center' }}>
          <LogoMark size={40} />
          <Wordmark size="1.5rem" />
        </div>

        <div className="card" style={{ padding: 24 }}>
          {step === 'VERIFY' ? (
            <form className="col gap-4" onSubmit={handleVerify}>
              <div>
                <div className="modal-icon blue"><Icon name="mail" size={22} /></div>
                <h1 className="modal-title" style={{ fontSize: '1.25rem' }}>Check your email</h1>
                <p className="modal-desc">
                  Enter the 6-digit code we sent to <strong style={{ color: 'var(--ink-900)' }}>{email}</strong>.
                </p>
              </div>
              {errorBox}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="000000"
                className="field code"
                aria-label="Verification code"
                autoFocus
              />
              <button type="submit" disabled={loading || verificationCode.length < 6} className="btn btn-primary btn-full">
                {loading ? 'Verifying…' : 'Verify email'}
              </button>
              <div className="row sb">
                <button type="button" onClick={() => switchStep('SIGNUP')} className="link-btn">
                  Back
                </button>
                <button type="button" onClick={handleResend} disabled={resending} className="link-btn accent">
                  {resending ? 'Sending…' : 'Resend code'}
                </button>
              </div>
            </form>
          ) : (
            <form className="col gap-4" onSubmit={handleAuth}>
              <div>
                <h1 className="modal-title" style={{ fontSize: '1.25rem' }}>
                  {step === 'LOGIN' ? 'Sign in' : 'Create your account'}
                </h1>
                <p className="modal-desc" style={{ marginTop: 4 }}>
                  {step === 'LOGIN' ? 'Welcome back. Pick up where you left off.' : 'Track your training and book classes at your academy.'}
                </p>
              </div>

              {IS_DEMO && step === 'LOGIN' && (
                <div className="badge blue" style={{ whiteSpace: 'normal', padding: '8px 12px', borderRadius: 'var(--radius-md)', lineHeight: 1.4 }}>
                  Demo mode: sample data, nothing is saved. Just press Sign in.
                </div>
              )}

              {errorBox}

              <div className="col gap-3">
                {step === 'SIGNUP' && (
                  <div>
                    <label className="field-label" htmlFor="auth-name">Full name</label>
                    <input id="auth-name" type="text" autoComplete="name" value={username} onChange={e => setUsername(e.target.value)} placeholder="Alex Morgan" className="field" />
                  </div>
                )}
                <div>
                  <label className="field-label" htmlFor="auth-email">Email</label>
                  <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
                </div>
                <div>
                  <label className="field-label" htmlFor="auth-password">Password</label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={step === 'SIGNUP' ? 6 : undefined}
                    autoComplete={step === 'LOGIN' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={step === 'SIGNUP' ? 'At least 6 characters' : '••••••••'}
                    className="field"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary btn-full">
                {loading ? (step === 'LOGIN' ? 'Signing in…' : 'Creating account…') : step === 'LOGIN' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          )}
        </div>

        {step !== 'VERIFY' && (
          <p className="muted" style={{ textAlign: 'center', fontSize: '0.875rem' }}>
            {step === 'LOGIN' ? "New to MatTrack? " : 'Already have an account? '}
            <button onClick={() => switchStep(step === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="link-btn accent" style={{ padding: 0, minHeight: 0, fontSize: 'inherit' }}>
              {step === 'LOGIN' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
