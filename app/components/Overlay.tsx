'use client'

import type { ReactNode } from 'react';

interface OverlayProps {
  children: ReactNode;
  onClose: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ children, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-[430px] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
