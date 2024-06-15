import React, { useState, useEffect } from "react";
import NavBarDesktop from "./NavBarDesktop";
import NavBarMobile from "./NavBarMobile";

const NavBar = ({ homeRef, aboutUsRef, servicesRef, contactUsRef }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1040);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1040);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? (
    <NavBarMobile
      homeRef={homeRef}
      aboutUsRef={aboutUsRef}
      servicesRef={servicesRef}
      contactUsRef={contactUsRef}
    />
  ) : (
    <NavBarDesktop
      homeRef={homeRef}
      aboutUsRef={aboutUsRef}
      servicesRef={servicesRef}
      contactUsRef={contactUsRef}
    />
  );
};

export default NavBar;
