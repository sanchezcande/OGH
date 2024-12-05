import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Logo,
  Span,
  NavBarContainer,
  NavLink,
  NavLinks,
  LangMenuContainer,
  LangMenu,
  LangMenuItem,
  WorldIcon,
  StyledLangText,
  HighlightBar,
  ArrowIcon,
  ServicesMenu,
  ServicesMenuItem,
} from "./NavBarDesktop.styles";
import { useTranslation } from "react-i18next";

const NavBarDesktop = () => {
  const { t, i18n } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState("en");
  const [tabWidths, setTabWidths] = useState([]);
  const [tabOffsets, setTabOffsets] = useState([]);
  const [showServicesMenu, setShowServicesMenu] = useState(false);

  const toggleLangMenu = () => {
    setShowLangMenu(!showLangMenu);
  };

  useEffect(() => {
    console.log("showServicesMenu cambió a:", showServicesMenu);
  }, [showServicesMenu]);

  const handleLangChange = (lang) => {
    i18n.changeLanguage(lang);
    setSelectedLang(lang);
    setShowLangMenu(false);
  };

  const pillTabs = [
    { text: t("home"), href: "/" },
    { text: t("services"), href: "/services" },
    { text: t("aboutUs"), href: "/about-us" },
    { text: t("Blog"), href: "/blog" },
    { text: t("contactUs"), href: "/contact-us" },
  ];

  const servicesList = [
    { text: t("frontendTitle"), href: "/services/front-end" },
    { text: t("backendTitle"), href: "/services/back-end" },
    { text: t("uxuiTitle"), href: "/services/ux-ui" },
    { text: t("graphicDesignTitle"), href: "/services/graphic-design" },
  ];

  useEffect(() => {
    const navLinks = document.querySelectorAll(".nav-link");
    const widths = Array.from(navLinks).map((link) => link.offsetWidth);
    const offsets = Array.from(navLinks).map((link) => link.offsetLeft);
    setTabWidths(widths);
    setTabOffsets(offsets);
  }, []);

  return (
    <NavBarContainer>
      <Logo>
        OpenGate<Span>Hub</Span>
      </Logo>
      <NavLinks>
        {tabOffsets.length > 0 && tabWidths.length > 0 && (
          <HighlightBar
            $hoveredIndex={hoveredIndex}
            $tabWidths={tabWidths}
            $tabOffsets={tabOffsets}
          />
        )}
        {pillTabs.map((tab, i) => (
          <li key={tab.text}>
            {tab.text === t("services") ? (
              <NavLink
                className="nav-link"
                onMouseEnter={() => {
                  setHoveredIndex(i);
                  setShowServicesMenu(true);
                }}
              >
                <span>{tab.text}</span>
                {showServicesMenu && (
                  <ServicesMenu
                    $isOpen={showServicesMenu}
                    onMouseLeave={() => setShowServicesMenu(false)}
                  >
                    {servicesList.map((service, index) => (
                      <ServicesMenuItem key={index}>
                        <Link href={service.href}>{service.text}</Link>
                      </ServicesMenuItem>
                    ))}
                  </ServicesMenu>
                )}
              </NavLink>
            ) : (
              <NavLink
                className="nav-link"
                onMouseEnter={() => {
                  setHoveredIndex(i);
                  setShowServicesMenu(false);
                }}
              >
                <Link href={tab.href}>{tab.text}</Link>
              </NavLink>
            )}
          </li>
        ))}
      </NavLinks>
      <div>
        <LangMenuContainer onClick={toggleLangMenu}>
          <WorldIcon />
          <StyledLangText>
            {selectedLang === "en" ? t("english") : t("spanish")}
          </StyledLangText>
          <ArrowIcon open={showLangMenu} />
        </LangMenuContainer>
        {showLangMenu && (
          <LangMenu $isOpen={showLangMenu}>
            {selectedLang === "en" ? (
              <LangMenuItem onClick={() => handleLangChange("es")}>
                {t("spanish")}
              </LangMenuItem>
            ) : (
              <LangMenuItem onClick={() => handleLangChange("en")}>
                {t("english")}
              </LangMenuItem>
            )}
          </LangMenu>
        )}
      </div>
    </NavBarContainer>
  );
};

export default NavBarDesktop;
