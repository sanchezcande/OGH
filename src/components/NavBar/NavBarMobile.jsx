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

  const closeAllMenus = useCallback(() => {
    setMenuOpen(false);
    setShowLangMenu(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen(!menuOpen);
    setShowLangMenu(false);
  }, [menuOpen]);

  const toggleLangMenu = useCallback(() => {
    setShowLangMenu(!showLangMenu);
  }, [showLangMenu]);

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
          <MenuItem onClick={() => handleNavigation("/services/staff-augmentation")}>
            Staff Augmentation
          </MenuItem>
          <MenuItem onClick={() => handleNavigation("/services/software-factory")}>
            Software Factory
          </MenuItem>
          <MenuItem onClick={() => handleNavigation("/blog")}>
            {t("Blog")}
          </MenuItem>
          <MenuItem onClick={() => handleNavigation("/about-us")}>
            {t("aboutUs")}
          </MenuItem>
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
