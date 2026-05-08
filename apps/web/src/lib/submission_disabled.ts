interface Form {
  pending: number
}

export function submission_disabled(form: Form): boolean {
  return form.pending > 0
}
