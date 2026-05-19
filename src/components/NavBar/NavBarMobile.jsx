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
  ArrowIcon,
  WorldIcon,
  LangMenuContainer,
} from "./NavBarMobile.styles";
import { useTranslation } from "react-i18next";
import OGHLogo from "../Logo/OGHLogo";

const NavBarMobile = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [isDark, setIsDark] = useState(true);
  const menuRef = useRef(null);

  const closeAllMenus = useCallback(() => {
    setMenuOpen(false);
    setShowLangMenu(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
    setShowLangMenu(false);
  }, []);

  const toggleLangMenu = useCallback(() => {
    setShowLangMenu((prev) => !prev);
  }, []);

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
      router.push(href);
    },
    [closeAllMenus, router],
  );

  // Close on outside click
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

  // Detect background color of the section behind navbar
  useEffect(() => {
    const getActualBg = (el) => {
      while (el && el !== document.documentElement) {
        const bg = window.getComputedStyle(el).backgroundColor;
        const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
          const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
          if (a > 0.5) return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
        }
        el = el.parentElement;
      }
      return { r: 255, g: 255, b: 255 };
    };

    const checkBackground = () => {
      const nav = menuRef.current;
      if (!nav) return;
      const rect = nav.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height + 4;

      nav.style.pointerEvents = "none";
      nav.style.visibility = "hidden";
      const el = document.elementFromPoint(midX, midY);
      nav.style.pointerEvents = "";
      nav.style.visibility = "";

      if (!el) return;

      const { r, g, b } = getActualBg(el);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      setIsDark(brightness < 128);
    };

    checkBackground();
    const interval = setInterval(checkBackground, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <NavBarContainer ref={menuRef} $isDark={isDark}>
      <LogoIcon>
        <Link href="/" aria-label="OpenGateHub Home">
          <Logo>
            <OGHLogo size={17} variant={isDark ? "light" : "dark"} />
          </Logo>
        </Link>
        <MenuIcon onClick={toggleMenu} $isDark={isDark}>
          {menuOpen ? "✕" : "☰"}
        </MenuIcon>
      </LogoIcon>
      {menuOpen && (
        <Menu $isDark={isDark}>
          <MenuItem $isDark={isDark} onClick={() => handleNavigation("/services/workflow-automation")}>
            Workflow Automation
          </MenuItem>
          <MenuItem $isDark={isDark} onClick={() => handleNavigation("/services/staff-augmentation")}>
            Staff Augmentation
          </MenuItem>
          <MenuItem $isDark={isDark} onClick={() => handleNavigation("/blog")}>
            {t("Blog")}
          </MenuItem>
          <MenuItem $isDark={isDark} onClick={() => handleNavigation("/about-us")}>
            {t("aboutUs")}
          </MenuItem>
          <MenuItem $isDark={isDark} onClick={() => handleNavigation("/contact-us")}>
            {t("contactUs")}
          </MenuItem>
          <MenuItem $isDark={isDark} onClick={toggleLangMenu}>
            <LangMenuContainer>
              <WorldIcon $isDark={isDark} />
              {selectedLang === "en" ? "Language" : "Idioma"}
              <ArrowIcon open={showLangMenu} $isDark={isDark} />
            </LangMenuContainer>
          </MenuItem>
          {showLangMenu && (
            <LanguageMenu open={showLangMenu}>
              <LangMenuItem $isDark={isDark} onClick={() => handleLangChange("en")}>
                {t("english")}
              </LangMenuItem>
              <LangMenuItem $isDark={isDark} onClick={() => handleLangChange("es")}>
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
