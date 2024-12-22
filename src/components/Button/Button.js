import styled from 'styled-components';


export const LightButton = styled.button`
  background-color: rgba(21, 62, 108, 0.34);
  color: ${({ theme }) => theme.colors.secondary};
  padding: 10px 20px;
  border: 2px solid #0034EE;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #0034EE;
  }
`;

export const DarkButton = styled.button`
  background-color:  #0034EE;
  color:   ${({ theme }) => theme.colors.secondary};
  padding: 10px 20px;
  border: 2px solid #0034EE;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1em;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: white;
    color:   ${({ theme }) => theme.colors.primary};
    border: 2px solid ${({ theme }) => theme.colors.primary};
  }
`;