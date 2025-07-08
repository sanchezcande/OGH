import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Head from "next/head";
import {
  ServiceContainer,
  ServiceTitle,
  Divider,
  Description,
} from "../../src/styles/pagesStyles/servicesStyles/AI.styles";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
import { FaCheckCircle, FaCogs, FaSyncAlt, FaRocket, FaCloud, FaUsers, FaProjectDiagram } from "react-icons/fa";

// Componentes visuales locales para la página
const Block = ({ children, style, className }) => (
  <div
    className={className}
    style={{
      background: "#fff",
      borderRadius: 12,
      padding: "1.5rem 1.5rem 1.2rem 1.5rem",
      marginBottom: 24,
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      ...style,
    }}
  >
    {children}
  </div>
);

const AnimatedList = ({ children }) => (
  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>{children}</ul>
);

const AnimatedListItem = ({ children }) => (
  <li
    className="animate"
    style={{
      display: "flex",
      alignItems: "center",
      fontSize: "1.08rem",
      marginBottom: 14,
      opacity: 0,
      transform: "translateY(20px)",
      animation: "fadeInUp 0.6s forwards",
      animationDelay: "0.1s",
    }}
  >
    {children}
    <style>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  </li>
);

export const ServicesCallToAction = () => {
  const { t } = useTranslation();
  const callToAction = t("servicesCallToAction", { returnObjects: true });

  return (
    <CallToActionBlock
      title={callToAction.title}
      description={callToAction.description}
      buttonText={callToAction.buttonText}
    />
  );
};

const N8nAutomation = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const items = document.querySelectorAll(".animate");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  // Explicación breve en ambos idiomas
  const introText = lang === "es"
    ? (<span><strong>¿Qué es n8n?</strong><br/>n8n es una plataforma visual de automatización de flujos de trabajo. Permite conectar tus apps y automatizar tareas repetitivas sin programar, ahorrando tiempo y evitando errores.<br/><br/></span>)
    : (<span><strong>What is n8n?</strong><br/>n8n is a visual workflow automation platform. It lets you connect your favorite apps and automate repetitive tasks without coding, saving time and reducing errors.<br/><br/></span>);

  return (
    <>
      <Head>
        <title>n8n Automation - OpenGateHub</title>
        <meta name="description" content={t("homeServicesSection.cards.n8nAutomation.description")}/>
        <meta
          name="keywords"
          content="n8n, Automation, Workflow, Integrations, No-code, Business Efficiency"
        />
        <meta name="author" content="OpenGateHub" />
      </Head>

      <ServiceContainer>
        <ServiceTitle className="animate">n8n Automation</ServiceTitle>
        <Divider className="animate" />

        {/* Bloque explicativo principal arriba */}
        <ServiceTitle as="h2" className="animate" style={{ marginBottom: 12 }}>
          {lang === "es" ? "¿Por qué n8n?" : "Why n8n?"}
        </ServiceTitle>
        <Block className="animate" style={{ textAlign: 'justify', marginBottom: '2.5rem', background: '#f8f8f8' }}>
          {lang === "es"
            ? (
              <>
                n8n es una plataforma de automatización de flujos de trabajo de código abierto y visual. Permite a empresas y equipos conectar aplicaciones, automatizar procesos y crear integraciones personalizadas sin necesidad de programar.<br /><br />
                Es ideal para quienes buscan eficiencia, flexibilidad y control total sobre sus automatizaciones, ya sea en la nube o en servidores propios. Con n8n, podés escalar tus operaciones, reducir errores y liberar tiempo para lo que realmente importa.
              </>
            ) : (
              <>
                n8n is an open-source, visual workflow automation platform. It empowers businesses and teams to connect apps, automate processes, and build custom integrations—no coding required.<br /><br />
                It's perfect for those who want efficiency, flexibility, and full control over their automations, whether in the cloud or on their own servers. With n8n, you can scale operations, reduce errors, and free up time for what truly matters.
              </>
            )}
        </Block>

        <Block className="animate" style={{ textAlign: 'justify', marginBottom: '2rem' }}>
          <ServiceTitle as="h3" className="animate" style={{ marginBottom: 12 }}>
            {lang === "es" ? "¿Listo para dejar de perder tiempo en tareas manuales?" : "Ready to stop wasting time on manual tasks?"}
          </ServiceTitle>
          <strong>{lang === "es" ? "Automatizá tu negocio y ganá tiempo real." : "Automate your business and gain real time."}</strong><br /><br />
          {lang === "es"
            ? <>n8n conecta tus herramientas favoritas y automatiza tareas repetitivas, sin código y sin complicaciones.<br /><br /><span style={{ color: '#E35A52', fontWeight: 600 }}>Más eficiencia, menos errores, más foco en lo importante.</span></>
            : <>n8n connects your favorite tools and automates repetitive tasks, no code and no hassle.<br /><br /><span style={{ color: '#E35A52', fontWeight: 600 }}>More efficiency, fewer errors, more focus on what matters.</span></>
          }
        </Block>

        <Block className="animate" style={{ marginBottom: '2.5rem' }}>
          <ServiceTitle as="h3" style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{lang === "es" ? "¿Por qué elegir n8n?" : "Why choose n8n?"}</ServiceTitle>
          <AnimatedList>
            <AnimatedListItem><FaCogs style={{ color: '#E35A52', marginRight: 8 }} /> {lang === "es" ? "Open-source y económico" : "Open-source and cost-effective"}</AnimatedListItem>
            <AnimatedListItem><FaSyncAlt style={{ color: '#E35A52', marginRight: 8 }} /> {lang === "es" ? "Visual, sin código" : "No-code visual builder"}</AnimatedListItem>
            <AnimatedListItem><FaCloud style={{ color: '#E35A52', marginRight: 8 }} /> {lang === "es" ? "+200 integraciones listas" : "+200 ready-to-use integrations"}</AnimatedListItem>
            <AnimatedListItem><FaRocket style={{ color: '#E35A52', marginRight: 8 }} /> {lang === "es" ? "Flexible: cloud o self-hosted" : "Flexible: cloud or self-hosted"}</AnimatedListItem>
            <AnimatedListItem><FaCheckCircle style={{ color: '#E35A52', marginRight: 8 }} /> {lang === "es" ? "Productividad real, menos errores" : "Real productivity, fewer errors"}</AnimatedListItem>
          </AnimatedList>
        </Block>

        <Block className="animate" style={{ marginBottom: '2.5rem' }}>
          <ServiceTitle as="h3" style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{lang === "es" ? "¿Qué podés automatizar?" : "What can you automate?"}</ServiceTitle>
          <AnimatedList>
            <AnimatedListItem><FaUsers style={{ color: '#E35A52', marginRight: 8 }} /> {lang === "es" ? "Sincronización de datos de clientes" : "Customer data sync"}</AnimatedListItem>
            <AnimatedListItem><FaRocket style={{ color: '#E35A52', marginRight: 8 }} /> {lang === "es" ? "Gestión de leads y notificaciones" : "Lead management and notifications"}</AnimatedListItem>
            <AnimatedListItem><FaCogs style={{ color: '#E35A52', marginRight: 8 }} /> {lang === "es" ? "Procesos de pedidos y envíos" : "Order processing and fulfillment"}</AnimatedListItem>
            <AnimatedListItem><FaSyncAlt style={{ color: '#E35A52', marginRight: 8 }} /> {lang === "es" ? "Automatización de reportes y redes sociales" : "Reporting and social media automation"}</AnimatedListItem>
          </AnimatedList>
        </Block>

        <ServicesCallToAction />
      </ServiceContainer>
    </>
  );
};

export default N8nAutomation; 