
import { useState, useEffect } from 'react';
import { PropertyService } from '@/services/propertyService';
import type { Property } from '@/types/database';

export const useProperties = (userId?: string) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async (userIdParam?: string) => {
    const targetUserId = userIdParam || userId;
    if (!targetUserId) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await PropertyService.getUserProperties(targetUserId);
      setProperties(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const addProperty = async (propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const newProperty = await PropertyService.createProperty(propertyData);
      setProperties(prev => [newProperty, ...prev]);
      return newProperty;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add property');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProperty = async (propertyId: string, updates: Partial<Property>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProperty = await PropertyService.updateProperty(propertyId, updates);
      setProperties(prev => 
        prev.map(p => p.id === propertyId ? updatedProperty : p)
      );
      return updatedProperty;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPropertyDetails = async (propertyId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const details = await PropertyService.getPropertyDetails(propertyId);
      return details;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch property details');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProperties(userId);
    }
  }, [userId]);

  return {
    properties,
    loading,
    error,
    fetchProperties,
    addProperty,
    updateProperty,
    getPropertyDetails,
    refetch: () => fetchProperties(userId)
  };
};
