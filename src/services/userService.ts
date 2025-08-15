
import { supabase } from '@/integrations/supabase/client';
import type { User, Bookmark } from '@/types/database';

const client: any = supabase;

export class UserService {
  // Create or update user
  static async upsertUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    console.log('[UserService] upsertUser payload:', userData);
    const { data, error } = await client
      .from('users')
      .upsert(userData, { onConflict: 'email' })
      .select('*')
      .single();

    if (error) throw error;
    return data as User;
  }

  // Get user by email
  static async getUserByEmail(email: string) {
    console.log('[UserService] getUserByEmail:', email);
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // PGRST116 is "not found" in PostgREST; if your project returns that, mirror original behavior
    if (error && error.code !== 'PGRST116') throw error;
    return (data as User) || null;
  }

  // Update subscription
  static async updateSubscription(
    userId: string, 
    subscriptionTier: User['subscription_tier'],
    subscriptionStatus: User['subscription_status'] = 'active',
    endDate?: string
  ) {
    console.log('[UserService] updateSubscription:', { userId, subscriptionTier, subscriptionStatus, endDate });
    const { data, error } = await client
      .from('users')
      .update({
        subscription_tier: subscriptionTier,
        subscription_status: subscriptionStatus,
        subscription_end_date: endDate
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data as User;
  }

  // Check subscription limits
  static async checkSubscriptionLimits(userId: string) {
    console.log('[UserService] checkSubscriptionLimits for user:', userId);
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const { data: properties, error: propertiesError } = await client
      .from('properties')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (propertiesError) throw propertiesError;

    const limits = {
      free: { properties: 1, reports: 1 },
      professional: { properties: 10, reports: 50 },
      premium: { properties: -1, reports: -1 }, // unlimited
      enterprise: { properties: -1, reports: -1 }
    } as const;

    const userLimits = limits[user.subscription_tier];
    const currentCount = Array.isArray(properties) ? properties.length : 0;

    return {
      tier: user.subscription_tier,
      properties: {
        current: currentCount,
        limit: userLimits.properties,
        canAdd: userLimits.properties === -1 || currentCount < userLimits.properties
      }
    };
  }

  // Get user by ID
  static async getUserById(userId: string) {
    console.log('[UserService] getUserById:', userId);
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as User) || null;
  }

  // Add bookmark
  static async addBookmark(bookmarkData: Omit<Bookmark, 'id' | 'created_at'>) {
    console.log('[UserService] addBookmark payload:', bookmarkData);
    const { data, error } = await client
      .from('bookmarks')
      .insert(bookmarkData)
      .select('*')
      .single();

    if (error) throw error;
    return data as Bookmark;
  }

  // Get user bookmarks
  static async getUserBookmarks(userId: string) {
    console.log('[UserService] getUserBookmarks for user:', userId);
    const { data, error } = await client
      .from('bookmarks')
      .select(`
        *,
        properties (*),
        analysis_reports (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any[];
  }

  // Remove bookmark
  static async removeBookmark(bookmarkId: string) {
    console.log('[UserService] removeBookmark id:', bookmarkId);
    const { error } = await client
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId);

    if (error) throw error;
  }
}
