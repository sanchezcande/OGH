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
import { ArrowIcon, WorldIcon, LangMenuContainer } from "./NavBarDesktop.styles";
import { MagicMotion, motion, LayoutGroup } from "react-magic-motion";
import { useTranslation } from "react-i18next"; 

const NavBarMobile = ({ homeRef, aboutUsRef, servicesRef, contactUsRef }) => {
  const { t, i18n } = useTranslation();
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
    i18n.changeLanguage(lang);
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
        <MenuIcon onClick={toggleMenu} open={menuOpen}>☰</MenuIcon>
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
                <MenuItem onClick={() => handleScroll(homeRef)}>       {t("home")} </MenuItem>
                <MenuItem onClick={() => handleScroll(servicesRef)}>
                {t("services")} 
                </MenuItem>
                <MenuItem onClick={() => handleScroll(aboutUsRef)}>
                {t("aboutUs")}
                </MenuItem>
                <MenuItem onClick={() => handleScroll(contactUsRef)}>
                {t("contactUs")} 
                </MenuItem>
                <MenuItem onClick={toggleLangMenu}>
                  <LangMenuContainer>
                  <WorldIcon />
                  {selectedLang === "en" ? "Language  " : "Idioma  "}
                  <ArrowIcon open={showLangMenu} />
                  </LangMenuContainer>
                </MenuItem>
                <LanguageMenu open={showLangMenu}>
                  <LangMenuItem onClick={() => handleLangChange("en")}>
                  {t("english")}
                  </LangMenuItem>
                  <LangMenuItem onClick={() => handleLangChange("es")}>
                  {t("spanish")}
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
