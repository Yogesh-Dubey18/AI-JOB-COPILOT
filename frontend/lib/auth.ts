import { api } from "./api";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: "job_seeker" | "admin";
};

export async function getCurrentUser() {
  return api.get<AuthUser>("/auth/me");
}
