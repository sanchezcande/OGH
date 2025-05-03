import styled, { css } from "styled-components";
import { FaAngleDown, FaGlobe } from "react-icons/fa";

export const MenuIcon = styled.div`
  cursor: pointer;
  font-size: 1.5rem;
  transition: transform 0.3s ease;
  color: ${({ theme }) => theme.colors.text};
  transform: ${({ open }) => (open ? "rotate(-90deg)" : "rotate(0)")};
`;

export const LanguageMenu = styled.ul`
  top: calc(100% + 5px);
  position: relative;
  width: 100%;
  background-color: transparent;
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
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  box-shadow: ${({ theme }) => theme.boxShadow};
  border-radius: ${({ theme }) => theme.borderRadius};
  position: relative;
`;

export const Logo = styled.div`
  font-weight: 700;
  font-size: 24px;
  color: ${({ theme }) => theme.colors.primary};
  width: 60%;
`;

export const Span = styled.span`
  font-weight: 400;
`;

export const LangMenuItem = styled.li`
  display: block;
  padding: 1rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.text};
  transition: transform 0.2s ease;

  &:active {
    transform: scale(1.05);
    font-weight: 600;
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
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: ${({ theme }) => theme.borderRadius};
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const MenuItem = styled.li`
  display: block;
  padding: 1rem;
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: transform 0.2s ease;

  &:active {
    transform: scale(1.05);
    font-weight: 600;
  }
`;

export const ArrowIcon = styled(FaAngleDown)`
  transition: transform 0.3s ease-in-out;
  color: ${({ theme }) => theme.colors.text};

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
  color: ${({ theme }) => theme.colors.text};
`;

export const LangMenuContainer = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  position: relative;
  margin-right: 25px;
`;
