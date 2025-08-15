
import { useState, useEffect } from 'react';
import { UserService } from '@/services/userService';
import type { User } from '@/types/database';

export const useUser = (email?: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async (userEmail: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await UserService.getUserByEmail(userEmail);
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const newUser = await UserService.upsertUser(userData);
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (
    tier: User['subscription_tier'],
    status: User['subscription_status'] = 'active',
    endDate?: string
  ) => {
    if (!user) throw new Error('No user to update');
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await UserService.updateSubscription(user.id, tier, status, endDate);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkLimits = async () => {
    if (!user) return null;
    
    try {
      return await UserService.checkSubscriptionLimits(user.id);
    } catch (err) {
      console.error('Failed to check limits:', err);
      return null;
    }
  };

  useEffect(() => {
    if (email) {
      fetchUser(email);
    }
  }, [email]);

  return {
    user,
    loading,
    error,
    fetchUser,
    createUser,
    updateSubscription,
    checkLimits,
    isSubscribed: user?.subscription_status === 'active',
    subscriptionTier: user?.subscription_tier || 'free'
  };
};
