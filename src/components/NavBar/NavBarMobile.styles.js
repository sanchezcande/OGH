import styled, { css } from "styled-components";
import { FaAngleDown, FaGlobe } from "react-icons/fa";


export const MenuIcon = styled.div`
  cursor: pointer;
  font-size: 1.5rem;
  transition: transform 0.3s ease; 
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
  margin-right: 1rem;
  margin-left: 1rem;
`;

export const NavBarContainer = styled.nav`
  margin-top: 10px;
  display: block;
  margin-left: 1rem;
  margin-right: 1rem;
  justify-content: space-between;
  align-items: center;
  padding-right: 1rem;
  padding-left: 1rem;
  background-color: rgba(21, 62, 108, 0.34);
  border: 2px solid #155ab8;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 60px;
  position: relative;
`;

export const Logo = styled.div`
  font-weight: 700;
  font-size: 24px;
  margin-top: 10px;
  width: 60%;
`;

export const Span = styled.span`
  font-weight: 400;
`;

export const LangMenuItem = styled.li`
  display: block;
  flex: 1;
  text-decoration: none;
  cursor: pointer;
  border-radius: 40px;
  padding: 1rem;
  &:hover {
  background-color: rgba(21, 62, 108, 0.34);
  border-radius: 40px;

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
  background-color: #333;
  margin: 4px 0;
`;

export const Menu = styled.ul`
  list-style: none;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: transparent;
  justify-content: flex-start;
  gap: 0.5rem;
  width: fit-content;
  margin: 1rem 0;
  padding: 0.75rem;
  border-radius: 0.5rem;
  min-width: 12.5rem;
`;

export const MenuItem = styled.li`
  text-decoration: none;
  display: block;
  width: 100%;
  border-radius: 40px;
  align-items: center;
  padding: 1rem;
  transition: background-color 0.3s ease;
  color: white;

  &:hover {
    background-color: rgba(21, 62, 108, 0.34);

    border-radius: 40px;
  }

`;
export const ArrowIcon = styled(FaAngleDown)`
  transition: transform 0.3s ease-in-out;
  ${({ open }) =>
    open &&
    css`
      animation: rotate 0.3s ease-in-out;
      transform: rotate(180deg);
    `}
`;

export const WorldIcon = styled(FaGlobe)`
  width: 32px;
  height: 32px;
  margin-right: 10px;
`;

export const LangMenuContainer = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  position: relative;
  margin-right: 25px;
`;