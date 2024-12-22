import styled, { keyframes } from "styled-components";
import { DarkButton } from "../Button/Button";

export const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  max-width: 500px;
  margin: auto;
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
  border: 1px solid #ccc;
  border-radius: 5px;
  border: 3px solid #333;
  transition: all 0.3s;
  background-color: #f0f0f0;

  &::placeholder {
    color: #999;
    font-style: italic;
  }

  &:focus {
    border-color: #0034ee;
    outline: none;
  }
  &:hover {
    border-color: #0034ee;
  }

  &[type="number"] {
    -moz-appearance: textfield; /* Firefox */
    appearance: textfield; /* Safari e IE */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      display: none; /* WebKit */
    }
  }
  &.error {
    animation: ${bounceIn} 0.5s ease forwards;
  }

  &.valid {
    animation: ${bounceOut} 0.5s ease forwards;
  }
`;

export const TextArea = styled.textarea`
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  border: 3px solid #333;
  transition: all 0.3s;
  background-color: #f0f0f0;

  &::placeholder {
    color: #999;
    font-style: italic;
  }

  &:focus {
    border-color: #0034ee;
    outline: none;
  }
  &:hover {
    border-color: #0034ee;
  }
  &.error {
    animation: ${bounceIn} 0.5s ease forwards;
  }

  &.valid {
    animation: ${bounceOut} 0.5s ease forwards;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 100px; /* Ajusta este valor según sea necesario */
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    max-height: 100px; /* Ajusta este valor según sea necesario */
  }
  to {
    opacity: 0;
    max-height: 0;
  }
`;

export const Error = styled.div`
  color: white;
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
    animation: ${fadeIn} 0.3s forwards;
  }

  &.hidden {
    opacity: 0;
    max-height: 0;
    animation: ${fadeOut} 0.3s forwards;
  }
`;

export const StyledButton = styled(DarkButton)`
  display: inline-block;
    &.error {
    animation: ${bounceIn} 0.5s ease forwards;
  }

  &.valid {
    animation: ${bounceOut} 0.5s ease forwards;
  }
`;
