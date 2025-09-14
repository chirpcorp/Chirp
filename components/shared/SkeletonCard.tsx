export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-dark-2 p-7">
      <div className="flex gap-4">
        {/* Avatar skeleton */}
        <div className="size-11 rounded-full bg-dark-3"></div>
        
        <div className="flex-1 space-y-3">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-1/4 rounded bg-dark-3"></div>
            <div className="h-3 w-1/6 rounded bg-dark-3"></div>
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-dark-3"></div>
            <div className="h-4 w-3/4 rounded bg-dark-3"></div>
            <div className="h-4 w-1/2 rounded bg-dark-3"></div>
          </div>
          
          {/* Actions skeleton */}
          <div className="mt-4 flex gap-6">
            <div className="size-6 rounded bg-dark-3"></div>
            <div className="size-6 rounded bg-dark-3"></div>
            <div className="size-6 rounded bg-dark-3"></div>
            <div className="size-6 rounded bg-dark-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;