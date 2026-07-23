// Transactional email transport. No provider is configured yet — like the
// "manual" payment placeholder in checkout, this logs to the console until
// RESEND_API_KEY is set, at which point it sends for real via Resend's HTTP API.
type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Reptile Concept <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[email:dev] to=${to} subject="${subject}"\n${html}`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] failed to send to ${to} (${res.status}): ${body}`);
    }
  } catch (err) {
    console.error(`[email] failed to send to ${to}:`, err);
  }
}
