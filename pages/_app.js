import { ThemeProvider } from "styled-components";
import GlobalStyles from "../src/styles/GlobalStyles";
import theme from "../src/styles/theme";
import "../src/i18n";
import Head from "next/head";
import NavBar from "../src/components/NavBar/NavBar";
import Footer from "../src/components/Footer/Footer";
import styled from "styled-components";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
// import { FaWhatsapp  } from "react-icons/fa";


const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1;
`;

const Loader = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background-color: ${({ theme }) => theme.colors.accent};;
  animation: loader-animation 1s infinite;
  z-index: 9999;

  @keyframes loader-animation {
    0% {
      width: 0;
    }
    50% {
      width: 50%;
    }
    100% {
      width: 100%;
    }
  }
`;

const FloatingWhatsAppButton = styled.a`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  background-color: #25d366;
  border-radius: 50%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: pointer;
  color: white;

  &:hover {
    transform: scale(1.1);
    transition: transform 0.2s ease-in-out;
  }

  svg {
    width: 30px;
    height: 30px;
  }
`;


export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Head>
        <title>OpenGateHub</title>
        <meta
          name="description"
          content="OpenGateHub specializes in innovative software development for businesses worldwide. Transform your ideas into powerful digital solutions."
        />
        <link rel="icon" href="/browser-link-logo.png" type="image/png" />
        <meta
          property="og:title"
          content="OpenGateHub - Your Trusted Development Partner"
        />
        <meta
          property="og:description"
          content="OpenGateHub specializes in innovative software development for businesses worldwide."
        />
        <meta property="og:image" content="https://opengatehub.com/circular-bgw.png" />
        <meta property="og:url" content="https://opengatehub.com/" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
      </Head>
      <Layout>
        <NavBar />
        {loading && <Loader />}
        <Main>
          <Component {...pageProps} />
        </Main>
        <Footer />
        {/* <FloatingWhatsAppButton
  href="https://wa.me/+5491123485638"
  target="_blank"
  rel="noopener noreferrer"
>
<FaWhatsapp size={40} color="white" />
</FloatingWhatsAppButton> */}
      </Layout>
    </ThemeProvider>
  );
}
