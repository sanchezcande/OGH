import styled, { css, keyframes } from "styled-components";
import { Link } from "react-router-dom";
import { ReactComponent as worldIcon } from "../../assets/icons/worldIcon.svg";
import { FaAngleDown } from "react-icons/fa";

export const NavBarContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #333;
  color: white;
  width: 100%;
  background-color: transparent;
  marging-right:10px;

`;

export const Logo = styled.div`
  font-weight: 800;
  font-size: 28px;
`;

export const Span = styled.span`
  font-weight: 400;
`;

export const NavLinks = styled.ul`
  display: flex;
  gap: 50px;
  list-style: none;
  border-radius: 40px;
  background-color: rgba(21, 62, 108, 0.34);
  padding: 15px 30px;
  border: 2px solid #0034ee;

`;

export const NavLink = styled(Link)`
position: relative;
padding: 0.65rem 0.75rem;
color: white;
border: 0;
borderRadius: 999px;
`;

export const LangMenuContainer = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  position: relative;
  margin-right: 25px;
`;

const slideDown = keyframes`
  from {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  to {
    max-height: 200px;
    opacity: 1;
    padding-top: 10px;
    padding-bottom: 10px;
  }
`;

const slideUp = keyframes`
  from {
    max-height: 200px;
    opacity: 1;
    padding-top: 10px;
    padding-bottom: 10px;
  }
  to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
`;

export const LangMenu = styled.ul`
  position: absolute;
  list-style-type: none;
  margin: 0;
  background-color: transparent;
  padding: 0;
  right: 0;
  padding-right: 55px;
  border-radius: 5px;
  max-height: 200px;
  overflow: hidden;
  animation: ${(props) => (props.isOpen ? slideDown : slideUp)} 0.4s ease forwards;
`;

export const LangMenuItem = styled.li`
  padding: 10px;
  cursor: pointer;
  right: 0;
  transition: background-color 0.5s ease, color 0.5s ease;
  &:hover {
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 40px;
    color: ${(props) => props.theme.colors.primary};
  }
`;

export const WorldIcon = styled(worldIcon)`
  width: 32px;
  height: 32px;
  margin-right: 10px;
`;

export const StyledLangText = styled.span`
  font-weight: 500;
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
