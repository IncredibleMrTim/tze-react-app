import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3.5 rounded-xl text-[13px] z-[9999] max-w-[360px] w-[90%] shadow-2xl whitespace-pre-line leading-relaxed animate-fadein">
      {message}
    </div>
  );
};
