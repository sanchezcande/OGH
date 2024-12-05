import styled, { css, keyframes } from "styled-components";
import { FaAngleDown, FaGlobe } from "react-icons/fa";

export const NavBarContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #333;
  color: white;
  width: 100%;
  background-color: transparent;
  margin-right: 10px;
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
  list-style: none;
  border-radius: 40px;
  background-color: rgba(21, 62, 108, 0.34);
  padding: 15px 30px;
  border: 2px solid #0034ee;
  position: relative;
  justify-content: center;
  gap: 50px;
  overflow: hidden;

  @media (max-width: 1165px) {
    gap: 10px;
  }


`;

export const NavLink = styled.span`
  position: relative;
  padding: 10px 20px;
  color: white;
  cursor: pointer;
  text-decoration: none;
  font-size: 16px;
  z-index: 1;
  transition: color 0.3s ease;

  &:hover {
    color: #ddd;
  }
  &.last-item {
    width: 120px !important; /* Fija un ancho para el último item */
    text-align: center;
  }
 
`;

export const HighlightBar = styled.div`
  position: absolute;
  bottom: 0;
  left: ${({ $hoveredIndex, $tabOffsets }) =>
    $tabOffsets[$hoveredIndex] - 30 || 0}px;
  width: ${({ $hoveredIndex, $tabWidths }) =>
    ($tabWidths[$hoveredIndex] || 0) + 60}px;
  height: 100%;
  background-color: rgba(21, 62, 108, 0.84);
  border-radius: 999px;
  transition: left 0.3s ease, width 0.3s ease;
  z-index: 0;
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
  animation: ${(props) => (props.$isOpen ? slideDown : slideUp)} 0.4s ease
    forwards;
`;

export const LangMenuItem = styled.li`
  padding: 10px;
  cursor: pointer;
  right: 0;
  border-radius: 40px;
  transition: background-color 0.5s ease, color 0.5s ease;
  &:hover {
    background-color: rgba(255, 255, 255, 0.8);
    color: ${(props) => props.theme.colors.primary};
  }

`;

export const WorldIcon = styled(FaGlobe)`
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

export const ServicesMenu = styled.ul`
  position: absolute;
  top: 115%;
  left: 50%;
  transform: translateX(-50%);
  list-style: none;
  border: 1px solid #0034ee;
  border-radius: 5px;
  background-color: #001f3f;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: hidden;
  margin: 0;
  padding: 0;

  animation: ${(props) => (props.$isOpen ? slideDown : slideUp)} 0.4s ease
    forwards;
  visibility: ${(props) => (props.$isOpen ? "visible" : "hidden")};
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
`;

export const ServicesMenuItem = styled.li`
  padding: 8px 12px;
  cursor: pointer;
  color: white;
  text-weight: 100;
  font-size: 14px;
  min-width: 200px;
  transition: background-color 0.5s ease, color 0.5s ease, font-size 0.5s ease;
  &:hover {
    background-color: rgba(21, 62, 108, 0.84);
    font-size: 15px;
  }
`;
