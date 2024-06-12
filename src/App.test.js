import { render, screen } from '@testing-library/react';
import { act } from 'react';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import { ThemeProvider } from 'styled-components';
import theme from './styles/theme';

test('renders learn react link', () => {
  act(() => {
    render(
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </ErrorBoundary>
    );
  });
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
