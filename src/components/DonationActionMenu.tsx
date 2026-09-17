import React, { useRef, useEffect } from 'react';
import { Donation } from '../types';

interface DonationActionMenuProps {
  donation: Donation;
  onToggleStatus: (donation: Donation) => void;
  onEdit: (donation: Donation) => void;
  onDelete: (donationId: string) => void;
}

export const DonationActionMenu: React.FC<DonationActionMenuProps> = ({
  donation,
  onToggleStatus,
  onEdit,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f0f3ff] transition-colors cursor-pointer"
        aria-label="Actions"
      >
        <span className="material-symbols-outlined text-[18px] text-[#8f6f6c] group-hover:text-[#af101a]">
          more_vert
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white rounded-2xl shadow-xl border border-[#e7eeff] py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onToggleStatus(donation);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#111c2d] hover:bg-[#f0f3ff] transition-colors cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[18px] text-[#715300]">
              swap_horiz
            </span>
            <span className="font-medium">
              Basculer en{' '}
              <span className="font-bold">{donation.status === 'Reçu' ? 'Promesse' : 'Reçu'}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onEdit(donation);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#111c2d] hover:bg-[#f0f3ff] transition-colors cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[18px] text-[#5b403d]">edit</span>
            <span className="font-medium">Modifier</span>
          </button>

          <div className="border-t border-[#e7eeff] my-0.5" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onDelete(donation.id);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#af101a] hover:bg-[#ffdad6]/40 transition-colors cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            <span className="font-medium">Supprimer</span>
          </button>
        </div>
      )}
    </div>
  );
};
