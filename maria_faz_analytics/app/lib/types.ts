
import { NextAuthOptions, User } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      firstName?: string
      lastName?: string
      role: string
      credits: number
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    firstName?: string
    lastName?: string
    role: string
    credits: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    credits?: number
    firstName?: string
    lastName?: string
  }
}

export interface PropertyData {
  id: string
  name: string
  address?: string
  city?: string
  country?: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  maxGuests?: number
  airbnbUrl?: string
  bookingUrl?: string
  vrboUrl?: string
  currentRating?: number
  totalReviews?: number
  averagePrice?: number
  monthlyRevenue?: number
  occupancyRate?: number
  responseRate?: number
  superHostStatus: boolean
  marketAveragePrice?: number
  marketAverageRating?: number
  lastScrapedAt?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ReportData {
  id: string
  title: string
  description?: string
  healthScore: number
  scoreCategory: string
  currentRating?: number
  targetRating?: number
  currentRevenue?: number
  projectedRevenue?: number
  currentOccupancy?: number
  targetOccupancy?: number
  averagePrice?: number
  suggestedPrice?: number
  reputationAnalysis?: string
  infrastructureIssues?: string
  pricingRecommendations?: string
  marketingInsights?: string
  guestExperience?: string
  strongPoints?: string[]
  criticalIssues?: string[]
  recommendations?: string[]
  htmlContent?: string
  pdfUrl?: string
  status: string
  generatedAt: Date
  exportedAt?: Date
  createdAt: Date
  updatedAt: Date
  property: PropertyData
}

export interface HealthScoreBreakdown {
  category: string
  score: number
  weight: number
  description: string
}
