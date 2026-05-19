import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

export const BlogContainer = styled.div`
  background: #fff;
  min-height: 100vh;
  max-width: 1100px;
  margin: 0 auto;
  padding: 110px 40px 100px;

  @media (max-width: 768px) {
    padding: 90px 20px 60px;
  }
`;

export const BlogHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 56px;

  h1 {
    font-family: "Space Grotesk", sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: #999;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin: 0;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 20px;
  }
`;

export const SearchInput = styled.input`
  width: 200px;
  padding: 6px 0;
  border: none;
  border-bottom: 1px solid #ddd;
  background: transparent;
  font-size: 0.82rem;
  color: #111;
  outline: none;
  transition: border-color 0.3s ease;

  &::placeholder {
    color: #ccc;
  }

  &:focus {
    border-color: #111;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

/* ---------- FEATURED (first article) ---------- */
export const FeaturedCard = styled.article`
  position: relative;
  width: 100%;
  aspect-ratio: 21 / 9;
  overflow: hidden;
  margin-bottom: 64px;
  cursor: pointer;
  will-change: transform;

  @media (max-width: 768px) {
    aspect-ratio: 16 / 10;
    margin-bottom: 48px;
  }

  .featured-img-wrapper {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 800px 100%;
    animation: ${shimmer} 1.5s infinite linear;

    &.loaded {
      animation: none;
      background: none;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: grayscale(1);
      transition: filter 0.6s ease, transform 0.6s ease;
    }
  }

  &:hover .featured-img-wrapper img {
    filter: grayscale(0);
    transform: scale(1.04);
  }

  .featured-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 48px 40px 36px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
    display: flex;
    flex-direction: column;
    gap: 8px;

    @media (max-width: 768px) {
      padding: 32px 24px 24px;
    }
  }

  .featured-tag {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
  }

  .featured-title {
    font-family: "Space Grotesk", sans-serif;
    font-size: clamp(1.4rem, 2.8vw, 2rem);
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
    line-height: 1.2;
    max-width: 600px;
    margin: 0;
  }

  .featured-summary {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
    max-width: 480px;
    margin: 0;

    @media (max-width: 768px) {
      display: none;
    }
  }
`;

/* ---------- GRID ---------- */
export const Gallery = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 48px 40px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

/* ---------- ARTICLE CARD ---------- */
export const ArticleCard = styled.article`
  display: flex;
  flex-direction: column;
  cursor: pointer;
  will-change: transform, opacity;

  .card-image-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    margin-bottom: 20px;
    background: linear-gradient(90deg, #f3f3f3 25%, #eaeaea 50%, #f3f3f3 75%);
    background-size: 800px 100%;
    animation: ${shimmer} 1.5s infinite linear;

    &.loaded {
      animation: none;
      background: #0a0a0a;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: grayscale(1);
      transition: filter 0.5s ease, transform 0.5s ease;
    }
  }

  &:hover .card-image-wrapper img {
    filter: grayscale(0);
    transform: scale(1.04);
  }

  h2 {
    font-family: "Space Grotesk", sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 8px;
    color: #111;
    line-height: 1.35;
    letter-spacing: -0.01em;
    transition: color 0.3s ease;
  }

  &:hover h2 {
    color: #CC5A50;
  }

  p {
    font-size: 0.85rem;
    color: #999;
    line-height: 1.6;
    margin: 0 0 12px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .read-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #bbb;
    font-weight: 500;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    transition: gap 0.3s ease, color 0.3s ease;

    &::after {
      content: "\\2192";
      transition: transform 0.3s ease;
    }
  }

  &:hover .read-link {
    gap: 10px;
    color: #111;

    &::after {
      transform: translateX(2px);
    }
  }
`;

/* keep exports for backwards compat */
export const SearchBarContainer = styled.div``;
export const BlogHero = styled.div``;
