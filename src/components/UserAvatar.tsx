import React from 'react';
import { UserSession } from '../types';
import { APP_IMAGES } from '../data/initialData';

interface UserAvatarProps {
  user: UserSession;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { box: 'w-8 h-8 text-[12px]', img: 'w-8 h-8' },
  md: { box: 'w-9 h-9 text-[13px]', img: 'w-9 h-9' },
  lg: { box: 'w-12 h-12 text-[16px]', img: 'w-12 h-12' },
};

const getInitials = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NTPB';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md', className = '' }) => {
  const s = SIZES[size];

  // Une vraie photo de profil (fonctionnalité future) remplace l'avatar à
  // initiales dès qu'elle est disponible ; l'image générique n'apparaît jamais.
  const hasRealPhoto = Boolean(user.avatarUrl) && user.avatarUrl !== APP_IMAGES.userAvatar;

  if (hasRealPhoto) {
    return (
      <img
        src={user.avatarUrl}
        alt={`Avatar de ${user.name}`}
        className={`${s.img} rounded-full object-cover border border-[#dee8ff] flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${s.box} rounded-full bg-[#af101a] text-white font-extrabold flex items-center justify-center flex-shrink-0 shadow-sm border border-white/40 ${className}`}
    >
      {getInitials(user.name)}
    </div>
  );
};