import React, { useRef } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import NavBar from "./components/NavBar/NavBar";
import HomePage from "./pages/HomePage/HomePage";
import GlobalStyles from "./styles/GlobalStyles";
import ContactUs from "./pages/ContactUs/ContactUs";
import Services from "./pages/Services/Services";
import AboutUs from "./pages/AboutUs/AboutUs";
import AnimatedElement from "./components/AnimatedElement";
import Footer from "./components/Footer/Footer";

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
      <Footer />
    </Router>
  );
}

export default App;
