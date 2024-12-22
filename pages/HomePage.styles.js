import styled from 'styled-components';

export const Container = styled.div`
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Title = styled.h1`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 30px;
  font-weight: 600;
  text-align: center;
  span {
    font-weight: 400;
  }
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;
export const Title2 = styled.h2`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 20px;
  font-weight: 100;
  margin-bottom: 50px;
  margin-top: 10px;
  text-align: center;
  max-width: 1200px;

  span {
    font-weight: 600;
  }

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

export const ImageContainer = styled.div`
  width: auto;
  max-height: 500px;
  margin-bottom: 70px;
  margin-top: 0;

  @media (max-width: 768px) {
    img {
      width: 100%;
      height: auto
  }
`;

export const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
`;