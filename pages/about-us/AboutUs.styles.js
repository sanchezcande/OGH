import styled from 'styled-components';

export const Container = styled.div`
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
@media (max-width: 768px) {
  margin-top: 200px;
  
}
`;

export const Developer = styled.img`
width: 100%;
height: auto;
`;

export const ImageText = styled.div`
display: grid;
grid-template-columns: 50% 50%;
align-items: center;
color: white;
padding-right: 20px;

h1 {

    font-size: 34px;
    font-weight: 600;
}

span {
    font-size:12px;
    font-weight: 400;
      display: block;
      margin-top: 20px;
      line-height: 1.5;
}
@media (max-width: 768px) {
    grid-template-columns: 1fr; 
    grid-gap: 20px;
    padding: 0 20px;
    text-align: center;

    span {

    }
  }
`;
