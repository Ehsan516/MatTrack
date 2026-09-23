import React from 'react';

export const LogoMark: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <div className="logo-mark" style={{ width: size, height: size, borderRadius: size * 0.28 }}>
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 19V6.5a1 1 0 0 1 1.7-.7L12 11.5l5.8-5.7a1 1 0 0 1 1.7.7V19" />
    </svg>
  </div>
);

export const Wordmark: React.FC<{ size?: string }> = ({ size }) => (
  <span className="nav-wordmark" style={size ? { fontSize: size } : undefined}>
    Mat<span>Track</span>
  </span>
);
