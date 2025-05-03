import styled from 'styled-components';


export const LightButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.secondary};
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  font-size: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #0034EE;
    transform: translateY(-2px);

  }
`;

export const DarkButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color:   ${({ theme }) => theme.colors.background};
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
  font-size: 1em;
  font-weight: bold;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color:   ${({ theme }) => theme.colors.accent};
    color:   ${({ theme }) => theme.colors.background};
    transform: translateY(-2px);
  }
`;