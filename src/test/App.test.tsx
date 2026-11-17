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

describe('Digital LEAP Internship Management System — UI & Routing', () => {
  it('renders the public landing page at / with university branding, process steps, and stakeholders', () => {
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
    expect(screen.getByText(/How the Internship Process Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Six Stakeholders, One Centralized Platform/i)).toBeInTheDocument();
  });

  it('renders the login page at /login with the 6 provisioned demonstration accounts', () => {
    renderWithRoute('/login');
    expect(
      screen.getByRole('heading', { name: /Sign In to Digital LEAP/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Six Role Demonstration Accounts/i)).toBeInTheDocument();
    expect(screen.getByText('student@limkokwing.edu.sl')).toBeInTheDocument();
    expect(screen.getByText('coordinator@limkokwing.edu.sl')).toBeInTheDocument();
    expect(screen.getByText('supervisor@limkokwing.edu.sl')).toBeInTheDocument();
    expect(screen.getByText('host@slcb.sl')).toBeInTheDocument();
    expect(screen.getByText('management@limkokwing.edu.sl')).toBeInTheDocument();
    expect(screen.getByText('admin@limkokwing.edu.sl')).toBeInTheDocument();
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
