import React, { useState, useEffect } from "react";
import NavBarDesktop from "./NavBarDesktop";
import NavBarMobile from "./NavBarMobile";

const NavBar = () => {
  const [isMobile, setIsMobile] = useState(false); 

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1040);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? <NavBarMobile /> : <NavBarDesktop />;
};

export default NavBar;
