import styled from "styled-components";

export const BlogContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 30px;
  background: #ffffff;
  color: ${({ theme }) => theme.colors.text};
  min-height: 100vh;
`;

export const SearchBarContainer = styled.div`
  width: 100%;
  max-width: 300px;
  margin-bottom: 20px;
`;

export const SearchInput = styled.input`
  width: 280px;
  padding: 10px 15px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  margin-left: 10px;
  margin-bottom: 20px;
  transition: border-color 0.2s ease;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #6b7280;
  }
`;

export const Gallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 28px;
  width: 100%;
  justify-content: start;
  justify-items: stretch;
  align-items: stretch;

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 1199px) and (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
`;

export const ScrollToTopButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: ${({ theme }) => theme.colors.accent};
  border: none;
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: background 0.3s;
  z-index: 1000;

  &:hover {
    background: ${({ theme }) => theme.colors.accentDark};
  }
`;

export const ArticleCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.6s ease,
    transform 0.6s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 6px;
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #d1d5db;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 12px;
    color: #1f2937;
    line-height: 1.3;
    flex-shrink: 0;

    @media (max-width: 768px) {
      font-size: 1.3rem;
    }
  }

  p {
    font-size: 0.95rem;
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 16px;
    flex-grow: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
  }

  a {
    display: inline-block;
    margin-top: auto;
    color: #6b7280;
    font-weight: 500;
    font-size: 0.9rem;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease, color 0.2s ease;
    flex-shrink: 0;
    width: fit-content;
    align-self: flex-start;

    &:hover {
      color: #374151;
      border-bottom-color: #374151;
    }
  }
`;
