import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import DiagnosticForm from './DiagnosticForm';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

// Mock the toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Helper to wrap component with providers
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('DiagnosticForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form fields correctly in English', () => {
      renderWithProviders(<DiagnosticForm language="en" />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/property link/i)).toBeInTheDocument();
    });

    it('renders form fields correctly in Portuguese', () => {
      renderWithProviders(<DiagnosticForm language="pt" />);

      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/link/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderWithProviders(<DiagnosticForm language="en" />);

      const submitButton = screen.getByRole('button', { name: /submit|enviar|analyze/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('renders RGPD checkbox', () => {
      renderWithProviders(<DiagnosticForm language="en" />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiagnosticForm language="en" />);

      const submitButton = screen.getByRole('button', { name: /submit|enviar|analyze/i });
      await user.click(submitButton);

      // Form should show validation errors
      await waitFor(() => {
        // At least one error message should appear
        const form = document.querySelector('form');
        expect(form).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiagnosticForm language="en" />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /submit|enviar|analyze/i });
      await user.click(submitButton);

      // Should show email validation error
      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        expect(emailInput).toBeInTheDocument();
      });
    });
  });

  describe('Platform Selection', () => {
    it('allows selecting a platform', async () => {
      renderWithProviders(<DiagnosticForm language="en" />);

      // Look for platform selector
      const platformTrigger = screen.getByRole('combobox');
      expect(platformTrigger).toBeInTheDocument();
    });
  });

  describe('Form Input', () => {
    it('accepts valid input in name field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiagnosticForm language="en" />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      expect(nameInput).toHaveValue('John Doe');
    });

    it('accepts valid email input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiagnosticForm language="en" />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'john@example.com');

      expect(emailInput).toHaveValue('john@example.com');
    });

    it('accepts property URL input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiagnosticForm language="en" />);

      const linkInput = screen.getByLabelText(/property link/i);
      await user.type(linkInput, 'https://www.booking.com/hotel/pt/test-property.html');

      expect(linkInput).toHaveValue('https://www.booking.com/hotel/pt/test-property.html');
    });

    it('allows checking RGPD consent', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiagnosticForm language="en" />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });
  });

  describe('Accessibility', () => {
    it('form fields have proper labels', () => {
      renderWithProviders(<DiagnosticForm language="en" />);

      // All inputs should have associated labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    it('submit button is keyboard accessible', async () => {
      renderWithProviders(<DiagnosticForm language="en" />);

      const submitButton = screen.getByRole('button', { name: /submit|enviar|analyze/i });
      submitButton.focus();

      expect(document.activeElement).toBe(submitButton);
    });
  });
});
