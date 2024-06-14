import styled from 'styled-components';
import {ReactComponent as cyberSecurity} from '../../assets/images/cyberSecurity.svg';

export const Container = styled.div`
  padding: 20px;
  text-align: center;
`;

export const Title = styled.h1`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 40px;
  font-weight: 700;
  margin-top: 50px;
  text-align: center;
  span {
    font-weight: 400;
  }
`;
export const Title2 = styled.h2`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 2em;
  font-weight: 400;
  margin-bottom: 50px;
  margin-top: 10px;
  text-align: center;

  span {
    font-weight: 700;
  }
`;

export const Image = styled(cyberSecurity)`
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  margin-bottom: 20px;
  margin-top: 100px;
`;

export const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
`;