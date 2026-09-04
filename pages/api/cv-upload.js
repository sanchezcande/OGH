import { handleUpload } from "@vercel/blob/client";

// El CV se sube desde el navegador directo a Blob, no pasa por acá. Esta ruta
// solo firma el permiso. Es a propósito: una función serverless no acepta
// cuerpos de más de ~4.5 MB, así que un CV de 5 MB por el camino común falla.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const json = await handleUpload({
      request: req,
      body: req.body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        maximumSizeInBytes: 5 * 1024 * 1024,
        addRandomSuffix: true,
        // Privado: el CV es dato personal. Sin esto, cualquiera con la URL lo abre.
        access: "private",
      }),
      onUploadCompleted: async () => {},
    });
    return res.status(200).json(json);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
