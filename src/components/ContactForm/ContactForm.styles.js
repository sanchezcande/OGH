import styled, { keyframes } from "styled-components";
import { DarkButton } from "../Button/Button";

export const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  max-width: 500px;
  margin: auto;
  animation: fadeInUp 0.6s ease-out;
`;
const bounceIn = keyframes`
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
`;

const bounceOut = keyframes`
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
  100% {
    transform: translateY(0);
  }
`;

export const Input = styled.input`
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  border: 1px;
  transition: all 0.3s;
  background-color: #f0f0f0;

  &::placeholder {
    color: #999;
    font-style: italic;
  }

  &:focus {
    box-shadow: 0 0 8px rgba(249, 123, 114, 0.5);
    outline: none;
  }
  &:hover {
    box-shadow: 0 0 8px rgba(249, 123, 114, 0.5);
  }

  &[type="number"] {
    -moz-appearance: textfield; /* Firefox */
    appearance: textfield; /* Safari e IE */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      display: none; /* WebKit */
    }
  }

  &.error.touched {
    animation: ${bounceIn} 0.5s ease forwards;
  }

  &.valid.touched {
    animation: ${bounceOut} 0.5s ease forwards;
  }
`;

export const TextArea = styled.textarea`
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  transition: all 0.3s;
  border: 1px;
  background-color: #f0f0f0;

  &::placeholder {
    color: #999;
    font-style: italic;
  }

  &:focus {
    box-shadow: 0 0 8px rgba(249, 123, 114, 0.5);
    outline: none;
  }
  &:hover {
    box-shadow: 0 0 8px rgba(249, 123, 114, 0.5);
  }

  &.error.touched {
    animation: ${bounceIn} 0.5s ease forwards;
  }

  &.valid.touched {
    animation: ${bounceOut} 0.5s ease forwards;
  }
`;

export const Error = styled.div`
  color:   ${({ theme }) => theme.colors.accentDark};;
  margin-bottom: 10px;
  font-size: 10px;
  margin-left: 10px;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;

  &.visible {
    opacity: 1;
    max-height: 100px;
    animation: slideInFromLeft 0.3s forwards;
  }

  &.hidden {
    opacity: 0;
    max-height: 0;
    animation: fadeInUp 0.3s forwards;
  }
`;

export const StyledButton = styled(DarkButton)`
margin-top: 10px;
  display: inline-block;

    &.error {
      animation: none;

  }

  &.valid {
    animation: none;

  }

`;
