import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
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
  ArrowIcon,
  WorldIcon,
  LangMenuContainer,
} from "./NavBarMobile.styles";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import Logo4 from "../../../public/Logo4.png";

const NavBarMobile = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [showServicesMenu, setShowServicesMenu] = useState(false);

  const closeAllMenus = useCallback(() => {
    setMenuOpen(false);
    setShowLangMenu(false);
    setShowServicesMenu(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen(!menuOpen);
    setShowLangMenu(false);
    setShowServicesMenu(false);
  }, [menuOpen]);

  const toggleLangMenu = useCallback(() => {
    setShowLangMenu(!showLangMenu);
  }, [showLangMenu]);

  const toggleServicesMenu = useCallback(() => {
    setShowServicesMenu(!showServicesMenu);
  }, [showServicesMenu]);

  const handleLangChange = useCallback(
    (lang) => {
      i18n.changeLanguage(lang);
      setSelectedLang(lang);
      setShowLangMenu(false);
    },
    [i18n],
  );

  const handleNavigation = useCallback(
    (href) => {
      closeAllMenus();
      // Prevent double clicks and ensure smooth navigation
      router.push(href);
    },
    [closeAllMenus, router],
  );

  // Close menu when clicking outside
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeAllMenus();
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen, closeAllMenus]);

  const servicesList = [
    {
      text: "Staff Augmentation",
      href: "/services/staff-augmentation",
      featured: true,
    },
    { text: "n8n Automation", href: "/services/n8n-automation" },
    { text: t("aiTitle"), href: "/services/AI" },
    { text: t("frontendTitle"), href: "/services/front-end" },
    { text: t("backendTitle"), href: "/services/back-end" },
    { text: t("uxuiTitle"), href: "/services/ux-ui" },
    { text: t("graphicDesignTitle"), href: "/services/graphic-design" },
  ];

  return (
    <NavBarContainer ref={menuRef}>
      <LogoIcon>
        <Link href="/">
          <Logo>
            <Image src={Logo4} alt="OpenGateHub Logo" width={210} />
          </Logo>
        </Link>

        <MenuIcon onClick={toggleMenu} open={menuOpen}>
          ☰
        </MenuIcon>
      </LogoIcon>
      {menuOpen && (
        <Menu open={menuOpen}>
          <MenuItem onClick={() => handleNavigation("/")}>{t("home")}</MenuItem>
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
                  <LangMenuItem
                    key={index}
                    onClick={() => handleNavigation(service.href)}
                    style={
                      service.featured
                        ? {
                            background:
                              "linear-gradient(135deg, #FFF5F5 0%, #FEF2F2 100%)",
                            fontWeight: "500",
                          }
                        : {}
                    }
                  >
                    {service.text}
                    {service.featured && (
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "0.75rem",
                        }}
                      >
                        ⭐
                      </span>
                    )}
                  </LangMenuItem>
                ))}
              </LanguageMenu>
            )}
          </MenuItem>
          <MenuItem onClick={() => handleNavigation("/about-us")}>
            {t("aboutUs")}
          </MenuItem>

          <MenuItem onClick={() => handleNavigation("/blog")}>Blog</MenuItem>
          <MenuItem onClick={() => handleNavigation("/faqs")}>FAQs</MenuItem>
          <MenuItem onClick={() => handleNavigation("/contact-us")}>
            {t("contactUs")}
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
      )}
    </NavBarContainer>
  );
};

export default NavBarMobile;
