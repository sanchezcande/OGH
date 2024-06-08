import React from 'react';
import { NavBarContainer, Logo, NavLink, NavLinks } from './NavBar.styles';

const NavBar = () => {
  return (
    <NavBarContainer>
      <Logo>MiLogo</Logo>
      <NavLinks>
        <NavLink to="/">Inicio</NavLink>
        <NavLink to="/contact">Contacto</NavLink>
        <NavLink to="/about">Acerca de</NavLink>
      </NavLinks>
    </NavBarContainer>
  );
};

export default NavBar;
