import styled from "styled-components";

/**
 * Los estilos de las paginas de prosa: las que existen para que un modelo las cite
 * (/datos-developers-latam, /como-conseguir-trabajo-de-developer, /hire-developers-latin-america).
 *
 * Por que esta aca y no en cada pagina: estaban copiados y pegados en las dos primeras y ya
 * habian derivado solos (un H1 de 30px contra uno de 31, un H2 de 27 contra 28). Con la tercera
 * pagina eran tres copias. Una pagina nueva de este tipo importa de aca y no define estilos.
 *
 * Estos son los valores canonicos. Si hay que cambiar el look, se cambia aca una vez.
 */

export const Wrap = styled.main`
  max-width: 760px; margin: 0 auto; padding: 56px 20px 96px;
  font-family: Inter, system-ui, sans-serif; color: #16110f; line-height: 1.6;
  @media (max-width: 600px) { padding: 32px 16px 64px; }
`;

export const Eyebrow = styled.p`
  margin: 0 0 12px; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: #8a7c76;
`;

export const H1 = styled.h1`
  font-family: Newsreader, Georgia, serif; font-weight: 500; font-size: 42px; line-height: 1.15;
  margin: 0 0 24px; @media (max-width: 600px) { font-size: 31px; }
`;

export const H2 = styled.h2`
  font-family: Newsreader, Georgia, serif; font-weight: 500; font-size: 28px; line-height: 1.25;
  margin: 56px 0 16px; @media (max-width: 600px) { font-size: 23px; }
`;

export const H3 = styled.h3`
  font-size: 18px; font-weight: 600; margin: 32px 0 10px;
`;

// El mismo H3 pegado al borde de arriba, para cuando abre un bloque que ya trae su propio aire.
export const H3Tight = styled(H3)`
  margin-top: 0;
`;

export const Lead = styled.p`
  font-size: 19px; margin: 0 0 24px; color: #3a312d; a { color: #7a2f52; }
`;

export const Firma = styled.p`
  font-size: 15px; color: #3a312d; border-left: 3px solid #d9cfc9; padding: 10px 0 10px 16px;
  margin: 0 0 8px; a { color: #7a2f52; }
`;

export const Resumen = styled.p`
  font-size: 17px; margin: 0 0 16px;
`;

export const Resp = styled.p`
  font-size: 18px; margin: 0 0 14px; font-weight: 500;
`;

export const P = styled.p`
  font-size: 17px; margin: 0 0 12px; color: #3a312d;
`;

export const Nota = styled.p`
  font-size: 14px; color: #6f635e; margin: 8px 0 0;
`;

export const Tabla = styled.table`
  width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 15px;
  th, td { text-align: left; padding: 10px 12px 10px 0; border-bottom: 1px solid #e8e1dd; }
  th { font-weight: 600; color: #6f635e; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; }
`;

export const Metodo = styled.ul`
  margin: 0; padding-left: 20px; font-size: 16px; li { margin-bottom: 8px; } a { color: #7a2f52; }
`;

export const Cierre = styled.section`
  margin-top: 56px; padding: 24px; background: #faf6f3; border-radius: 10px;
  p { font-size: 17px; margin: 0 0 12px; } a { color: #7a2f52; font-weight: 600; }
`;
