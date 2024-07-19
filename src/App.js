import React, { useRef, Suspense, lazy } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import NavBar from "./components/NavBar/NavBar";
import GlobalStyles from "./styles/GlobalStyles";
import AnimatedElement from "./components/AnimatedElement";
import Footer from "./components/Footer/Footer";
import Spinner from "./components/Spinner/Spinner";
import ScrollToTopButton from "./components/Button/ScrollToTopButton";
const HomePage = lazy(() => import("./pages/HomePage/HomePage"));
const ContactUs = lazy(() => import("./pages/ContactUs/ContactUs"));
const Services = lazy(() => import("./pages/Services/Services"));
const AboutUs = lazy(() => import("./pages/AboutUs/AboutUs"));

function App() {
  const homeRef = useRef(null);
  const aboutUsRef = useRef(null);
  const servicesRef = useRef(null);
  const contactUsRef = useRef(null);

  return (
    <Router>
      <GlobalStyles />
      <NavBar
        homeRef={homeRef}
        aboutUsRef={aboutUsRef}
        servicesRef={servicesRef}
        contactUsRef={contactUsRef}
      />
      <Suspense fallback={<Spinner />}>
        <div>
          <AnimatedElement threshold={0.5}>
            <HomePage ref={homeRef} />
          </AnimatedElement>
          <AnimatedElement threshold={0.8}>
            <Services ref={servicesRef} />
          </AnimatedElement>
          <AnimatedElement threshold={0.5}>
            <AboutUs ref={aboutUsRef} />
          </AnimatedElement>
          <AnimatedElement threshold={0.5}>
            <ContactUs ref={contactUsRef} />
          </AnimatedElement>
        </div>
      </Suspense>
      <ScrollToTopButton />
      <Footer />
    </Router>
  );
}

export default App;
