import styled, { css } from "styled-components";
import { FaAngleDown, FaGlobe } from "react-icons/fa";

export const NavBarContainer = styled.nav`
  position: fixed;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 9999;
  border-radius: 4px;
  padding: 0;
  transition: background 0.4s ease, border-color 0.4s ease;

  ${({ $isDark }) =>
    $isDark
      ? css`
          background: #0a0a0a;
          border: 1px solid rgba(255, 255, 255, 0.08);
        `
      : css`
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
        `}
`;

export const LogoIcon = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
`;

export const Logo = styled.div`
  display: flex;
  align-items: center;
`;

export const MenuIcon = styled.div`
  cursor: pointer;
  font-size: 1.3rem;
  padding: 4px;
  transition: color 0.2s ease;
  color: ${({ $isDark }) => ($isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)")};

  &:active {
    color: ${({ $isDark }) => ($isDark ? "#ffffff" : "#111111")};
  }
`;

export const Menu = styled.ul`
  list-style: none;
  margin: 0;
  padding: 8px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-top: 1px solid ${({ $isDark }) => ($isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")};
`;

export const MenuItem = styled.li`
  display: block;
  padding: 12px 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  border-radius: 4px;
  color: ${({ $isDark }) => ($isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)")};

  &:active {
    color: ${({ $isDark }) => ($isDark ? "#ffffff" : "#111111")};
    background: ${({ $isDark }) => ($isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")};
  }
`;

export const LanguageMenu = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: ${({ open }) => (open ? "flex" : "none")};
  flex-direction: column;
`;

export const LangMenuItem = styled.li`
  padding: 10px 24px;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  color: ${({ $isDark }) => ($isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)")};

  &:active {
    color: ${({ $isDark }) => ($isDark ? "#ffffff" : "#111111")};
  }
`;

export const LangMenuContainer = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const ArrowIcon = styled(FaAngleDown)`
  transition: transform 0.2s ease;
  color: ${({ $isDark }) => ($isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)")};
  font-size: 12px;

  ${({ open }) =>
    open &&
    css`
      transform: rotate(180deg);
    `}
`;

export const WorldIcon = styled(FaGlobe)`
  width: 16px;
  height: 16px;
  color: ${({ $isDark }) => ($isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)")};
`;

export const Span = styled.span``;
