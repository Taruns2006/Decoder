import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-800 rounded-md ${className}`}></div>
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-2 w-full mt-4" />
  </div>
);
