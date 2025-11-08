
import { supabase } from '@/integrations/supabase/client';
import type { User, Bookmark, Property, AnalysisReport } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client instance with proper typing
 */
const client: SupabaseClient = supabase;

/**
 * Bookmark with related property and analysis report data
 */
export interface BookmarkWithRelations extends Bookmark {
  properties?: Property | Property[] | null;
  analysis_reports?: AnalysisReport | AnalysisReport[] | null;
}

export class UserService {
  /**
   * Create or update user in the database
   * @param userData - User data without id and timestamps
   * @returns Created or updated user
   */
  static async upsertUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await client
      .from('users')
      .upsert(userData, { onConflict: 'email' })
      .select('*')
      .single();

    if (error) throw error;
    return data as User;
  }

  /**
   * Get user by email address
   * @param email - User's email address
   * @returns User object or null if not found
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // PGRST116 is "not found" in PostgREST; if your project returns that, mirror original behavior
    if (error && error.code !== 'PGRST116') throw error;
    return (data as User) || null;
  }

  /**
   * Update user subscription information
   * @param userId - User's ID
   * @param subscriptionTier - New subscription tier
   * @param subscriptionStatus - New subscription status (default: 'active')
   * @param endDate - Optional subscription end date
   * @returns Updated user object
   */
  static async updateSubscription(
    userId: string,
    subscriptionTier: User['subscription_tier'],
    subscriptionStatus: User['subscription_status'] = 'active',
    endDate?: string
  ): Promise<User> {
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

  /**
   * Check subscription limits for a user
   * @param userId - User's ID
   * @returns Object containing tier and property limits
   */
  static async checkSubscriptionLimits(userId: string): Promise<{
    tier: User['subscription_tier'];
    properties: {
      current: number;
      limit: number;
      canAdd: boolean;
    };
  }> {
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

  /**
   * Get user by ID
   * @param userId - User's ID
   * @returns User object or null if not found
   */
  static async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as User) || null;
  }

  /**
   * Add a new bookmark
   * @param bookmarkData - Bookmark data without id and created_at
   * @returns Created bookmark
   */
  static async addBookmark(bookmarkData: Omit<Bookmark, 'id' | 'created_at'>): Promise<Bookmark> {
    const { data, error } = await client
      .from('bookmarks')
      .insert(bookmarkData)
      .select('*')
      .single();

    if (error) throw error;
    return data as Bookmark;
  }

  /**
   * Get user bookmarks with related properties and analysis reports
   * @param userId - User ID to fetch bookmarks for
   * @returns Array of bookmarks with related data
   */
  static async getUserBookmarks(userId: string): Promise<BookmarkWithRelations[]> {
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
    return (data as BookmarkWithRelations[]) || [];
  }

  /**
   * Remove a bookmark
   * @param bookmarkId - Bookmark ID to remove
   */
  static async removeBookmark(bookmarkId: string): Promise<void> {
    const { error } = await client
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId);

    if (error) throw error;
  }
}
