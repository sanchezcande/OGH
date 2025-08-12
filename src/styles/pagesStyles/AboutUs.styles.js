import styled, { keyframes } from "styled-components";

// Keyframes for text content (h1 and its span) sliding in from top
const slideInFromTopText = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 3rem;
  padding: 2rem;
  background: #ffffff;
  color: ${({ theme }) => theme.colors.text};
  min-height: 100vh;

  @media (max-width: 768px) {
    margin: 2rem 1rem;
    padding: 10px;
  }

  /* H1 styles are now within ImageText for better specificity regarding animation */
  
  /* Smooth scrolling for better animation experience */
  scroll-behavior: smooth;
`;

export const ImageText = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-bottom: 3rem;
  gap: 2rem;
  flex-wrap: wrap;

  .image-container {
    flex: 1;
    max-width: 300px;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;

    &.visible {
      opacity: 1;
      transform: translateY(0);
    }

    img {
      width: 100%;
      height: auto;
      border-radius: 50%;
      box-shadow: 
        0 10px 20px rgba(0, 0, 0, 0.1),
        0 6px 6px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(0, 0, 0, 0.05);
      background-color: #ffffff;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 
          0 15px 30px rgba(0, 0, 0, 0.12),
          0 8px 8px rgba(0, 0, 0, 0.12),
          0 0 0 1px rgba(0, 0, 0, 0.05);
      }
    }

    .founder-info {
      margin-top: 15px;
      padding: 10px;
      background-color: #ffffff;
      width: 100%;
      max-width: 250px;
      text-align: center;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s;

      .image-container.visible & {
        opacity: 1;
        transform: translateY(0);
      }
      
      .founder-name {
        font-size: 1.2rem;
        font-weight: 600;
        color: #333333;
        margin: 0 0 3px 0;
        text-align: center;
        display: block;
      }
      
      .founder-role {
        font-size: 0.9rem;
        font-weight: 400;
        color: #555555;
        text-align: center;
        display: block;
        font-style: italic;
        margin: 0;
      }
    }
  }

  div:not(.image-container) { // Text container
    flex: 2;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    opacity: 0;
    transform: translateY(-30px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    transition-delay: 0.2s; // Delay for the container itself

    &.visible {
      opacity: 1;
      transform: translateY(0);

      h1 {
        opacity: 0;
        transform: translateY(-20px);
        animation: ${slideInFromTopText} 0.6s ease-out 0.2s forwards;
      }

      h1 span:not(.highlighted-class-placeholder) {
        opacity: 0;
        transform: translateY(-20px);
        animation: ${slideInFromTopText} 0.6s ease-out 0.4s forwards;
      }
    }
    
    h1 {
      font-size: 2.5rem;
      color: ${({ theme }) => theme.colors.primaryDark};
      text-align: left;
      margin: 0;
      font-weight: 700;
      line-height: 1.2;
      /* Note: HighlightedWord component will inherit these font styles */

      span:not(.highlighted-class-placeholder) {
        font-size: 1rem;
        display: block;
        margin-top: 10px;
        color: ${({ theme }) => theme.colors.textAlt};
        font-weight: 400;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
        line-height: 1.6;
      }
    }

    h1 + h2.subtitle {
      margin-top: 0.5rem;
    }

    h2.subtitle {
      font-size: 1.5rem;
      color: ${({ theme }) => theme.colors.primaryDark};
      text-align: left;
      margin: 0;
      font-weight: 400;
      line-height: 1.2;
    }

    h2.subtitle + p {
      margin-top: 1.5rem;
    }

    p {
      white-space: pre-line;
      text-align: left;
      color: ${({ theme }) => theme.colors.textMuted};
      line-height: 1.45;
      margin: 0;
    }

    .bold-text {
      font-weight: 600;
      color: ${({ theme }) => theme.colors.primaryDark};
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;

    .image-container,
    div:not(.image-container) {
      max-width: 100%;
    }
  }
`;

// Keyframes for the word highlight animation (remains the same)
const highlightAnimation = keyframes`
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
`;

// Styled component for the highlighted word (remains the same)
export const HighlightedWord = styled.span.attrs(() => ({
  className: 'highlighted-class-placeholder' 
}))`
  display: inline-block;
  position: relative;
  color: white;
  padding: 0.05em 0.15em; 
  border-radius: 3px;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: ${({ theme }) => theme.colors.accent}; 
    transform-origin: left;
    z-index: -1;
    border-radius: inherit;
    transform: scaleX(0);
  }

  &.animate::before {
    animation: ${highlightAnimation} 0.5s ease-out 0.3s forwards;
  }
`;

export const TeamSection = styled.section`
  width: 100%;
  max-width: 1200px;
  margin: 4rem auto;
  padding: 2rem 0;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .team-title {
    text-align: center;
    font-size: 2.5rem;
    color: ${({ theme }) => theme.colors.primaryDark};
    margin-bottom: 1rem;
    font-weight: 700;
  }

  .team-subtitle {
    text-align: center;
    font-size: 1.2rem;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-bottom: 3rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.6;
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 2rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
`;

export const TeamMemberCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.05),
    0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 
      0 8px 25px rgba(0, 0, 0, 0.1),
      0 4px 10px rgba(0, 0, 0, 0.05);
  }

  .member-image {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    margin: 0 auto 1rem;
    overflow: hidden;
    border: 3px solid ${({ theme }) => theme.colors.accent};
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      border-color: ${({ theme }) => theme.colors.primaryDark};
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .member-name {
    font-size: 1.3rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.primaryDark};
    margin: 0 0 0.5rem 0;
  }

  .member-role {
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 500;
    margin: 0 0 1rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .member-description {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.6;
    margin: 0;
  }
`;
