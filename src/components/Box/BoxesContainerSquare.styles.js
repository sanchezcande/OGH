import styled from 'styled-components';

export const ContainerSquare = styled.div`
display: grid;
grid-template-columns: repeat(2, 1fr);
grid-template-rows: repeat(2, 1fr);
gap: 40px; 
padding: 20px;
margin: 0 auto;
max-width: 1200px;
justify-content: center;
align-items: center;
margin-top: 100px;
@media (max-width: 1110px) {
    grid-template-columns: 1fr; 
    grid-gap: 20px;
    padding: 0 20px;
  }
    `;