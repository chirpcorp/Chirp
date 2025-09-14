"use client";

import { useState, useEffect } from "react";

interface Props {
  userId: string;
}

export function EngagementChart({ userId }: Props) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [timeRange, userId]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      // In a real implementation, you'd fetch actual chart data
      // const chartData = await AnalyticsEngine.getEngagementData(userId, timeRange);
      
      // Mock data for demonstration
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        likes: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 30),
      }));
      
      setData(mockData);
    } catch (error) {
      console.error("Error loading chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-dark-2 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-heading4-medium text-light-1">
          Engagement Over Time
        </h3>
        
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7 days' },
            { value: '30d', label: '30 days' },
            { value: '90d', label: '90 days' }
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as any)}
              className={`rounded-full px-3 py-1 text-small-medium transition-colors ${
                timeRange === range.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-3 text-gray-1 hover:bg-dark-4'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="flex h-64 items-end justify-between gap-1">
          {data.slice(0, 30).map((point, index) => {
            const maxValue = Math.max(...data.map(d => d.likes + d.shares + d.comments));
            const totalEngagement = point.likes + point.shares + point.comments;
            const height = (totalEngagement / maxValue) * 100;
            
            return (
              <div
                key={index}
                className="group flex flex-1 cursor-pointer flex-col items-center"
              >
                {/* Tooltip */}
                <div className="mb-2 min-w-max rounded bg-dark-1 px-2 py-1 text-tiny-medium text-light-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <div>{point.date}</div>
                  <div>Likes: {point.likes}</div>
                  <div>Shares: {point.shares}</div>
                  <div>Comments: {point.comments}</div>
                </div>
                
                {/* Bar */}
                <div 
                  className="group-hover:from-primary-400 min-h-[4px] w-full rounded-t bg-gradient-to-t from-primary-500 to-blue-400 transition-all duration-300 group-hover:to-blue-300"
                  style={{ height: `${Math.max(height, 5)}%` }}
                ></div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-small-medium">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded bg-primary-500"></div>
          <span className="text-gray-1">Engagement</span>
        </div>
      </div>
    </div>
  );
}

export default EngagementChart;