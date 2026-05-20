export const featureFlags = {
  billing: true,
  mockBillingOnly: true,
  aiMockFallback: true,
  portfolioPublishing: true,
  publicPortfolioPrivacyControls: false,
  chromeExtension: false,
  e2ePlaywright: false,
  realEmailSending: false
};

export function getFeatureFlags() {
  return featureFlags;
}
