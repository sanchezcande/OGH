import styled from "styled-components";

export const ReviewsContainer = styled.section`
  width: 100%;
  max-width: 1200px;
  margin: 6rem auto;
  padding: 3rem 2rem;
  position: relative;
  background: ${({ theme }) => `linear-gradient(145deg, ${theme.colors.backgroundAlt}22, ${theme.colors.background})`};
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.accent}22;

  @media (max-width: 768px) {
    margin: 4rem auto;
    padding: 2rem 1rem;
  }
`;

export const ReviewsCarousel = styled.div`
  position: relative;
  margin-top: 3rem;
  padding: 0 4rem;
  width: 100%;
`;

export const ReviewsWrapper = styled.div`
  overflow: hidden;
  width: 100%;
`;

export const ReviewsTrack = styled.div`
  display: flex;
  transition: transform 0.5s ease;
  width: 100%;
  position: relative;
  left: 0;

  & > * {
    flex: 0 0 100%;
    width: 100%;
  }
`;

export const ReviewCard = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0 2rem;
  position: relative;
`;

export const ReviewText = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};
  font-style: italic;
  text-align: justify;
  margin: 0 auto;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
  white-space: normal;
  width: 100%;
  max-width: 800px;
  display: block;

  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.5;
    max-width: 90%;
  }
`;

export const ReviewAuthor = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.accent}22;
  width: 100%;
  max-width: 800px;
  text-align: center;
`;

export const CompanyName = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.1rem;
`;

export const AuthorRole = styled.span`
  color: ${({ theme }) => theme.colors.accent};
  font-size: 0.9rem;
`;

export const CarouselButton = styled.button`
  position: absolute;
  top: 20%;
  transform: translateY(-50%);
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.background};
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s ease;
  font-size: 1.5rem;
  font-weight: bold;

  &:hover {
    background: ${({ theme }) => theme.colors.accentDark};
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: ${({ theme }) => theme.colors.backgroundAlt};
  }

  &.prev {
    left: 20px;
  }

  &.next {
    right: 20px;
  }
`; 