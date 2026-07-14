import React, { useEffect, useState } from 'react';

interface SplashProps {
  onFinish: () => void;
}

const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  const [fading, setFading] = useState(false);

  const finish = () => {
    setFading(true);
    setTimeout(onFinish, 250);
  };

  useEffect(() => {
    const failsafe = setTimeout(finish, 8000);
    return () => clearTimeout(failsafe);
  }, []);

  return (
    <div
      onClick={finish}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.25s ease',
        cursor: 'pointer',
      }}
    >
      <video
        src="/splash.mp4"
        autoPlay
        muted
        playsInline
        onEnded={finish}
        onError={finish}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
};

export default Splash;
