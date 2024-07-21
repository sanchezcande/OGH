import React from "react";
import { useTranslation } from "react-i18next";
import { ModalOverlay, ModalContent, CloseButton } from "./SuccessModal.styles";

const SuccessModal = ({ message, onClose }) => {
  const { t } = useTranslation();
  return (
    <ModalOverlay>
      <ModalContent>
        <h2>{t("modalSendTitle")}</h2>
        <p>{message}</p>
        <CloseButton onClick={onClose}>{t("modalCloseButtonText")}</CloseButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SuccessModal;
