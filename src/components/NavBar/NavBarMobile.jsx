import React, { useState } from "react";
import Link from "next/link";
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
import {
  ArrowIcon,
  WorldIcon,
  LangMenuContainer,
} from "./NavBarDesktop.styles";
import { MagicMotion, motion, LayoutGroup } from "react-magic-motion";
import { useTranslation } from "react-i18next";

const NavBarMobile = () => {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [showServicesMenu, setShowServicesMenu] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setShowLangMenu(false);
    setShowServicesMenu(false);
  };

  const toggleLangMenu = () => {
    setShowLangMenu(!showLangMenu);
  };

  const toggleServicesMenu = () => {
    setShowServicesMenu(!showServicesMenu);
  };

  const handleLangChange = (lang) => {
    i18n.changeLanguage(lang);
    setSelectedLang(lang);
    setShowLangMenu(false);
  };

  const servicesList = [
    { text: t("frontendTitle"), href: "/services/front-end" },
    { text: t("backendTitle"), href: "/services/back-end" },
    { text: t("uxuiTitle"), href: "/services/ux-ui" },
    { text: t("graphicDesignTitle"), href: "/services/graphic-design" },
  ];

  return (
    <NavBarContainer>
      <LogoIcon>
        <Logo>
          OpenGate<Span>Hub</Span>
        </Logo>
        <MenuIcon onClick={toggleMenu} open={menuOpen}>
          ☰
        </MenuIcon>
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
                <MenuItem onClick={toggleMenu}>
                  <Link href="/">{t("home")}</Link> 
                </MenuItem>
                <MenuItem>
                  <LangMenuContainer
                    style={{ marginBottom: "10px" }}
                    onClick={toggleServicesMenu}
                  >
                    {t("services")}
                    <ArrowIcon open={showServicesMenu} />
                  </LangMenuContainer>
                  {showServicesMenu && (
                    <LanguageMenu open={showServicesMenu}>
                      {servicesList.map((service, index) => (
                        <LangMenuItem key={index} onClick={toggleMenu}>
                          <Link href={service.href}>{service.text}</Link>
                        </LangMenuItem>
                      ))}
                    </LanguageMenu>
                  )}
                </MenuItem>
                <MenuItem onClick={toggleMenu}>
                  <Link href="/about-us">{t("aboutUs")}</Link>
                </MenuItem>
                <MenuItem onClick={toggleMenu}>
                  <Link href="/contact-us">{t("contactUs")}</Link>
                </MenuItem>
                <MenuItem onClick={toggleLangMenu}>
                  <LangMenuContainer>
                    <WorldIcon />
                    {selectedLang === "en" ? "Language  " : "Idioma  "}
                    <ArrowIcon open={showLangMenu} />
                  </LangMenuContainer>
                </MenuItem>
                {showLangMenu && (
                  <LanguageMenu open={showLangMenu}>
                    <LangMenuItem onClick={() => handleLangChange("en")}>
                      {t("english")}
                    </LangMenuItem>
                    <LangMenuItem onClick={() => handleLangChange("es")}>
                      {t("spanish")}
                    </LangMenuItem>
                  </LanguageMenu>
                )}
              </Menu>
            </motion.div>
          )}
        </LayoutGroup>
      </MagicMotion>
    </NavBarContainer>
  );
};

export default NavBarMobile;
