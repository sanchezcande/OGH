import { render, screen } from '@testing-library/react';
import { act } from 'react';
import App from './App';
import ErrorBoundary from './ErrorBoundary';

test('renders learn react link', () => {
  act(() => {
    render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  });
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
