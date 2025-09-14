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
    <div className="bg-dark-2 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
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
              className={`px-3 py-1 rounded-full text-small-medium transition-colors ${
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
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="h-64 flex items-end justify-between gap-1">
          {data.slice(0, 30).map((point, index) => {
            const maxValue = Math.max(...data.map(d => d.likes + d.shares + d.comments));
            const totalEngagement = point.likes + point.shares + point.comments;
            const height = (totalEngagement / maxValue) * 100;
            
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group cursor-pointer"
              >
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-dark-1 rounded px-2 py-1 text-tiny-medium text-light-1 min-w-max">
                  <div>{point.date}</div>
                  <div>Likes: {point.likes}</div>
                  <div>Shares: {point.shares}</div>
                  <div>Comments: {point.comments}</div>
                </div>
                
                {/* Bar */}
                <div 
                  className="w-full bg-gradient-to-t from-primary-500 to-blue-400 rounded-t transition-all duration-300 group-hover:from-primary-400 group-hover:to-blue-300 min-h-[4px]"
                  style={{ height: `${Math.max(height, 5)}%` }}
                ></div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-small-medium">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary-500 rounded"></div>
          <span className="text-gray-1">Engagement</span>
        </div>
      </div>
    </div>
  );
}

export default EngagementChart;