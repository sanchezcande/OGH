import React, { useEffect, useState } from "react";
import Head from "next/head";

// Página de retorno de la autorización de TikTok (20/09/2026).
// TikTok no acepta localhost como redirect, así que manda el código acá y esta página
// lo muestra grande para copiarlo y pegarlo en el script publicar_tt.py. No guarda nada
// ni lo manda a ningún lado: el código vive solo en la barra de direcciones.

export default function TikTokCallback() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setCode(q.get("code") || "");
    setError(q.get("error_description") || q.get("error") || "");
  }, []);

  const copiar = () => {
    navigator.clipboard.writeText(code).then(() => setCopiado(true)).catch(() => {});
  };

  return (
    <>
      <Head>
        <title>TikTok</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ minHeight: "100vh", background: "#fff", color: "#111",
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 560, width: "100%" }}>
          {code ? (
            <>
              <h1 style={{ fontSize: 24, margin: "0 0 10px" }}>Listo, copiá este código</h1>
              <p style={{ color: "#52525B", margin: "0 0 18px", fontSize: 15 }}>
                Pegalo en la terminal donde te lo está pidiendo. Sirve una sola vez.
              </p>
              <code style={{ display: "block", wordBreak: "break-all", background: "#FAFAFA",
                             border: "1px solid #E4E4E7", borderRadius: 4, padding: 14, fontSize: 14 }}>
                {code}
              </code>
              <button onClick={copiar}
                style={{ marginTop: 14, background: "#CC5A50", color: "#fff", border: 0,
                         borderRadius: 4, padding: "12px 20px", fontSize: 15, fontWeight: 600,
                         cursor: "pointer" }}>
                {copiado ? "Copiado" : "Copiar código"}
              </button>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 24, margin: "0 0 10px" }}>Falta el código</h1>
              <p style={{ color: "#52525B", fontSize: 15 }}>
                {error || "Abrí esta página desde el link de autorización de TikTok."}
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
