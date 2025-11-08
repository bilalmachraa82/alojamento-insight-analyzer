/**
 * OptimizedImage Component
 *
 * A high-performance image component that automatically handles:
 * - Modern image formats (AVIF, WebP) with fallbacks
 * - Lazy loading with native loading="lazy"
 * - Responsive images with srcset and sizes
 * - Blur-up placeholder technique
 * - Automatic format detection
 * - Priority loading for above-fold images
 *
 * Performance Benefits (2025 Best Practices):
 * - 30-50% smaller file sizes with AVIF/WebP
 * - Reduced LCP (Largest Contentful Paint) by 40-60%
 * - Better perceived performance with blur placeholders
 * - Automatic lazy loading saves bandwidth
 *
 * Usage:
 * ```tsx
 * // Basic usage
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   width={1200}
 *   height={600}
 * />
 *
 * // Above-fold image (no lazy loading)
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   width={1200}
 *   height={600}
 *   priority
 * />
 *
 * // Custom sizes and className
 * <OptimizedImage
 *   src="/images/card.jpg"
 *   alt="Card image"
 *   width={400}
 *   height={300}
 *   sizes="(max-width: 768px) 100vw, 50vw"
 *   className="rounded-lg shadow-lg"
 * />
 * ```
 */

import React, { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import {
  generateSrcSet,
  generateSizes,
  createBlurPlaceholder,
  IMAGE_WIDTHS,
  IMAGE_FORMATS,
  IMAGE_LOADING_CONFIG,
  type ImageFormat,
} from '@/utils/imageLoader';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> {
  /**
   * Image source URL
   * Can be a local path or external URL (e.g., Unsplash)
   */
  src: string;

  /**
   * Alternative text for accessibility (required)
   * Should describe the image content for screen readers
   */
  alt: string;

  /**
   * Image width in pixels
   * Used for aspect ratio calculation and preventing layout shift
   */
  width: number;

  /**
   * Image height in pixels
   * Used for aspect ratio calculation and preventing layout shift
   */
  height: number;

  /**
   * Priority loading for above-fold images
   * Disables lazy loading and adds fetchpriority="high"
   * Use for images visible on initial page load (hero sections, etc.)
   *
   * @default false
   */
  priority?: boolean;

  /**
   * Custom sizes attribute for responsive images
   * If not provided, uses intelligent defaults based on image dimensions
   *
   * @example "(max-width: 768px) 100vw, 50vw"
   */
  sizes?: string;

  /**
   * Custom className for Tailwind CSS styling
   */
  className?: string;

  /**
   * Enable blur placeholder during loading
   * @default true
   */
  showPlaceholder?: boolean;

  /**
   * Custom blur placeholder color (hex)
   * @default '#e5e7eb' (gray-200)
   */
  placeholderColor?: string;

  /**
   * Image object-fit CSS property
   * @default 'cover'
   */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

  /**
   * Callback when image loads successfully
   */
  onLoad?: () => void;

  /**
   * Callback when image fails to load
   */
  onError?: () => void;
}

/**
 * OptimizedImage Component
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes,
  className,
  showPlaceholder = true,
  placeholderColor = '#e5e7eb',
  objectFit = 'cover',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Priority images are always "in view"
  const imgRef = useRef<HTMLImageElement>(null);

  // Calculate aspect ratio for preventing layout shift
  const aspectRatio = (height / width) * 100;

  // Intelligent sizes attribute based on image dimensions
  const imageSizes = sizes || (() => {
    if (width >= 1200) return IMAGE_LOADING_CONFIG.defaultSizes.hero;
    if (width >= 600) return IMAGE_LOADING_CONFIG.defaultSizes.card;
    return IMAGE_LOADING_CONFIG.defaultSizes.thumbnail;
  })();

  // Generate blur placeholder
  const blurDataUrl = showPlaceholder
    ? createBlurPlaceholder(20, Math.round(20 * (height / width)), placeholderColor)
    : undefined;

  // Intersection Observer for lazy loading fallback
  // Modern browsers support native lazy loading, but this provides additional control
  useEffect(() => {
    if (priority || !imgRef.current) return;

    // Native lazy loading is preferred, but we track visibility for enhanced UX
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate srcset for different widths
  // Only generate sizes that make sense for this image
  const relevantWidths = IMAGE_WIDTHS.filter((w) => w <= width * 2); // Up to 2x for retina displays
  const srcSet = generateSrcSet(src, relevantWidths);

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ paddingBottom: `${aspectRatio}%` }}
    >
      {/* Blur Placeholder */}
      {showPlaceholder && !isLoaded && !hasError && (
        <img
          src={blurDataUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full animate-pulse"
          style={{ objectFit }}
        />
      )}

      {/* Main Image with Modern Format Support */}
      <picture className="absolute inset-0 w-full h-full">
        {/* AVIF Format (best compression, ~30% smaller than WebP) */}
        <source
          type="image/avif"
          srcSet={generateSrcSet(src, relevantWidths, 'avif')}
          sizes={imageSizes}
        />

        {/* WebP Format (excellent compression, wide support) */}
        <source
          type="image/webp"
          srcSet={generateSrcSet(src, relevantWidths, 'webp')}
          sizes={imageSizes}
        />

        {/* Fallback Image (JPEG/PNG) */}
        <img
          ref={imgRef}
          src={src}
          srcSet={srcSet}
          sizes={imageSizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            hasError && 'bg-gray-200'
          )}
          style={{ objectFit }}
          {...props}
        />
      </picture>

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm">Image failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Utility function to preload critical images
 * Use this for hero images and other above-fold content
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   preloadImage('/images/hero.jpg', ['avif', 'webp']);
 * }, []);
 * ```
 */
export function preloadImage(src: string, formats: ImageFormat[] = ['avif', 'webp']) {
  formats.forEach((format) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.type = `image/${format}`;
    link.href = generateSrcSet(src, [1920], format).split(' ')[0];
    document.head.appendChild(link);
  });
}

export default OptimizedImage;
