import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 50px;
    margin-left: 1rem;
    margin-right: 1rem;


    @media (max-width: 768px) {
        margin-bottom:100px;
      }

    h1 {
        text-align: center;
        font-size: 40px;
        font-weight: 700;
        margin-bottom: 10px;

        @media (max-width: 768px) {
            font-size: 30px;
          }
    }
    
    h2 {
        text-align: center;
        font-size: 30;
        margin-bottom: 20px;
        color: #828282;
        font-weight: 400;
        margin-bottom: 40px;

        @media (max-width: 768px) {
            font-size: 20px;
          }
    }

    `;