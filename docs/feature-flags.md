# Feature Flags

Feature flags keep provider-ready work honest and controllable.

## Current Flags

- `billing`: billing UI and routes are enabled.
- `mockBillingOnly`: real charges are disabled.
- `aiMockFallback`: AI mock fallback is enabled when providers are unavailable.
- `portfolioPublishing`: portfolio generation is enabled.
- `publicPortfolioPrivacyControls`: planned.
- `chromeExtension`: planned.
- `e2ePlaywright`: planned.
- `realEmailSending`: disabled until email credentials are configured.

## Rules

- Keep risky integrations disabled by default.
- Never hide missing credentials behind a fake success state.
- Use flags to separate demo functionality from live production behavior.
- Document manual setup before enabling provider-backed features.
