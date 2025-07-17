import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App.tsx';

test('renders heading', () => {
  render(<App />);
  const heading = screen.getByText(/Solway Firth Tunnel Ontology Visualizer/i);
  expect(heading).toBeDefined();
});
