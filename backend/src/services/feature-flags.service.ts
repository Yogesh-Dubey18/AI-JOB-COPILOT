export const featureFlags = {
  billing: true,
  mockBillingOnly: true,
  aiMockFallback: true,
  portfolioPublishing: true,
  publicPortfolioPrivacyControls: true,
  chromeExtension: false,
  e2ePlaywright: false,
  realEmailSending: false
};

export function getFeatureFlags() {
  return featureFlags;
}
