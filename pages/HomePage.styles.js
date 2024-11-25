import styled from 'styled-components';

export const Container = styled.div`
  padding: 20px;
  text-align: center;
`;

export const Title = styled.h1`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 40px;
  font-weight: 600;
  margin-top: 50px;
  text-align: center;
  span {
    font-weight: 400;
  }
  @media (max-width: 768px) {
    font-size: 30px;
  }
`;
export const Title2 = styled.h2`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 2em;
  font-weight: 100;
  margin-bottom: 50px;
  margin-top: 10px;
  text-align: center;

  span {
    font-weight: 600;
  }

  @media (max-width: 768px) {
    font-size: 1.5em;
  }
`;

export const ImageContainer = styled.div`
  width: auto;
  max-height: 500px;
  margin-bottom: 20px;
  margin-top: 0;

  @media (max-width: 768px) {
    max-height: 200px;
  }
`;

export const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
`;