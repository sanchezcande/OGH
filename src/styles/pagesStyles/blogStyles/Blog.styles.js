import styled from "styled-components";

export const BlogContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 30px;
  background: linear-gradient(145deg, ${({ theme }) => theme.colors.background}, ${({ theme }) => theme.colors.backgroundAlt});
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
  border: none;
  border-bottom: 2px solid ${({ theme }) => theme.colors.primaryDark};
  background: transparent;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  margin-left: 10px;
  margin-bottom: 20px;
  transition: border-color 0.3s;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text};
    opacity: 0.7;
  }

  &:focus {
    border-bottom-color: ${({ theme }) => theme.colors.accent};
  }
`;

export const Gallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  width: 100%;
  justify-content: start;
  justify-items: stretch;
  align-items: start;

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
  background: ${({ theme }) => `linear-gradient(145deg, ${theme.colors.backgroundAlt}, ${theme.colors.background})`};
  border: 2px solid ${({ theme }) => theme.colors.primaryDark};
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  width: 100%;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 12px;
    margin-bottom: 12px;
  }

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 12px 24px ${({ theme }) => theme.colors.primaryDark}CC;
    border-color: ${({ theme }) => theme.colors.primaryDark};
  }

  h2 {
    font-size: 1.6rem;
    margin-bottom: 12px;
    color: ${({ theme }) => theme.colors.text};

    @media (max-width: 768px) {
      font-size: 1.4rem;
    }
  }

  p {
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.text};
    line-height: 1.5;
  }

  a {
    display: inline-block;
    margin-top: 15px;
    color: ${({ theme }) => theme.colors.accent};
    font-weight: bold;
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.accentDark};
    }
  }
`;