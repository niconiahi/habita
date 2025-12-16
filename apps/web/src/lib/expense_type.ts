import * as v from "valibot";

export type ObjectValues<T> = T[keyof T];
export const EXPENSE_TYPE = {
  EXTRAORDINARY: 0,
  ORDINARY: 1
} as const;
export const ExpenseTypeSchema = v.picklist(Object.values(EXPENSE_TYPE));
export type ExpenseType = ObjectValues<typeof EXPENSE_TYPE>;

export function get_expense_types() {
  return Object.values(EXPENSE_TYPE);
}
