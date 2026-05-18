import styled from "styled-components";

export const TimelineWrapper = styled.section`
  width: 100%;
  max-width: 1200px;
  margin: 4rem auto;
  padding: 0 2rem;
`;

export const TimelineItem = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  min-height: 500px;
  margin-bottom: 2px;
  position: relative;

  &:nth-child(even) {
    direction: rtl;
    > * {
      direction: ltr;
    }
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    min-height: auto;

    &:nth-child(even) {
      direction: ltr;
    }
  }
`;

export const TimelineImageSide = styled.div`
  position: relative;
  overflow: hidden;
  min-height: 500px;
  will-change: clip-path;

  img {
    width: 100%;
    height: 130%;
    object-fit: cover;
    position: absolute;
    top: -15%;
    left: 0;
    filter: grayscale(100%) contrast(1.2) brightness(0.85);
    will-change: transform, filter;
    transform: scale(1.15);
  }

  /* Dark vignette overlay */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(0, 0, 0, 0.45) 0%,
      rgba(0, 0, 0, 0.05) 50%,
      rgba(0, 0, 0, 0.35) 100%
    );
    z-index: 1;
    pointer-events: none;
  }

  /* Bottom gradient for number */
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.55), transparent);
    z-index: 1;
    pointer-events: none;
  }

  .item-number {
    position: absolute;
    bottom: -15px;
    right: 20px;
    font-family: "Space Grotesk", sans-serif;
    font-size: 9rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.07);
    line-height: 1;
    user-select: none;
    z-index: 2;
    pointer-events: none;
  }

  /* Accent corner mark */
  .corner-mark {
    position: absolute;
    top: 24px;
    left: 24px;
    z-index: 2;
    width: 30px;
    height: 30px;
    border-top: 2px solid rgba(204, 90, 80, 0.6);
    border-left: 2px solid rgba(204, 90, 80, 0.6);
    pointer-events: none;
    opacity: 0;
  }

  @media (max-width: 768px) {
    min-height: 300px;

    .item-number {
      font-size: 6rem;
      right: 12px;
    }
  }
`;

export const TimelineTextSide = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3.5rem 4rem;
  position: relative;
  background: #fafafa;
  will-change: clip-path, opacity;

  .item-label {
    font-family: "Space Grotesk", sans-serif;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #CC5A50;
    margin-bottom: 1.25rem;
    opacity: 0;
  }

  h3 {
    font-family: "Space Grotesk", sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: #111111;
    line-height: 1.2;
    margin: 0 0 1.25rem 0;
    letter-spacing: -0.01em;
    opacity: 0;

    *:not([class*="highlighted"]) {
      color: #111111;
    }
  }

  .item-line {
    width: 40px;
    height: 2px;
    background: #CC5A50;
    margin-bottom: 1.5rem;
    transform-origin: left;
    transform: scaleX(0);
  }

  p {
    font-size: 0.92rem;
    line-height: 1.75;
    color: #555555;
    margin: 0;
    opacity: 0;
  }

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;

    h3 {
      font-size: 1.4rem;
    }

    p {
      font-size: 0.88rem;
    }
  }
`;
