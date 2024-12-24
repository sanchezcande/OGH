import styled from "styled-components";

export const FAQContainer = styled.section`
  background: #0b2343;
  color: #e0e0e0;
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

export const FAQTitle = styled.h1`
  font-size: 2.2rem;
  font-weight: 200;
  margin-bottom: 2rem;
  text-align: left;
  color: white;
  margin-left: 2.6rem;
`;

export const FAQTitle1 = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
  color: white;
`;

export const FAQList = styled.ul`
  list-style: none;
  padding: 0;

  li {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    position: relative;
    padding-left: 2.5rem;
    opacity: 0;
    transform: translateY(20px);
    will-change: opacity, transform;
    transition: opacity 0.6s ease, transform 0.6s ease;

    &.visible {
      opacity: 1;
      transform: translateY(0);
    }

    &::before {
      content: '➤';
      position: absolute;
      left: 0;
      top: 0;
      color: ${({ theme }) => theme.colors.lightBlue};
      font-size: 1.5rem;
      font-weight: bold;
      transition: transform 0.3s ease;
    }

    &:hover::before {
      transform: translateX(5px);
    }
  }
`;

export const Question = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #ffffff;
`;

export const Answer = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: #e0e0e0;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.8);
  }
`;
