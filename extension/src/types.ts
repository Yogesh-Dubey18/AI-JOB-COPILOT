export type JobDraft = {
  title: string;
  company: string;
  location: string;
  applyUrl: string;
  source: string;
  description: string;
  skillsRequired: string[];
  responsibilities: string[];
  requirements: string[];
  remoteType?: string;
  jobType?: string;
  riskFlags: string[];
};

export type ExtensionSettings = {
  apiBaseUrl: string;
  appBaseUrl: string;
};
