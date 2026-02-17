export async function request_demo(email: string) {
  const subject = "Nueva solicitud de demo"
  const text = `
<div>
  <p>El usuario <strong>${email}</strong> solicitó una demo para cuenta de tipo Inmobiliaria</p>
</div>`
  const response = await fetch(
    "http://go:8081/send-landlord-invite",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "nicolas.accetta@gmail.com",
        subject,
        text,
      }),
    },
  )
  if (!response.ok) {
    const error_text = await response.text()
    throw new Error(
      `Failed to send demo request: ${response.status} - ${error_text}`,
    )
  }
}
