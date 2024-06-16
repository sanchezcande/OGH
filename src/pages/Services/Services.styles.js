import styled from "styled-components";
import { ReactComponent as developer } from "../../assets/images/developer.svg";

export const Container = styled.div`
  display: grid;
  grid-template-columns: 50% 50%;
  align-items: center;
  margin-top: 70px;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    grid-gap: 20px;
    padding: 0 20px;
  }
`;

export const Developer = styled(developer)`
  width: 100%;
  height: 100%;
  @media (max-width: 768px) {
    flex: 1;
  }
`;
