'use client'

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
  return (
    <div className="text-center py-12 px-5 text-gray-500">
      <div className="text-[44px] mb-3">{icon}</div>
      <div className="text-base font-semibold text-gray-700 mb-1.5">{title}</div>
      <div className="text-sm">{message}</div>
    </div>
  );
};
