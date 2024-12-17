import styled from "styled-components";

export const ServiceContainer = styled.section`
  background: linear-gradient(135deg, #0b2343, #123456);
  color: ${({ textColor }) => textColor || "#e0e0e0"};
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

export const ServiceTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: white;
  text-transform: uppercase;
`;

export const ServiceList = styled.ul`
  list-style: none;
  margin-left: 0;
  padding-left: 0;

  li {
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;

    &::before {
      content: "✓"; 
      color: #00d4ff;
      font-weight: bold;
      margin-right: 0.75rem;
    }
  }
`;

export const HighlightText = styled.p`
  font-size: 1.3rem;
  font-weight: 600;
  text-align: center;
  margin-top: 2rem;
  color: #00d4ff;
`;

export const Divider = styled.hr`
  border: none;
  height: 3px;
  background-color: #00d4ff;
  margin: 2rem 0;
  width: 50%;
  margin-right: auto;
`;

export const Description = styled.p`
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    `;