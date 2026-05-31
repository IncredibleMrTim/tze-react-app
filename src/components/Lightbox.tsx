interface LightboxProps {
  src: string;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ src, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white text-3xl bg-black/50 w-10 h-10 rounded-full hover:bg-black/70"
        >
          ×
        </button>
        <img
          src={src}
          alt="Preview"
          className="max-w-full max-h-[90vh] object-contain rounded"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};
