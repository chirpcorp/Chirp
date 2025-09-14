export function SkeletonCard() {
  return (
    <div className="bg-dark-2 p-7 rounded-xl animate-pulse">
      <div className="flex gap-4">
        {/* Avatar skeleton */}
        <div className="w-11 h-11 bg-dark-3 rounded-full"></div>
        
        <div className="flex-1 space-y-3">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-dark-3 rounded w-1/4"></div>
            <div className="h-3 bg-dark-3 rounded w-1/6"></div>
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-dark-3 rounded w-full"></div>
            <div className="h-4 bg-dark-3 rounded w-3/4"></div>
            <div className="h-4 bg-dark-3 rounded w-1/2"></div>
          </div>
          
          {/* Actions skeleton */}
          <div className="flex gap-6 mt-4">
            <div className="h-6 w-6 bg-dark-3 rounded"></div>
            <div className="h-6 w-6 bg-dark-3 rounded"></div>
            <div className="h-6 w-6 bg-dark-3 rounded"></div>
            <div className="h-6 w-6 bg-dark-3 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;