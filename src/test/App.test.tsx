import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../App';
import { StatusBadge } from '../components/ui/StatusBadge';

describe('Digital LEAP Internship Management System - Phase 1 Foundation', () => {
  it('renders application with university branding and portal title', () => {
    render(<App />);
    expect(screen.getByText(/Digital LEAP Internship Management System/i)).toBeInTheDocument();
  });

  it('renders status badges with appropriate labels and styles', () => {
    const { container, rerender } = render(<StatusBadge status="APPROVED" />);
    expect(screen.getByText(/APPROVED/i)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-emerald-50');

    rerender(<StatusBadge status="UNDER_REVIEW" />);
    expect(screen.getByText(/UNDER REVIEW/i)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-blue-50');

    rerender(<StatusBadge status="CORRECTION_REQUIRED" />);
    expect(screen.getByText(/CORRECTION REQUIRED/i)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-amber-50');
  });
});
