export type UserRole = "job_seeker" | "admin";
export type ExperienceLevel = "fresher" | "junior" | "mid" | "senior";
export type ApplicationStatus =
  | "Saved"
  | "Applied"
  | "Resume Viewed"
  | "HR Call"
  | "Assignment"
  | "Technical Round 1"
  | "Technical Round 2"
  | "Managerial Round"
  | "HR Round"
  | "Offer"
  | "Selected"
  | "Rejected"
  | "Withdrawn";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}
