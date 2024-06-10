import React from "react";
import { Logo, NavBarContainer, NavLink, NavLinks } from "./NavBar.styles";


const NavBar = ({ homeRef, contactRef }) => {
  const handleScroll = (ref) => {
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  return (
    <NavBarContainer>
      <Logo>Logo</Logo>
      <NavLinks>
        <li>
          <NavLink href="#home" onClick={(e) => { e.preventDefault(); handleScroll(homeRef); }}>Home</NavLink>
        </li>
        <li>
          <NavLink href="#contact" onClick={(e) => { e.preventDefault(); handleScroll(contactRef); }}>Contacto</NavLink>
        </li>
      </NavLinks>
    </NavBarContainer>
  );
};

export default NavBar;
