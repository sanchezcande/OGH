import { Resend } from "resend";

// Leer la API key directamente (Next.js carga .env.local automáticamente)
// También intentar leer desde diferentes fuentes por si acaso
const apiKey = process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY || "re_isRWc7Ao_6CGPPjPhSHuz6C49jnEpd8ey";

// Debug: verificar si la key se está leyendo
console.log("=== RESEND API KEY DEBUG ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
console.log("RESEND_API_KEY value:", process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : "undefined");
console.log("apiKey variable:", apiKey ? `${apiKey.substring(0, 10)}...` : "undefined");
console.log("Full apiKey length:", apiKey ? apiKey.length : 0);
console.log("===========================");

// Inicializar Resend con la API key
let resend;
try {
  resend = apiKey ? new Resend(apiKey) : null;
  if (resend) {
    console.log("Resend initialized successfully");
  } else {
    console.error("Resend NOT initialized - apiKey is missing");
  }
} catch (error) {
  console.error("Error initializing Resend:", error);
  resend = null;
}

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verificar que Resend esté configurado
  if (!resend) {
    console.error("RESEND_API_KEY missing:", process.env.RESEND_API_KEY ? "Key exists but Resend not initialized" : "Key not found in env");
    return res.status(500).json({ error: "Email service not configured. Please check RESEND_API_KEY." });
  }

  try {
    const { name, email, company, engagement_type, budget, timeline } = req.body;

    // Validación básica
    if (!name || !email || !company || !engagement_type || !budget || !timeline) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // Log de los datos recibidos
    console.log("=== SENDING EMAIL ===");
    console.log("To:", process.env.CONTACT_EMAIL || "info@opengatehub.com");
    console.log("From: OpenGateHub <onboarding@resend.dev>");
    console.log("Subject:", `Project Estimate Request - ${engagement_type}`);
    console.log("Form data:", { name, email, company, engagement_type, budget, timeline });

    // Enviar email con Resend
    const { data, error } = await resend.emails.send({
      from: "OpenGateHub <onboarding@resend.dev>", // Cambiar esto cuando configures tu dominio
      to: "candelaria@opengatehub.com", // Email donde recibirás los mensajes (temporalmente tu email para testing)
      subject: `Project Estimate Request - ${engagement_type}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b; border-bottom: 2px solid #f97b72; padding-bottom: 10px;">
            New Project Estimate Request
          </h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Contact Information</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company}</p>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Project Details</h3>
            <p><strong>Engagement Type:</strong> ${engagement_type}</p>
            <p><strong>Budget:</strong> ${budget}</p>
            <p><strong>Timeline:</strong> ${timeline}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 12px;">
            <p>This email was sent from the OpenGateHub contact form.</p>
          </div>
        </div>
      `,
      text: `
New Project Estimate Request

Contact Information:
- Name: ${name}
- Email: ${email}
- Company: ${company}

Project Details:
- Engagement Type: ${engagement_type}
- Budget: ${budget}
- Timeline: ${timeline}
      `,
    });

    if (error) {
      console.error("=== RESEND ERROR ===");
      console.error("Error object:", JSON.stringify(error, null, 2));
      console.error("Error message:", error.message);
      console.error("Error name:", error.name);
      console.error("Full error:", error);
      return res.status(500).json({ 
        error: "Failed to send email",
        details: error.message || JSON.stringify(error) || "Unknown error"
      });
    }

    console.log("=== EMAIL SENT SUCCESSFULLY ===");
    console.log("Email ID:", data?.id);

    return res.status(200).json({ 
      success: true, 
      message: "Estimate request sent successfully",
      id: data?.id 
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error.message || "Unknown error"
    });
  }
}
