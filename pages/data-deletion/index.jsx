// Instrucciones para pedir el borrado de datos (02/11). Meta las pide para publicar la app que usa el
// sitio con Instagram (la URL va en Configuración > Básica > "Eliminación de datos del usuario").
import React from "react";
import {
  PrivacyPolicyContainer,
  PrivacyPolicyTitle,
  PrivacyPolicySection,
  SectionTitle,
  SectionContent,
  List,
} from "../../src/styles/pagesStyles/PrivacyPolicy.styles";
import SEO from "../../src/components/SEO/SEO";

const EMAIL = "info@opengatehub.com";

const DataDeletion = () => (
  <>
    <SEO
      title="Data Deletion | OpenGateHub"
      description="How to ask OpenGateHub to delete the data we hold about you, including what we received through Instagram."
      robots="noindex, follow"
    />
    <PrivacyPolicyContainer>
      <PrivacyPolicyTitle>Data deletion / Eliminación de datos</PrivacyPolicyTitle>

      <PrivacyPolicySection>
        <SectionTitle>How to ask us to delete your data</SectionTitle>
        <SectionContent>
          If you commented on our Instagram posts, wrote to us by direct message, or filled in one of our forms, you can ask us to delete
          what we hold about you. Send an email to {EMAIL} with the subject "Data deletion" and include your Instagram username (or the
          email you used in the form).
        </SectionContent>
        <List>
          <li>We delete your messages, your Instagram username and ID, and your contact details from our systems.</li>
          <li>We reply within 30 days to confirm it was done.</li>
          <li>Data we must keep by law (for example, records of a payment) stays only for as long as the law requires.</li>
        </List>
        <SectionContent>
          More about what we collect and why is in our <a href="/privacy-policy">Privacy Policy</a>.
        </SectionContent>
      </PrivacyPolicySection>

      <PrivacyPolicySection>
        <SectionTitle>Cómo pedirnos que borremos tus datos</SectionTitle>
        <SectionContent>
          Si comentaste en nuestras publicaciones de Instagram, nos escribiste por mensaje directo o completaste uno de nuestros
          formularios, podés pedirnos que borremos lo que tenemos sobre vos. Mandá un mail a {EMAIL} con el asunto "Eliminación de datos"
          e incluí tu usuario de Instagram (o el mail que usaste en el formulario).
        </SectionContent>
        <List>
          <li>Borramos tus mensajes, tu usuario e ID de Instagram y tus datos de contacto de nuestros sistemas.</li>
          <li>Te respondemos en un máximo de 30 días para confirmarte que está hecho.</li>
          <li>Lo que la ley nos obliga a conservar (por ejemplo, el registro de un pago) queda solo el tiempo que la ley exige.</li>
        </List>
        <SectionContent>
          Qué datos juntamos y para qué está en nuestra <a href="/privacy-policy">Política de Privacidad</a>.
        </SectionContent>
      </PrivacyPolicySection>
    </PrivacyPolicyContainer>
  </>
);

export default DataDeletion;
