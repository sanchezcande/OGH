import React, { Suspense, lazy, useRef, useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import NavBar from "./components/NavBar/NavBar";
import GlobalStyles from "./styles/GlobalStyles";
import AnimatedElement from "./components/AnimatedElement/AnimatedElement";
import Footer from "./components/Footer/Footer";
import Spinner from "./components/Spinner/Spinner";
import ScrollToTopButton from "./components/Button/ScrollToTopButton";
import useIsDesktop from "./Hooks/useIsDesktop";

const HomePage = lazy(() => import("./pages/HomePage/HomePage"));
const ContactUs = lazy(() => import("./pages/ContactUs/ContactUs"));
const Services = lazy(() => import("./pages/Services/Services"));
const AboutUs = lazy(() => import("./pages/AboutUs/AboutUs"));

function App() {
  const [isRestLoaded, setIsRestLoaded] = useState(false);
  const isDesktop = useIsDesktop();
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRestLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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
      <div>
        <AnimatedElement threshold={0.5}>
          <HomePage ref={homeRef} />
        </AnimatedElement>
        {isRestLoaded && (
          <Suspense fallback={<Spinner />}>
            {isDesktop ? (
              <AnimatedElement threshold={0.1}>
                <Services ref={servicesRef} />
              </AnimatedElement>
            ) : (
              <AnimatedElement threshold={0.01}>
                <Services ref={servicesRef} />
              </AnimatedElement>
            )}
            {isDesktop ? (
              <AnimatedElement threshold={0.1}>
                <AboutUs ref={aboutUsRef} />
              </AnimatedElement>
            ) : (
              <AnimatedElement threshold={0.001}>
                <AboutUs ref={aboutUsRef} />
              </AnimatedElement>            )}
            <AnimatedElement threshold={0.5}>
              <ContactUs ref={contactUsRef} />
            </AnimatedElement>
          </Suspense>
        )}
      </div>

      <ScrollToTopButton />
      <Footer />
    </Router>
  );
}

export default App;
