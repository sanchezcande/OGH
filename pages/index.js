import { Container, Title, Title2, ImageContainer } from "./HomePage.styles";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import cyberSecurity from "../public/cyberSecurity.png";
import Head from "next/head";

export async function getServerSideProps() {
  return {
    props: {},
  };
}

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{t("OpenGateHub")}</title>
        <meta name="description" content={t("pageDescription")} />
        <link rel="canonical" href="https://opengatehub.com/" />
        <meta property="og:title" content={t("OpenGateHub")} />
        <meta property="og:description" content={t("pageDescription")} />
        <meta property="og:url" content="https://opengatehub.com/" />
        <meta
          name="keywords"
          content="OpenGateHub, Open Gate Hub, Open GateHub, software develop, web develop, páginas web"
        />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta property="og:image" content="/Logo.png" />
      </Head>

      <Container>
        <ImageContainer>
        <Image
          src={cyberSecurity}
          alt="Cyber Security by Open Gate Hub software develop, webapps, paginas web"
          layout="intrinsic"
          width={500} 
          height={300}
        />
        </ImageContainer>
        <Title>
          <span>{t("weAre")}</span> OpenGateHub
        </Title>
        <Title2>
          {t("specializedIn")} <span>{t("webAndMobileApp")}</span>,{" "}
          {t("crafting")} {t("innovativeSolution")}{" "}
          <span>{t("forBusiness")}</span>
        </Title2>
      </Container>
    </>
  );
}





// import React from "react";
// import { useTranslation } from "react-i18next";
// import { Helmet } from "react-helmet";
// import { Container, Title, Image, Title2 } from "./HomePage.styles";
// import cyberSecurity from '../../assets/images/cyberSecurity.png';


// const HomePage = React.forwardRef((props, ref) => {
//   const { t } = useTranslation();

//   return (
//     <>
//       <Helmet>
//         <title>OpenGateHub</title>
//         <meta name="description" content={t("pageDescription")} />
//         <link rel="canonical" href="https://opengatehub.com/" />
//         <meta property="og:title" content={t("OpenGateHub")} />
//         <meta property="og:description" content={t("pageDescription")} />
//         <meta property="og:url" content="https://opengatehub.com/" />
//         <meta
//           name="keywords"
//           content="OpenGateHub, Open Gate Hub, Open GateHub, software develop, web develop, páginas web"
//         />
//         <meta name="robots" content="index, follow" />
//         <meta name="googlebot" content="index, follow" />
//         <meta property="og:image" content="/Logo.png" />{" "}
//       </Helmet>

//       <Container ref={ref}>
//         <Image src={cyberSecurity} alt="Cyber Security by Open Gate Hub software develop, webapps, paginas web"/>
//         <Title>
//           <span>{t("weAre")}</span> OpenGateHub
//         </Title>
//         <Title2>
//           {t("specializedIn")} <span>{t("webAndMobileApp")}</span>,{" "}
//           {t("crafting")}
//           {t("innovativeSolution")} <span>{t("forBusiness")}</span>
//         </Title2>
//       </Container>
//     </>
//   );
// });

// export default HomePage;
