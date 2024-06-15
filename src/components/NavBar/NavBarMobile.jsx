import React, { useState } from "react";
import {
  NavBarContainer,
  Logo,
  MenuIcon,
  LogoIcon,
  Menu,
  MenuItem,
  LanguageMenu,
  LangMenuItem,
  Span,
} from "./NavBarMobile.styles";
import { MagicMotion, motion, LayoutGroup } from "react-magic-motion";

const NavBarMobile = ({ homeRef, aboutUsRef, servicesRef, contactUsRef }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setShowLangMenu(false);
  };

  const toggleLangMenu = () => {
    setShowLangMenu(!showLangMenu);
  };

  const handleLangChange = (lang) => {
    setSelectedLang(lang);
    setShowLangMenu(false);
  };

  const handleScroll = (ref) => {
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  return (
    <NavBarContainer>
      <LogoIcon>
      <Logo>
        OpenGate<Span>Hub</Span>
      </Logo>
        <MenuIcon onClick={toggleMenu}>☰</MenuIcon>
      </LogoIcon>
      <MagicMotion transition={{ type: "spring", stiffness: 200, damping: 15 }}>
        <LayoutGroup animate>
          {menuOpen && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Menu open={menuOpen}>
                <MenuItem onClick={() => handleScroll(homeRef)}>Home</MenuItem>
                <MenuItem onClick={() => handleScroll(servicesRef)}>
                  Services
                </MenuItem>
                <MenuItem onClick={() => handleScroll(aboutUsRef)}>
                  About Us
                </MenuItem>
                <MenuItem onClick={() => handleScroll(contactUsRef)}>
                  Contact Us
                </MenuItem>
                <MenuItem onClick={toggleLangMenu}>
                  {selectedLang === "en" ? "Language" : "Idioma"}
                </MenuItem>
                  <LanguageMenu open={showLangMenu}>
                  <LangMenuItem onClick={() => handleLangChange("en")}>
                    English
                  </LangMenuItem>
                  <LangMenuItem onClick={() => handleLangChange("es")}>
                    Español
                  </LangMenuItem>
                </LanguageMenu>
              </Menu>
            </motion.div>
          )}
        </LayoutGroup>
      </MagicMotion>
    </NavBarContainer>
  );
};

export default NavBarMobile;
