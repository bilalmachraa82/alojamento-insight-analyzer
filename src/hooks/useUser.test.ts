import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUser } from './useUser';
import { UserService } from '@/services/userService';

vi.mock('@/services/userService', () => ({
  UserService: {
    getUserByEmail: vi.fn(),
    upsertUser: vi.fn(),
    updateSubscription: vi.fn(),
    checkSubscriptionLimits: vi.fn(),
  },
}));

describe('useUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    subscription_tier: 'free' as const,
    subscription_status: 'active' as const,
    subscription_end_date: null,
    analyses_used: 0,
    last_analysis_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe('initial state', () => {
    it('should have null user initially', () => {
      const { result } = renderHook(() => useUser());

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should not be subscribed initially', () => {
      const { result } = renderHook(() => useUser());

      expect(result.current.isSubscribed).toBe(false);
      expect(result.current.subscriptionTier).toBe('free');
    });
  });

  describe('fetchUser', () => {
    it('should fetch user by email automatically when email is provided', async () => {
      vi.mocked(UserService.getUserByEmail).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUser('test@example.com'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(UserService.getUserByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      vi.mocked(UserService.getUserByEmail).mockRejectedValue(
        new Error('User not found')
      );

      const { result } = renderHook(() => useUser('test@example.com'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe('User not found');
    });

    it('should set loading state correctly', async () => {
      vi.mocked(UserService.getUserByEmail).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockUser), 100)
          )
      );

      const { result } = renderHook(() => useUser('test@example.com'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const newUserData = {
        email: 'new@example.com',
        full_name: 'New User',
        subscription_tier: 'free' as const,
        subscription_status: 'active' as const,
        subscription_end_date: null,
        analyses_used: 0,
        last_analysis_date: null,
      };

      vi.mocked(UserService.upsertUser).mockResolvedValue({
        ...newUserData,
        id: 'new-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const { result } = renderHook(() => useUser());

      const createdUser = await result.current.createUser(newUserData);

      expect(UserService.upsertUser).toHaveBeenCalledWith(newUserData);
      expect(createdUser.id).toBe('new-user-id');
      expect(result.current.user?.email).toBe('new@example.com');
    });

    it('should handle create errors', async () => {
      vi.mocked(UserService.upsertUser).mockRejectedValue(
        new Error('Failed to create user')
      );

      const { result } = renderHook(() => useUser());

      await expect(
        result.current.createUser({
          email: 'test@example.com',
          full_name: 'Test',
          subscription_tier: 'free',
          subscription_status: 'active',
          subscription_end_date: null,
          analyses_used: 0,
          last_analysis_date: null,
        })
      ).rejects.toThrow('Failed to create user');

      expect(result.current.error).toBe('Failed to create user');
    });
  });

  describe('updateSubscription', () => {
    it('should update user subscription', async () => {
      vi.mocked(UserService.getUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(UserService.updateSubscription).mockResolvedValue({
        ...mockUser,
        subscription_tier: 'premium',
      });

      const { result } = renderHook(() => useUser('test@example.com'));

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      const updatedUser = await result.current.updateSubscription('premium');

      expect(UserService.updateSubscription).toHaveBeenCalledWith(
        'user-123',
        'premium',
        'active',
        undefined
      );
      expect(updatedUser.subscription_tier).toBe('premium');
      expect(result.current.user?.subscription_tier).toBe('premium');
    });

    it('should throw error if no user exists', async () => {
      const { result } = renderHook(() => useUser());

      await expect(
        result.current.updateSubscription('premium')
      ).rejects.toThrow('No user to update');
    });

    it('should accept optional status and endDate', async () => {
      vi.mocked(UserService.getUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(UserService.updateSubscription).mockResolvedValue({
        ...mockUser,
        subscription_tier: 'premium',
        subscription_status: 'trial',
        subscription_end_date: '2024-12-31',
      });

      const { result } = renderHook(() => useUser('test@example.com'));

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      await result.current.updateSubscription(
        'premium',
        'trial',
        '2024-12-31'
      );

      expect(UserService.updateSubscription).toHaveBeenCalledWith(
        'user-123',
        'premium',
        'trial',
        '2024-12-31'
      );
    });
  });

  describe('checkLimits', () => {
    it('should check subscription limits', async () => {
      const limits = {
        tier: 'free',
        maxAnalyses: 3,
        analysesUsed: 1,
        analysesRemaining: 2,
        canAnalyze: true,
      };

      vi.mocked(UserService.getUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(UserService.checkSubscriptionLimits).mockResolvedValue(limits);

      const { result } = renderHook(() => useUser('test@example.com'));

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      const limitData = await result.current.checkLimits();

      expect(UserService.checkSubscriptionLimits).toHaveBeenCalledWith(
        'user-123'
      );
      expect(limitData).toEqual(limits);
    });

    it('should return null if no user', async () => {
      const { result } = renderHook(() => useUser());

      const limitData = await result.current.checkLimits();

      expect(limitData).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(UserService.getUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(UserService.checkSubscriptionLimits).mockRejectedValue(
        new Error('Failed to check limits')
      );

      const { result } = renderHook(() => useUser('test@example.com'));

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      const limitData = await result.current.checkLimits();

      expect(limitData).toBeNull();
    });
  });

  describe('computed properties', () => {
    it('should correctly compute isSubscribed', async () => {
      const activeUser = { ...mockUser, subscription_status: 'active' as const };
      const inactiveUser = {
        ...mockUser,
        subscription_status: 'inactive' as const,
      };

      vi.mocked(UserService.getUserByEmail).mockResolvedValue(activeUser);

      const { result, rerender } = renderHook(() =>
        useUser('test@example.com')
      );

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      expect(result.current.isSubscribed).toBe(true);

      vi.mocked(UserService.getUserByEmail).mockResolvedValue(inactiveUser);
      rerender();

      await result.current.fetchUser('test@example.com');

      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(false);
      });
    });

    it('should correctly compute subscriptionTier', async () => {
      const premiumUser = { ...mockUser, subscription_tier: 'premium' as const };

      vi.mocked(UserService.getUserByEmail).mockResolvedValue(premiumUser);

      const { result } = renderHook(() => useUser('test@example.com'));

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      expect(result.current.subscriptionTier).toBe('premium');
    });

    it('should default to free tier if no user', () => {
      const { result } = renderHook(() => useUser());

      expect(result.current.subscriptionTier).toBe('free');
    });
  });
});
