import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { AppRoutes } from '../routes/AppRoutes';
import { StatusBadge } from '../components/ui/StatusBadge';

function renderWithRoute(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Digital LEAP Internship Management System — Public UI, Login & Registration', () => {
  it('renders the public landing page at / with Create Student Account and Sign In buttons, and zero demo credentials', () => {
    renderWithRoute('/');
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Digital LEAP Internship Management System/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Bridging Academic Excellence and Industry Practice in Sierra Leone/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Create Student Account/i).length).toBeGreaterThan(0);

    // Must not expose any demo credentials on the landing page
    expect(screen.queryByText(/LeapDemo!2026/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Six Role Demonstration Accounts/i)).not.toBeInTheDocument();
  });

  it('renders a clean shared login page at /login without exposing demo accounts or test credentials', () => {
    renderWithRoute('/login');
    expect(
      screen.getByRole('heading', { name: /Sign In to Digital LEAP/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByText(/Forgot Password\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Student Account/i)).toBeInTheDocument();

    // Verify demo credentials and one-click buttons are completely absent
    expect(screen.queryByText(/Six Role Demonstration Accounts/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/LeapDemo!2026/i)).not.toBeInTheDocument();
    expect(screen.queryByText('student@limkokwing.edu.sl')).not.toBeInTheDocument();
    expect(screen.queryByText('coordinator@limkokwing.edu.sl')).not.toBeInTheDocument();
    expect(screen.queryByText('admin@limkokwing.edu.sl')).not.toBeInTheDocument();
  });

  it('renders the student self-registration page at /register with required fields', () => {
    renderWithRoute('/register');
    expect(
      screen.getByRole('heading', { name: /Create Student Account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Student ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/University Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });

  it('renders status badges for all workflow states', () => {
    const { container, rerender } = render(<StatusBadge status="APPROVED" />);
    expect(screen.getByText(/APPROVED/i)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-emerald-50');

    rerender(<StatusBadge status="UNDER_REVIEW" />);
    expect(screen.getByText(/UNDER REVIEW/i)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-blue-50');

    rerender(<StatusBadge status="CORRECTION_REQUIRED" />);
    expect(screen.getByText(/CORRECTION REQUIRED/i)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-amber-50');

    rerender(<StatusBadge status="REJECTED" />);
    expect(screen.getByText(/REJECTED/i)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-rose-50');
  });
});
