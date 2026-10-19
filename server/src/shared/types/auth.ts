export const ACCOUNT_TYPES = ["Admin", "Student", "Instructor"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface AuthUser {
  id: string;
  email: string;
  accountType: AccountType;
}
