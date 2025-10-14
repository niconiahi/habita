export async function send_calendar_invite({
  host,
  visitant,
  subject,
  text,
  content,
}: {
  host: string
  visitant: string
  subject: string
  text: string
  content: string
}): Promise<void> {
  await fetch("http://go:8081/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      host,
      visitant,
      subject,
      text,
      content,
    }),
  }).catch((error) => {
    throw new Error(
      "there was an error while sending the calendar invite",
      { cause: error },
    )
  })
}
