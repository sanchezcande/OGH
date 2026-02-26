import React from "react";
import { useTranslation } from "react-i18next";
import { ModalOverlay, ModalContent, CloseButton } from "./SuccessModal.styles";

const SuccessModal = ({
  message,
  onClose,
  showQuickAction = false,
  quickActionText = "",
  quickActionHref = "",
}) => {
  const { t } = useTranslation();
  return (
    <ModalOverlay>
      <ModalContent>
        <h2>{t("modalSendTitle")}</h2>
        <p>{message}</p>
        {showQuickAction && quickActionHref && (
          <a
            href={quickActionHref}
            target="_blank"
            rel="noopener noreferrer"
            className="quick-action-link"
          >
            {quickActionText}
          </a>
        )}
        <CloseButton onClick={onClose}>{t("modalCloseButtonText")}</CloseButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SuccessModal;
