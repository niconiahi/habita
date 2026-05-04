export const ACCOUNT_TYPE = {
  FREELANCE: 0,
  REALTOR: 1,
} as const

export type AccountType =
  (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE]
