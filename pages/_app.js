import { ThemeProvider } from "styled-components";
import GlobalStyles from "../src/styles/GlobalStyles";
import theme from "../src/styles/theme";
import "../src/i18n";
import Head from "next/head";
import NavBar from "../src/components/NavBar/NavBar";
import Footer from "../src/components/Footer/Footer";
import styled from "styled-components";

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1;
`;

export default function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Head>
      <title>OpenGateHub</title>
        <meta name="description" content="OpenGateHub specializes in innovative software development for businesses worldwide. Transform your ideas into powerful digital solutions." />
        <link rel="icon" href="/Reducido4.png" type="image/png" />
        <meta property="og:title" content="OpenGateHub - Your Trusted Development Partner" />
        <meta property="og:description" content="OpenGateHub specializes in innovative software development for businesses worldwide." />
        <meta property="og:image" content="https://opengatehub.com/Logo.png" />
        <meta property="og:url" content="https://opengatehub.com/" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
      </Head>
      <Layout>
        <NavBar />
        <Main>
          <Component {...pageProps} />
        </Main>
        <Footer />
      </Layout>
    </ThemeProvider>
  );
}
