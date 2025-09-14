interface Props {
  userMetrics: any;
  platformMetrics: any;
}

export function AnalyticsDashboard({ userMetrics, platformMetrics }: Props) {
  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="rounded-xl bg-dark-2 p-6">
        <h3 className="mb-6 text-heading4-medium text-light-1">
          Performance Overview
        </h3>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="mb-1 text-heading4-medium text-light-1">
              {userMetrics.avgEngagementPerPost.toFixed(1)}
            </h4>
            <p className="text-small-regular text-gray-1">
              Average engagement per post
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <h4 className="mb-1 text-heading4-medium text-light-1">
              {(userMetrics.engagementScore * 100).toFixed(1)}%
            </h4>
            <p className="text-small-regular text-gray-1">
              Engagement rate
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="mb-1 text-heading4-medium text-light-1">
              {userMetrics.totalShares}
            </h4>
            <p className="text-small-regular text-gray-1">
              Total shares
            </p>
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-dark-2 p-6">
          <h3 className="mb-4 text-heading4-medium text-light-1">
            📊 Insights
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 mt-2 size-2 rounded-full"></div>
              <div>
                <p className="mb-1 text-small-medium text-light-1">
                  Peak Engagement Time
                </p>
                <p className="text-small-regular text-gray-1">
                  Your audience is most active between 2:00 PM - 4:00 PM
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-2 size-2 rounded-full bg-green-500"></div>
              <div>
                <p className="mb-1 text-small-medium text-light-1">
                  Content Performance
                </p>
                <p className="text-small-regular text-gray-1">
                  Posts with images get 2.3x more engagement
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-2 size-2 rounded-full bg-purple-500"></div>
              <div>
                <p className="mb-1 text-small-medium text-light-1">
                  Audience Growth
                </p>
                <p className="text-small-regular text-gray-1">
                  You&apos;re gaining followers 15% faster than average
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-dark-2 p-6">
          <h3 className="mb-4 text-heading4-medium text-light-1">
            💡 Recommendations
          </h3>
          
          <div className="space-y-4">
            <div className="rounded-lg bg-dark-3 p-4">
              <h4 className="mb-2 text-small-semibold text-light-1">
                Optimize Posting Time
              </h4>
              <p className="text-small-regular text-gray-1">
                Try posting during your peak hours (2-4 PM) to reach more followers
              </p>
            </div>
            
            <div className="rounded-lg bg-dark-3 p-4">
              <h4 className="mb-2 text-small-semibold text-light-1">
                Use More Hashtags
              </h4>
              <p className="text-small-regular text-gray-1">
                Posts with 3-5 relevant hashtags get 30% more visibility
              </p>
            </div>
            
            <div className="rounded-lg bg-dark-3 p-4">
              <h4 className="mb-2 text-small-semibold text-light-1">
                Engage More
              </h4>
              <p className="text-small-regular text-gray-1">
                Reply to comments within 2 hours to boost engagement
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;