/**
 * This file re-exports from the core module for backward compatibility
 */

export * from './core/index';

export interface Place {
  id: string | number;
  name: string;
  address: string;
  location: string; // location 필드 추가
  x: number;
  y: number;
  category: string;
  categoryDetail?: string;
  rating?: number;
  reviewCount?: number;
  naverLink?: string;
  instaLink?: string;
  weight?: number;
  phone?: string;
  imageUrl?: string;
}
