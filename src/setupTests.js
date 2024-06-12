// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { ThemeProvider } from 'styled-components';
import theme from './styles/theme';
import { render } from '@testing-library/react';

const customRender = (ui, options) =>
  render(ui, { wrapper: ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>, ...options });

export * from '@testing-library/react';
export { customRender as render };
