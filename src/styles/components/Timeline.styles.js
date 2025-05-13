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
  display: inline-flex; // Use inline-flex to wrap content snugly
  align-items: center;
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px; // Space below the header
  position: relative; // Needed for absolute positioning of the connecting line if desired
  z-index: 4; // Above the line and dots
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  // Small dot inside the header box
  &::before {
    content: '';
    display: inline-block;
    width: 10px;
    height: 10px;
    background-color: ${({ theme }) => theme.colors.accent}; // Accent color dot
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
  width: 1px; // Made the line thinner (e.g., 2px)
  // background-color: ${({ theme }) => theme.colors.accent}; // Remove solid background color
  background-image: linear-gradient(
    to bottom, 
    grey 70%, // Color of the dash
    transparent 30% // Space between dashes
  );
  background-size: 100% 10px; // Controls dash length and gap (e.g., 7px dash, 3px gap)
  background-color: transparent; // Explicitly set background to transparent for gradient

  transform: translateX(-50%) scaleY(0); 
  transform-origin: top; 
  transition: transform 3.5s ease-out; 
  z-index: 1;

  &.visible {
      transform: translateX(-50%) scaleY(1); 
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
  width: 100%; // Take full width to manage internal spacing
  max-width: 900px; // Max width for the whole item row
  margin-bottom: 30px; // Reduced vertical spacing
  z-index: 2;
  display: flex; // Use flex for side-by-side content
  justify-content: space-between; // Push content to sides
  align-items: flex-start; // Align items at the top
  opacity: 0; 
  transform: translateY(50px); 
  transition: opacity 0.6s ease-out, transform 0.6s ease-out; 
  transition-delay: 0.2s; 
  padding: 0 20px; // Add some padding from the edges

  // Calculate space needed for line and gap between content and line
  --gap-from-line: 40px; 

  &.visible {
      opacity: 1; 
      transform: translateY(0); 

      h3::after {
           animation: ${drawLine} 0.6s ease-out forwards;
           animation-delay: 0.3s; 
      }
      
      ${TimelineDot} { 
          opacity: 1; // Make dot fully visible when parent becomes visible
          animation: ${pulseDot} 2s infinite 0.6s; // Begin pulse animation after dot appears
      }
  }

  // Left side item (Image Left, Text Right)
  &.left {
    justify-content: flex-start; // Align content to the start
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
     justify-content: flex-end; // Align content to the end
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
    flex-direction: column; // Stack items vertically
    align-items: center; // Center items horizontally
    width: 85%; 
    margin-left: auto; 
    margin-right: auto;
    padding: 0;
    margin-bottom: 40px;

    &.left, &.right {
        justify-content: center; // Center content when stacked
        .text-content,
        .image-content {
             width: 100%; // Full width on mobile
             max-width: 400px; // Limit content width on mobile
             margin: 0 0 15px 0 !important; // Remove horizontal margins, add bottom margin
             text-align: center !important; // Center text
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
        transform: translateX(-50%) scaleX(1) !important; // Only change the scaleX part
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