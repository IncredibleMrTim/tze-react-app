import { LuLoaderCircle } from "react-icons/lu";

interface LoadingStateProps {
  message: string;
  className?: string;
}

/**
 * Shared spinner for full-page/section data loading states — keeps the
 * loading UI consistent instead of each page hand-rolling its own.
 */
export function LoadingState({
  message,
  className = "flex items-center justify-center h-64",
}: LoadingStateProps) {
  return (
    <div className={className}>
      <div className="text-center">
        <LuLoaderCircle
          className="w-10 h-10 mx-auto mb-4 animate-spin text-gray-400"
          aria-hidden="true"
        />
        <div className="text-lg text-gray-600">{message}</div>
      </div>
    </div>
  );
}
