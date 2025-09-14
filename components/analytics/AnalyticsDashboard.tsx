interface Props {
  userMetrics: any;
  platformMetrics: any;
}

export function AnalyticsDashboard({ userMetrics, platformMetrics }: Props) {
  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="bg-dark-2 rounded-xl p-6">
        <h3 className="text-heading4-medium text-light-1 mb-6">
          Performance Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="text-heading4-medium text-light-1 mb-1">
              {userMetrics.avgEngagementPerPost.toFixed(1)}
            </h4>
            <p className="text-small-regular text-gray-1">
              Average engagement per post
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <h4 className="text-heading4-medium text-light-1 mb-1">
              {(userMetrics.engagementScore * 100).toFixed(1)}%
            </h4>
            <p className="text-small-regular text-gray-1">
              Engagement rate
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="text-heading4-medium text-light-1 mb-1">
              {userMetrics.totalShares}
            </h4>
            <p className="text-small-regular text-gray-1">
              Total shares
            </p>
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-2 rounded-xl p-6">
          <h3 className="text-heading4-medium text-light-1 mb-4">
            📊 Insights
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-small-medium text-light-1 mb-1">
                  Peak Engagement Time
                </p>
                <p className="text-small-regular text-gray-1">
                  Your audience is most active between 2:00 PM - 4:00 PM
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-small-medium text-light-1 mb-1">
                  Content Performance
                </p>
                <p className="text-small-regular text-gray-1">
                  Posts with images get 2.3x more engagement
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="text-small-medium text-light-1 mb-1">
                  Audience Growth
                </p>
                <p className="text-small-regular text-gray-1">
                  You're gaining followers 15% faster than average
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-dark-2 rounded-xl p-6">
          <h3 className="text-heading4-medium text-light-1 mb-4">
            💡 Recommendations
          </h3>
          
          <div className="space-y-4">
            <div className="bg-dark-3 rounded-lg p-4">
              <h4 className="text-small-semibold text-light-1 mb-2">
                Optimize Posting Time
              </h4>
              <p className="text-small-regular text-gray-1">
                Try posting during your peak hours (2-4 PM) to reach more followers
              </p>
            </div>
            
            <div className="bg-dark-3 rounded-lg p-4">
              <h4 className="text-small-semibold text-light-1 mb-2">
                Use More Hashtags
              </h4>
              <p className="text-small-regular text-gray-1">
                Posts with 3-5 relevant hashtags get 30% more visibility
              </p>
            </div>
            
            <div className="bg-dark-3 rounded-lg p-4">
              <h4 className="text-small-semibold text-light-1 mb-2">
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