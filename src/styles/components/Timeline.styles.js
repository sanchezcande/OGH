import styled, { keyframes } from 'styled-components';

// Optional: Define keyframes if more complex animation is needed
const fadeInSlideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Simplified pulse animation that ONLY affects box-shadow, like the home CTA
const pulseDot = keyframes`
  0% { 
    box-shadow: 0 0 0 0 ${({ theme }) => theme.colors.accent}66; 
  }
  70% {
    box-shadow: 0 0 0 10px ${({ theme }) => theme.colors.accent}00;
  }
  100% {
    box-shadow: 0 0 0 0 ${({ theme }) => theme.colors.accent}00;
  }
`;

// Keyframe for the title underline drawing effect
const drawLine = keyframes`
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
`;

// New component for the header box
export const TimelineHeader = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  position: relative;
  z-index: 4;
  opacity: 0;
  transform: translateY(-20px);

  /* Cambiamos a usar animación en lugar de transición */
  &.visible {
    animation: fadeDown 0.6s ease-out forwards;
  }
  
  /* Definimos keyframes específicos */
  @keyframes fadeDown {
    0% {
      opacity: 0;
      transform: translateY(-20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // Small dot inside the header box
  &::before {
    content: '';
    display: inline-block;
    width: 10px;
    height: 10px;
    background-color: ${({ theme }) => theme.colors.accent};
    border-radius: 50%;
    margin-right: 10px;
  }

  span {
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const TimelineContainer = styled.div`
  position: relative;
  width: 90%;
  max-width: 1000px;
  margin: 50px auto;
  padding: 40px 0; // Keep vertical padding
  display: flex;
  flex-direction: column;
  align-items: center; 

  // Observe this container to show the header
  ${TimelineHeader} { // Target the header inside
     // Initially hidden, visibility handled by its own .visible class triggered by JS
  }
  
`;

export const TimelineLine = styled.div`
  position: absolute;
  left: 50%;
  top: 70px; 
  bottom: 0;
  width: 1px;
  background-image: linear-gradient(
    to bottom, 
    grey 70%,
    transparent 30%
  );
  background-size: 100% 10px;
  background-color: transparent;
  
  /* Cambiamos la forma en que se aplica la transformación para que sea más directa */
  transform: translateX(-50%) scaleY(0);
  transform-origin: top;
  z-index: 1;
  
  /* Usamos animación en lugar de transición para mayor control */
  &.visible {
    animation: growLine 3.5s ease-out forwards;
  }
  
  /* Definimos keyframes específicos para esta animación */
  @keyframes growLine {
    0% {
      transform: translateX(-50%) scaleY(0);
    }
    100% {
      transform: translateX(-50%) scaleY(1);
    }
  }
`;

// Adjusted dot styles for horizontal layout
export const TimelineDot = styled.div`
  position: absolute;
  top: 20px; 
  width: 14px; 
  height: 14px;
  background-color: ${({ theme }) => theme.colors.accent}; 
  border: 2px solid ${({ theme }) => theme.colors.background}; 
  border-radius: 50%;
  z-index: 3;
  left: 50%; 
  opacity: 0; // Start hidden and appear when parent becomes visible
  transform: translateX(-50%); // Keep horizontally centered but let parent handle visibility
  transition: opacity 0.4s ease-out; // Only transition for opacity

  @media (max-width: 768px) {
      top: -15px; 
  }
`;

export const TimelineItem = styled.div`
  position: relative;
  width: 100%;
  max-width: 900px;
  margin-bottom: 30px;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  opacity: 0;
  transform: translateY(50px);
  padding: 0 20px;

  /* Cambiamos a usar animación en lugar de transición */
  --gap-from-line: 40px;

  &.visible {
    animation: fadeInUp 0.6s ease-out forwards;
    
    h3::after {
      animation: ${drawLine} 0.6s ease-out forwards;
      animation-delay: 0.3s;
    }
    
    ${TimelineDot} {
      opacity: 1;
      animation: ${pulseDot} 2s infinite 0.6s;
    }
  }
  
  /* Definimos keyframes específicos */
  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(50px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // Left side item (Image Left, Text Right)
  &.left {
    justify-content: flex-start;
    .image-content {
      width: calc(50% - var(--gap-from-line));
      margin-right: var(--gap-from-line);
    }
    .text-content {
      width: calc(50% - var(--gap-from-line));
      margin-left: var(--gap-from-line);
      text-align: left;
      h3::after {
        left: 0;
        transform-origin: left;
      }
    }
  }

  // Right side item (Text Left, Image Right)
  &.right {
    justify-content: flex-end;
    .text-content {
      width: calc(50% - var(--gap-from-line));
      margin-right: var(--gap-from-line);
      text-align: right;
      h3::after {
        right: 0;
        transform-origin: right;
      }
    }
    .image-content {
      width: calc(50% - var(--gap-from-line));
      margin-left: var(--gap-from-line);
    }
  }

  &:last-child {
    margin-bottom: 0;
  }
  
  // Responsive adjustments for stacked layout
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    width: 85%;
    margin-left: auto;
    margin-right: auto;
    padding: 0;
    margin-bottom: 40px;

    &.left, &.right {
      justify-content: center;
      .text-content,
      .image-content {
        width: 100%;
        max-width: 400px;
        margin: 0 0 15px 0 !important;
        text-align: center !important;
      }
      .text-content {
        order: 1;
      }
      .image-content {
        order: 2;
      }
    }

    &.visible {
      h3::after {
        transform: translateX(-50%) scaleX(1) !important;
      }
    }
  }
`;

export const TimelineContent = styled.div`
  // No specific width needed here anymore, handled by parent flex item 
  background-color: ${({ theme }) => theme.colors.backgroundAlt}; 
  padding: 15px 20px; // Adjusted padding
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  
  h3 {
    margin-top: 0;
    margin-bottom: 10px; // Reduced margin
    color: ${({ theme }) => theme.colors.text}; // Ensure main text color
    font-size: 1.3rem; // Slightly smaller title
    position: relative; 
    padding-bottom: 6px; // Adjusted space

    // Ensure ALL text within the h3 has the same color
    * {
      color: ${({ theme }) => theme.colors.text} !important; // Force same color for all child elements
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      height: 2px; // Thinner underline
      width: 70%; // Make underline cover full width
      max-width: 90%; // Allow it to be as wide as the title
      background-color: ${({ theme }) => theme.colors.accent}; 
      transform: scaleX(0); 
    }
  }

  p {
    margin: 0;
    font-size: 0.9rem; // Slightly smaller text
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.textAlt};
  }
  
  @media (max-width: 768px) {
      padding: 15px;
      h3 { 
          font-size: 1.2rem;
          position: relative; // Ensure position is set
          
          &::after {
              position: absolute; // Ensure position is absolutely controlled
              left: 50% !important; // Center point
              right: auto !important; // Remove right positioning
              transform: translateX(-50%) scaleX(0) !important; // Center the element and initialize animation state
              transform-origin: center !important; // Scale from center
              width: 80px !important; // Fixed width in pixels for more predictable centering
              max-width: 70% !important; // Limit maximum width as % of parent
          }
      }
      p { font-size: 0.9rem; }
  }
`;

export const TimelineImageContainer = styled.div`
  // No specific width needed here anymore, handled by parent flex item 
  // max-width: 350px; // Remove max-width, let parent control
  // margin-left: auto; // Remove margin auto
  // margin-right: auto;
  border-radius: 8px;
  overflow: hidden; 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  align-self: center; // Vertically center image within its space if needed

  img {
    display: block;
    width: 100%;
    height: auto; 
  }
  
  // @media (max-width: 768px) { // Mobile width handled in TimelineItem styles
  //      max-width: 90%; 
  //  }
`;