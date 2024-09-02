import styled from 'styled-components';

export const ContainerRow = styled.div`
display: grid;
grid-template-columns: repeat(4, 1fr); 
gap: 40px;
padding: 20px;
margin: 0 auto;
max-width: 1200px;
justify-content: center;
align-items: center;
margin-top: 0px;

@media (max-width: 1240px) {
  grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 768px) {
  grid-template-columns: 1fr; 
  grid-gap: 20px;
  padding: 0 20px;
}
    `;
