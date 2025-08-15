
import { supabase } from '@/integrations/supabase/client';
import type { User, Bookmark } from '@/types/database';

export class UserService {
  // Create or update user
  static async upsertUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'email' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get user by email
  static async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }

  // Update subscription
  static async updateSubscription(
    userId: string, 
    subscriptionTier: User['subscription_tier'],
    subscriptionStatus: User['subscription_status'] = 'active',
    endDate?: string
  ) {
    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_tier: subscriptionTier,
        subscription_status: subscriptionStatus,
        subscription_end_date: endDate
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Check subscription limits
  static async checkSubscriptionLimits(userId: string) {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const { data: propertiesCount } = await supabase
      .from('properties')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true);

    const limits = {
      free: { properties: 1, reports: 1 },
      professional: { properties: 10, reports: 50 },
      premium: { properties: -1, reports: -1 }, // unlimited
      enterprise: { properties: -1, reports: -1 }
    };

    const userLimits = limits[user.subscription_tier];
    const currentCount = propertiesCount?.length || 0;

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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Add bookmark
  static async addBookmark(bookmarkData: Omit<Bookmark, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert(bookmarkData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get user bookmarks
  static async getUserBookmarks(userId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        *,
        properties (*),
        analysis_reports (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Remove bookmark
  static async removeBookmark(bookmarkId: string) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId);
    
    if (error) throw error;
  }
}
