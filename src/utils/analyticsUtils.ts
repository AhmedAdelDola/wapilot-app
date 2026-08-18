export const sendAnalyticsEvent = (event: string, properties?: Record<string, any>) => {
  console.log('[Analytics]', event, properties);
};

const AnalyticsHelper = {
  identify: (user: any) => {
    console.log('[Analytics] Identify:', user?.email);
  },
  track: (event: string, properties?: Record<string, any>) => {
    sendAnalyticsEvent(event, properties);
  },
};

export default AnalyticsHelper;
