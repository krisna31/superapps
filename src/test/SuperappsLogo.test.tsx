import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuperappsLogo } from '../components/brand/SuperappsLogo';

describe('SuperappsLogo Component', () => {
  it('renders SVG vector element with accessible label', () => {
    render(<SuperappsLogo />);
    const logo = screen.getByRole('img', { name: /Superapps OS Logo/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('viewBox', '0 0 48 48');
  });

  it('renders custom dimensions when size prop is provided', () => {
    render(<SuperappsLogo size={64} />);
    const logo = screen.getByRole('img', { name: /Superapps OS Logo/i });
    expect(logo).toHaveAttribute('width', '64');
    expect(logo).toHaveAttribute('height', '64');
  });

  it('renders wordmark typography when showWordmark is true', () => {
    render(<SuperappsLogo showWordmark />);
    expect(screen.getByText(/Superapps/i)).toBeInTheDocument();
    expect(screen.getByText(/OS/i)).toBeInTheDocument();
    expect(screen.getByText(/CLIENT-SIDE/i)).toBeInTheDocument();
  });

  it('does not render squircle background in icon-only variant', () => {
    const { container } = render(<SuperappsLogo variant="icon" />);
    // In icon-only variant, rect squircle base is omitted
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(0);
  });
});
