import React from "react";
import useMediaQuery from "../../Hooks/useMediaQuery";
import NavBarDesktop from "./NavBarDesktop";
import NavBarMobile from "./NavBarMobile";

const NavBar = () => {
  const isMobile = useMediaQuery("(max-width: 1020px)");

  return isMobile ? <NavBarMobile /> : <NavBarDesktop />;
};

export default NavBar;
