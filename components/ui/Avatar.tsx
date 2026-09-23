import React from 'react';

const HUES = [214, 262, 190, 152, 28, 340, 12, 236];

const initialsOf = (name: string) =>
  name
    .replace(/^coach\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]!.toUpperCase())
    .join('') || '?';

const hueOf = (name: string) => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return HUES[Math.abs(hash) % HUES.length];
};

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

/** Shows the uploaded photo when there is one, otherwise coloured initials. */
const Avatar: React.FC<AvatarProps> = ({ name, src, size = 40, className = '' }) => {
  if (src) {
    return <img src={src} alt={name} className={`avatar ${className}`} style={{ width: size, height: size }} />;
  }
  const hue = hueOf(name);
  return (
    <div
      role="img"
      aria-label={name}
      className={`avatar avatar-initials ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        ['--avatar-hue' as string]: hue,
      }}
    >
      {initialsOf(name)}
    </div>
  );
};

export default Avatar;
