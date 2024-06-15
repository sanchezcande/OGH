import React, { useState } from "react";
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
  ArrowIcon
} from "./NavBarDesktop.styles";
import { MagicTabSelect } from "react-magic-motion";

const pillTabs = [
  { text: "Home", ref: "homeRef", href: "#home" },
  { text: "Services", ref: "servicesRef", href: "#services" },
  { text: "About Us", ref: "aboutUsRef", href: "#about-us" },
  { text: "Contact Us", ref: "contactUsRef", href: "#contact-us" },
];

const NavBar = ({ homeRef, aboutUsRef, servicesRef, contactUsRef }) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState("en");

  const handleScroll = (ref) => {
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleLangMenu = () => {
    setShowLangMenu(!showLangMenu);

  };

  const handleLangChange = (lang) => {
     setSelectedLang(lang);
    setShowLangMenu(false);
    console.log(`Cambiando a ${lang}`);
  };

  const tabsComponents = pillTabs.map((tab, i) => (
    <li key={tab.text}>
      <NavLink
        href={tab.href}
        onMouseEnter={() => setHoveredIndex(i)}
        onClick={(e) => {
          e.preventDefault();
          handleScroll(
            tab.ref === "homeRef"
              ? homeRef
              : tab.ref === "aboutUsRef"
              ? aboutUsRef
              : tab.ref === "servicesRef"
              ? servicesRef
              : contactUsRef
          );
        }}
      >
        {hoveredIndex === i && (
          <MagicTabSelect
            id="pillTabs"
            transition={{ type: "spring", bounce: 0.35 }}

          >
            <span
              style={{
                borderRadius: "999px",
                position: "absolute",
                top: '-5px',
                left: '-30px',
                right: '-30px',
                bottom: '-5px',
                zIndex: -1,
                backgroundColor: "rgba(21, 62, 108, 0.84)",
              }}
            />
          </MagicTabSelect>
        )}
        {tab.text}
      </NavLink>
    </li>
  ));

  return (
    <NavBarContainer>
      <Logo>
        OpenGate<Span>Hub</Span>
      </Logo>
      <NavLinks>{tabsComponents}</NavLinks>
      <div>
        <LangMenuContainer onClick={toggleLangMenu}>
          <WorldIcon />
          <StyledLangText>{selectedLang === "en" ? "English" : "Español"}</StyledLangText>
          <ArrowIcon open={showLangMenu} />
        </LangMenuContainer>
        {showLangMenu && (
          <LangMenu isOpen={showLangMenu}>
            {selectedLang === "en" ? (
              <LangMenuItem
                onClick={() => handleLangChange("es")}
              >
                Español
              </LangMenuItem>
            ) : (
              <LangMenuItem
                onClick={() => handleLangChange("en")}
              >
                English
              </LangMenuItem>
            )}
          </LangMenu>
        )}
      </div>
    </NavBarContainer>
  );
};

export default NavBar;
