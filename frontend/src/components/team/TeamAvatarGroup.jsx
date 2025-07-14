import React from 'react';

const avatars = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/45.jpg',
  'https://randomuser.me/api/portraits/women/46.jpg',
  'https://randomuser.me/api/portraits/men/47.jpg',
  'https://randomuser.me/api/portraits/women/48.jpg',
];

export default function TeamAvatarGroup() {
  const max = 4;
  return (
    <div className="flex -space-x-2">
      {avatars.slice(0, max).map((src, i) => (
        <img key={i} src={src} alt="avatar" className="w-7 h-7 rounded-full border-2 border-white" />
      ))}
      {avatars.length > max && (
        <span className="w-7 h-7 rounded-full bg-primary/30 text-dark flex items-center justify-center text-xs font-bold border-2 border-white">+{avatars.length - max}</span>
      )}
    </div>
  );
} 