import React from "react";
import { Logo, NavBarContainer, NavLink, NavLinks } from "./NavBar.styles";

const NavBar = () => {
  return (
    <NavBarContainer>
      <Logo>Logo</Logo>
      <NavLinks>
        <li>
          <NavLink to="/">Home</NavLink>
        </li>
        <li>
          <NavLink to="/contact">Contacto</NavLink>
        </li>
      </NavLinks>
    </NavBarContainer>
  );
};

export default NavBar;
