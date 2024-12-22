import styled from "styled-components";

export const ContainerRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  padding: 20px;
  max-width: 1200px;
  justify-content: center;
  align-items: center;
  padding-bottom: 50px;
  margin-left: 1rem;
  margin-right: 1rem;

  @media (max-width: 1240px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    margin-top: 50px;
    grid-template-columns: 1fr;
    grid-gap: 20px;
    padding: 0 20px;
  }
`;
