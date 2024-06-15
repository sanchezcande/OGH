import styled from "styled-components";

export const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  max-width: 500px;
  margin: auto;
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
`;

export const Error = styled.div`
  color: dark blue;
  margin-bottom: 10px;
  font-size: 10px;
  margin-left: 10px;
`;
