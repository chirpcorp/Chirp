interface Props {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  isPercentage?: boolean;
}

export function MetricsCard({ title, value, change, icon, isPercentage }: Props) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <div className="rounded-xl border border-dark-4 bg-dark-2 p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-small-medium ${
            isPositive ? 'text-green-500' : 
            isNegative ? 'text-red-500' : 
            'text-gray-1'
          }`}>
            {isPositive && '↗️'}
            {isNegative && '↘️'}
            {change === 0 && '➡️'}
            {Math.abs(change).toFixed(isPercentage ? 1 : 0)}{isPercentage && '%'}
          </div>
        )}
      </div>
      
      <div>
        <h3 className="mb-1 text-heading2-bold text-light-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        <p className="text-small-regular text-gray-1">{title}</p>
      </div>
    </div>
  );
}

export default MetricsCard;