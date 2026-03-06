import styled from "styled-components";
import Link from "next/link";

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

export const ControlsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
`;

export const SearchAndSort = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
`;

export const SearchInput = styled.input`
  width: 280px;
  padding: 10px 15px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  font-size: ${({ theme }) => theme.fontSizes.body.desktop};
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  transition: border-color 0.2s ease;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.body.mobile};
    width: 100%;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #6b7280;
  }
`;

export const SortSelect = styled.select`
  padding: 10px 15px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  font-size: ${({ theme }) => theme.fontSizes.body.desktop};
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ease;

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
    font-size: ${({ theme }) => theme.fontSizes.cardTitle.desktop};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    margin-bottom: 12px;
    color: #1f2937;
    line-height: ${({ theme }) => theme.lineHeights.tight};
    flex-shrink: 0;

    @media (max-width: 768px) {
      font-size: ${({ theme }) => theme.fontSizes.cardTitle.mobile};
    }
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.cardText.desktop};
    color: #6b7280;
    line-height: ${({ theme }) => theme.lineHeights.normal};
    margin-bottom: 16px;
    flex-grow: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;

    @media (max-width: 768px) {
      font-size: ${({ theme }) => theme.fontSizes.cardText.mobile};
    }
  }

  a {
    display: inline-block;
    margin-top: auto;
    color: #6b7280;
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    font-size: ${({ theme }) => theme.fontSizes.small.desktop};
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease, color 0.2s ease;
    flex-shrink: 0;
    width: fit-content;
    align-self: flex-start;

    @media (max-width: 768px) {
      font-size: ${({ theme }) => theme.fontSizes.small.mobile};
    }

    &:hover {
      color: #374151;
      border-bottom-color: #374151;
    }
  }
`;

export const CardActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  width: 100%;
`;

export const EditLink = styled(Link)`
  color: #0070f3;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export const LoadMoreButton = styled.button`
  margin: 40px auto;
  padding: 12px 30px;
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: block;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
