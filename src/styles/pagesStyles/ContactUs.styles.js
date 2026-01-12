import styled, { keyframes } from "styled-components";

// Keep existing animations if any, or define new ones if needed
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Keyframe for the title underline drawing effect (reused or adapted)
const drawLine = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

// Define child components first that are referenced by parents

export const HighlightedText = styled.span`
  display: inline-block;
  color: white; // Text always white
  padding: 0.2em 0.4em;
  border-radius: 4px;
  white-space: nowrap;
  position: relative; // For positioning the pseudo-element

  // The text itself should be visible from the start
  // But we need a pseudo-element for the background

  // This creates the pink background that will be animated
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${({ theme }) => theme.colors.accent || "#FF6B6B"};
    border-radius: 4px;
    transform: scaleX(0); // Initially scaled to 0 width
    transform-origin: left; // Will grow from left
    z-index: -1; // Behind the text
  }
`;

export const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.sectionTitle.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  line-height: ${({ theme }) => theme.lineHeights.tight};
  margin-bottom: 0.5rem; // Small margin below title
  position: relative;

  &.form-title {
    text-align: left; // Align form title to left as in image
    margin-bottom: 1.5rem; // Space above form
    font-size: ${({ theme }) => theme.fontSizes.sectionTitle.desktop};
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sectionTitle.mobile};
    &.form-title {
      text-align: center;
      font-size: ${({ theme }) => theme.fontSizes.sectionTitle.mobile};
    }
  }

  // When Title becomes visible, we'll handle the animation in parent containers
`;

export const SubTitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.body.desktop};
  color: ${({ theme }) => theme.colors.textMuted || "#555"};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.body.mobile};
  }
`;

export const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  opacity: 0; // For cascade animation
  // animation: ${fadeInUp} 0.5s ease-out forwards; // This will be set by ContactInfo

  div {
    display: flex;
    flex-direction: column;
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.small.desktop};
    color: ${({ theme }) => theme.colors.textMuted || "#666"};
    margin-bottom: 0.25rem;

    @media (max-width: 768px) {
      font-size: ${({ theme }) => theme.fontSizes.small.mobile};
    }
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.sectionSubtitle.desktop};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.text};
    margin: 0;

    @media (max-width: 768px) {
      font-size: ${({ theme }) => theme.fontSizes.sectionSubtitle.mobile};
    }
  }
`;

export const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  ${ContactItem} {
    animation: ${fadeInUp} 0.5s ease-out forwards;
  }
  ${ContactItem}:nth-child(1) {
    animation-delay: 0.2s;
  }
  ${ContactItem}:nth-child(2) {
    animation-delay: 0.4s;
  }
  // ${ContactItem}:nth-child(3) { animation-delay: 0.6s; } // For Map Street if it existed
`;

// Now define LeftColumn and RightColumn that use the above components
export const LeftColumn = styled.div`
  flex: 1;
  background-color: #fff0f0; // Light pink background from image
  padding: 2.5rem;
  border-radius: ${({ theme }) => theme.borderRadius || "12px"};
  display: flex;
  flex-direction: column;
  gap: 1.5rem; // Spacing between elements in left column

  ${Title}, ${SubTitle}, ${ContactInfo} {
    opacity: 0;
    animation: ${fadeInUp} 0.6s ease-out forwards;
  }
  ${Title} {
    animation-delay: 0.3s;
  }
  ${SubTitle} {
    animation-delay: 0.5s;
  }
  ${ContactInfo} {
    animation-delay: 0.7s;
  }

  // Single animation for highlighted text background
  &.visible ${HighlightedText}::before {
    animation: ${drawLine} 0.7s ease-out 0.8s forwards;
  }

  @media (max-width: 992px) {
    width: 100%;
    max-width: 600px; // Limit width on smaller screens when stacked
    padding: 2rem;
  }
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

export const RightColumn = styled.div`
  flex: 1.2; // Give slightly more space to the form column if needed
  display: flex;
  flex-direction: column;
  padding: 1rem; // Some padding for the right column

  // Targeting the form directly to adjust its styles as requested
  .contact-form {
    background-color: transparent !important; // Ensure form background is transparent
    padding: 0 !important; // Remove padding if any from form itself
    box-shadow: none !important; // Remove shadow if any
    border: none !important; // Ensure no border
    max-width: 100%; // Allow form to take full width of column

    input,
    textarea {
      background-color: ${({ theme }) =>
        theme.colors.greyLight ||
        "#f0f0f0"} !important; // Grey background for inputs
      border: none !important; // No border for inputs
      color: ${({ theme }) => theme.colors.text} !important;
      &::placeholder {
        color: ${({ theme }) => theme.colors.textMuted || "#888"} !important;
      }
    }

    // Style for the send button to match captcha width
    button[type="submit"] {
      // Half width as requested
      background-color: ${({ theme }) =>
        theme.colors.accent || "#FF6B6B"} !important; // Use accent color (pink)
      color: white !important;
      margin-top: 15px;
      font-weight: bold;
      transition: all 0.3s ease;

      &:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
    }
  }

  // Add cascade animation to children of RightColumn
  ${Title}.form-title {
    opacity: 0;
    animation: ${fadeInUp} 0.6s ease-out forwards;
    animation-delay: 0.3s;
  }

  // Single animation for highlighted text in form title
  &.visible ${Title}.form-title ${HighlightedText}::before {
    animation: ${drawLine} 0.7s ease-out 1s forwards;
  }

  @media (max-width: 992px) {
    width: 100%;
    max-width: 600px; // Limit width on smaller screens when stacked
    padding: 1rem 0;
  }
`;

// MainWrapper can now be defined as it uses LeftColumn and RightColumn
export const MainWrapper = styled.div`
  display: flex;
  width: 100%;
  max-width: 1200px; // Max width for the content area
  gap: 2rem; // Gap between left and right columns
  // animation: ${fadeInUp} 0.7s ease-out; // Let children handle their own main animation

  // Add initial hidden states for children if we want to cascade them
  & > * {
    // Target direct children (LeftColumn, RightColumn)
    opacity: 0; // Start hidden if not already handled by fadeInUp on MainWrapper
    animation: ${fadeInUp} 0.7s ease-out forwards;
  }

  // Add staggered delays to children
  ${LeftColumn} {
    animation-delay: 0.2s;
  }
  ${RightColumn} {
    animation-delay: 0.4s;
  }

  @media (max-width: 992px) {
    // Breakpoint for stacking columns
    flex-direction: column;
    align-items: center;
  }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem 1rem; // Add overall padding
  align-items: center; // Center MainWrapper if it has a max-width
  min-height: 80vh; // Ensure it takes up considerable height

  @media (max-width: 768px) {
    // margin-bottom:100px; // This might be too much if MainWrapper also has children animating
  }
`;

export const IconWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.accent || "#FF6B6B"};
  color: white;
  padding: 0.8rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;
