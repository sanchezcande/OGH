import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 4px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 0.95rem;
    color: #64748b;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .quick-action-link {
    display: inline-block;
    margin-bottom: 0.75rem;
    color: #0ea5e9;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
  }
`;

const CloseButton = styled.button`
  background: #111111;
  color: white;
  border: 2px solid #111111;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-shadow: none;

  &:hover {
    background: #333333;
    border-color: #333333;
  }
  
  &:active {
    transform: translateY(0);
  }
`;

export { ModalOverlay, ModalContent, CloseButton };
