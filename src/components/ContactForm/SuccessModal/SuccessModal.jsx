import React from 'react';
import { ModalOverlay, ModalContent, CloseButton } from './SuccessModal.styles';

const SuccessModal = ({ message, onClose }) => (
  <ModalOverlay>
    <ModalContent>
      <h2>Send!</h2>
      <p>{message}</p>
      <CloseButton onClick={onClose}>Cerrar</CloseButton>
    </ModalContent>
  </ModalOverlay>
);

export default SuccessModal;
