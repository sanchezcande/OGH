import styled, { keyframes } from "styled-components";

/* ===================================================================
   ABOUT US PAGE — Premium editorial design matching service pages
   =================================================================== */

export const PageWrapper = styled.div`
  overflow-x: hidden;
  background: #fff;
`;

/* ---------- PAGE HEADER ---------- */
export const PageHeader = styled.section`
  max-width: 800px;
  margin: 0 auto;
  padding: 8rem 2rem 4rem;
  text-align: center;
`;

export const PageTitle = styled.h1`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(2.2rem, 4.5vw, 3.2rem);
  font-weight: 700;
  color: #111;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0 0 1.25rem;
  opacity: 0;
`;

export const PageSubtitle = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(0.95rem, 1.8vw, 1.15rem);
  color: #777;
  line-height: 1.65;
  max-width: 580px;
  margin: 0 auto;
  opacity: 0;
`;

/* ---------- TEXT REVEAL (pinned scroll) ---------- */
export const TextRevealSection = styled.section`
  position: relative;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 0 2rem;

  @media (max-width: 768px) {
    height: 70vh;
  }
`;

export const TextRevealInner = styled.div`
  max-width: 900px;
  width: 100%;
`;

export const RevealText = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1.1rem, 2.2vw, 1.6rem);
  font-weight: 500;
  line-height: 1.65;
  color: #111;
  letter-spacing: -0.005em;
  margin: 0;
`;

export const RevealWord = styled.span`
  opacity: 0.12;
  transition: opacity 0.1s;
  display: inline-block;
  margin-right: 0.3em;
`;

/* ---------- FOUNDER STRIP ---------- */
export const FounderStrip = styled.section`
  background: #111;
  padding: 5rem 2rem;
  margin: 0;

  .founder-inner {
    max-width: 900px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: 2.5rem;
    align-items: start;
  }

  .founder-accent-line {
    width: 1px;
    height: 0;
    background: linear-gradient(to bottom, #CC5A50, rgba(204, 90, 80, 0.1));
    justify-self: center;
    margin-top: 0.3rem;
  }

  .founder-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .founder-eyebrow {
    font-family: "Space Grotesk", sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #CC5A50;
  }

  .founder-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2.5rem;

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }
  }

  .founder-quote {
    font-family: "Space Grotesk", sans-serif;
    font-size: clamp(0.88rem, 1.3vw, 0.95rem);
    line-height: 1.85;
    color: rgba(255, 255, 255, 0.65);
    margin: 0;
    font-style: normal;
  }

  .founder-credit {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .founder-avatar {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
    }
  }

  .founder-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .founder-name {
    font-family: "Space Grotesk", sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  .founder-role {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
    letter-spacing: 0.05em;
  }

  @media (max-width: 600px) {
    padding: 3.5rem 1.5rem;

    .founder-inner {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .founder-accent-line {
      display: none;
    }
  }
`;

/* ---------- SECTION LABEL (reusable eyebrow) ---------- */
export const SectionLabel = styled.span`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #CC5A50;
  display: block;
  margin-bottom: 1rem;
`;

/* ---------- HIGHLIGHTED WORD ---------- */
const highlightAnimation = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

export const HighlightedWord = styled.span.attrs(() => ({
  className: "highlighted-class-placeholder",
}))`
  display: inline-block;
  position: relative;
  color: #fff;
  font-weight: 700;
  padding: 0.05em 0.25em;
  z-index: 1;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: #111111;
    transform-origin: left;
    z-index: -1;
    border-radius: 4px;
    transform: scaleX(0);
  }

  &.animate::before {
    animation: ${highlightAnimation} 0.5s ease-out 0.3s forwards;
  }
`;

/* ---------- TEAM SECTION ---------- */
export const TeamSection = styled.section`
  width: 100%;
  max-width: 1200px;
  margin: 5rem auto;
  padding: 0 2rem;

  .team-title {
    text-align: center;
    font-family: "Space Grotesk", sans-serif;
    font-size: clamp(1.8rem, 3vw, 2.5rem);
    color: #111;
    margin-bottom: 0.75rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    opacity: 0;
  }

  .team-subtitle {
    text-align: center;
    font-size: 1rem;
    color: #777;
    margin-bottom: 3.5rem;
    max-width: 550px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.6;
    opacity: 0;

    @media (max-width: 768px) {
      margin-bottom: 2.5rem;
    }
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;

    @media (max-width: 960px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 700px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 450px) {
      grid-template-columns: 1fr;
      max-width: 280px;
      margin: 0 auto;
    }
  }
`;

export const TeamMemberCard = styled.div`
  position: relative;
  overflow: hidden;
  opacity: 0;
  will-change: transform, opacity;

  &:hover {
    .member-image::after {
      opacity: 1;
    }

    .member-image img {
      transform: scale(1.05);
    }

    .member-overlay {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .member-image {
    width: 100%;
    aspect-ratio: 3 / 4;
    overflow: hidden;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.7) 0%,
        rgba(0, 0, 0, 0.15) 40%,
        transparent 100%
      );
      z-index: 1;
      transition: opacity 0.4s ease;
      opacity: 0.85;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 15%;
      transition: transform 0.6s ease;
      will-change: transform, filter;
    }
  }

  .member-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem 1.15rem;
    z-index: 2;
  }

  .member-name {
    font-family: "Space Grotesk", sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 3px 0;
    padding: 0;
  }

  .member-role {
    font-size: 0.6rem;
    color: #CC5A50;
    font-weight: 600;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0;
  }

  .card-line {
    display: none;
  }

  .member-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(17, 17, 17, 0.92) 0%,
      rgba(17, 17, 17, 0.75) 60%,
      rgba(17, 17, 17, 0.4) 100%
    );
    z-index: 3;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 1.5rem;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.35s ease, transform 0.35s ease;
  }

  .member-description {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.6;
    margin: 0 0 0.75rem 0;
    padding: 0;
  }

  .overlay-name {
    font-family: "Space Grotesk", sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 2px 0;
  }

  .overlay-role {
    font-size: 0.6rem;
    color: #CC5A50;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0;
  }
`;
