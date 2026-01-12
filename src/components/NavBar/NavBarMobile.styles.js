import styled, { css } from "styled-components";
import { FaAngleDown, FaGlobe } from "react-icons/fa";

export const MenuIcon = styled.div`
  cursor: pointer;
  font-size: 1.5rem;
  transition: transform 0.2s ease;
  color: #374151;
  transform: ${({ open }) => (open ? "rotate(-90deg)" : "rotate(0)")};
`;

export const LanguageMenu = styled.ul`
  top: calc(100% + 5px);
  position: relative;
  width: 100%;
  background-color: transparent;
  border: none;
  border-radius: 0;
  margin-top: 4px;
  padding: 0;
  box-shadow: none;
  display: ${({ open }) => (open ? "flex" : "none")};
  flex-direction: column;
`;

export const LogoIcon = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  margin: 0 1rem;
`;

export const NavBarContainer = styled.nav`
  margin: 10px 1rem 0 1rem;
  padding: 0.5rem 1rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  position: relative;
`;

export const Logo = styled.div`
  font-weight: 700;
  font-size: 24px;
  color: #374151;
  width: 60%;
  margin-top: 0.6rem;
`;

export const Span = styled.span`
  font-weight: 400;
`;

export const LangMenuItem = styled.li`
  display: block;
  padding: 10px 16px;
  border-radius: 0;
  color: #374151;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 44px;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 400;
  border-bottom: none;
  padding-left: 24px;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background-color: transparent;
    color: #f97b72;
    border-left: none;
    padding-left: 24px;
  }
`;

export const BurgerMenu = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
`;

export const BurgerMenuIcon = styled.div`
  width: 25px;
  height: 3px;
  background-color: ${({ theme }) => theme.colors.text};
  margin: 4px 0;
`;

export const Menu = styled.ul`
  list-style: none;
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: #ffffff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const MenuItem = styled.li`
  display: block;
  padding: 0.75rem 1rem;
  color: #374151;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 15px;
  font-weight: 400;

  &:active {
    background-color: #f9fafb;
    color: #f97b72;
  }
`;

export const ArrowIcon = styled(FaAngleDown)`
  transition: transform 0.2s ease-in-out;
  color: #374151;

  ${({ open }) =>
    open &&
    css`
      transform: rotate(180deg);
    `}
`;

export const WorldIcon = styled(FaGlobe)`
  width: 24px;
  height: 24px;
  margin-right: 10px;
  color: #374151;
`;

export const LangMenuContainer = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  position: relative;
  margin-right: 25px;
`;
