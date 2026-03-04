import { Resend } from "resend";

const apiKey =
  process.env.RESEND_API_KEY ||
  process.env.NEXT_PUBLIC_RESEND_API_KEY ||
  "re_isRWc7Ao_6CGPPjPhSHuz6C49jnEpd8ey";

let resend;
try {
  resend = apiKey ? new Resend(apiKey) : null;
} catch {
  resend = null;
}

const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    name,
    email,
    teamSize,
    salary,
    tasks,
    industry,
    hoursLost,
    monthlyCost,
    potentialSavings,
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  // Always return success even if email fails (avoid blocking UX)
  if (!resend) {
    console.error("Resend not configured");
    return res.status(200).json({ success: true });
  }

  const taskList = Array.isArray(tasks) ? tasks : [];
  const savingsLabel = potentialSavings ? fmt(potentialSavings) : "N/A";
  const costLabel = monthlyCost ? fmt(monthlyCost) : "N/A";

  const { error } = await resend.emails.send({
    from: "OpenGateHub <onboarding@resend.dev>",
    to: "candelaria@opengatehub.com",
    subject: `Nueva lead calculadora — Ahorro potencial: ${savingsLabel}/mes`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background: #f97b72; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">
            Nueva lead — Calculadora de Costos
          </h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">
            Ahorro potencial estimado: <strong>${savingsLabel}/mes</strong>
          </p>
        </div>

        <div style="background: #f8fafc; padding: 24px 32px;">
          <h2 style="font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px;">
            Contacto
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #64748b; width: 120px;">Nombre</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Email</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">
                <a href="mailto:${email}" style="color: #f97b72;">${email}</a>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding: 24px 32px; border-top: 1px solid #e5e7eb;">
          <h2 style="font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px;">
            Respuestas del diagnóstico
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #64748b; width: 160px;">Tamaño del equipo</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${teamSize ?? "—"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Salario promedio</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${salary ?? "—"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Industria</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${industry ?? "—"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #64748b; vertical-align: top;">Tareas manuales</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">
                ${taskList.length > 0 ? taskList.map((t) => `• ${t}`).join("<br>") : "—"}
              </td>
            </tr>
          </table>
        </div>

        <div style="background: #fff5f5; border: 2px solid #f97b72; border-radius: 8px; padding: 20px 32px; margin: 0 32px 24px;">
          <h2 style="font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px;">
            Resultados calculados
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; font-size: 14px; color: #64748b; width: 200px;">Horas perdidas / mes</td>
              <td style="padding: 5px 0; font-size: 14px; font-weight: 700;">${hoursLost ?? 0}h</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-size: 14px; color: #64748b;">Costo mensual del trabajo manual</td>
              <td style="padding: 5px 0; font-size: 14px; font-weight: 700;">${costLabel}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-size: 15px; color: #f97b72; font-weight: 700;">Ahorro potencial</td>
              <td style="padding: 5px 0; font-size: 15px; font-weight: 800; color: #f97b72;">${savingsLabel}/mes</td>
            </tr>
          </table>
        </div>

        <div style="padding: 16px 32px 32px; text-align: center;">
          <a
            href="https://calendly.com/sanchezgcandelaria/15min"
            style="display: inline-block; background: #f97b72; color: white; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px;"
          >
            Agendar llamada con ${name} →
          </a>
        </div>

        <div style="padding: 16px 32px; border-top: 1px solid #e5e7eb; color: #94a3b8; font-size: 11px; text-align: center;">
          Lead generado desde la calculadora de opengatehub.com/calculadora
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    // Still return success to not block the user
    return res.status(200).json({ success: true });
  }

  return res.status(200).json({ success: true });
}
