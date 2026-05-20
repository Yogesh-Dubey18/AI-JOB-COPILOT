# Job CSV Import Template

Use this template only for job lists that are legally obtained and allowed to be imported. Preview before saving.

```csv
title,company,location,remoteType,jobType,experienceRequired,salaryMin,salaryMax,currency,skillsRequired,applyUrl,source,companyWebsite,recruiterEmail,description
React Developer,Example Tech,Bengaluru,Hybrid,Full-time,0-2 years,300000,700000,INR,"React; TypeScript; REST API",https://example.com/careers/react,Admin CSV import,https://example.com,hr@example.com,"Build React features and work with APIs."
```

## Required Columns

- `title`
- `company`
- `location`
- `applyUrl`

## Recommended Columns

- `remoteType`
- `jobType`
- `experienceRequired`
- `salaryMin`
- `salaryMax`
- `currency`
- `skillsRequired`
- `source`
- `companyWebsite`
- `recruiterEmail`
- `description`

## Import Process

1. Paste CSV into the preview endpoint or future admin UI.
2. Review normalized title, company, location, duplicate key, trust score, scam risk, and risk flags.
3. Remove suspicious rows.
4. Save only reviewed jobs.
5. Keep source records for auditability.

## Do Not Import

- Jobs copied from protected sites against their terms.
- Jobs with payment or registration fee demands.
- Jobs with no company identity.
- Jobs that promise unrealistic salary for the role.
- Jobs that ask candidates to message private accounts before verification.

