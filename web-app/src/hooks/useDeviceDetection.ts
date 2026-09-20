import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type OrientationType = 'portrait' | 'landscape';

export interface DeviceInfo {
  width: number;
  height: number;
  aspectRatio: number;
  pixelRatio: number;
  isMobile: boolean;
  isSmallMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  orientation: OrientationType;
  isTouch: boolean;
  hasVirtualKeyboard: boolean;
}

function getDeviceInfo(): DeviceInfo {
  const width = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const isTouch =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  const isSmallMobile = width < 390;
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  const deviceType: DeviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  const orientation: OrientationType = width > height ? 'landscape' : 'portrait';
  const pixelRatio = window.devicePixelRatio || 1;

  // Detect virtual keyboard when visualViewport is significantly smaller than window.innerHeight on touch devices
  const hasVirtualKeyboard =
    isTouch && window.visualViewport
      ? window.visualViewport.height < window.innerHeight - 150
      : false;

  return {
    width: Math.round(width),
    height: Math.round(height),
    aspectRatio: Number((width / (height || 1)).toFixed(2)),
    pixelRatio,
    isMobile,
    isSmallMobile,
    isTablet,
    isDesktop,
    deviceType,
    orientation,
    isTouch,
    hasVirtualKeyboard,
  };
}

/**
 * Custom hook to dynamically monitor viewport changes, device characteristics,
 * and adjust styling / data-attributes reactively.
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        aspectRatio: 1.33,
        pixelRatio: 1,
        isMobile: false,
        isSmallMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop',
        orientation: 'landscape',
        isTouch: false,
        hasVirtualKeyboard: false,
      };
    }
    return getDeviceInfo();
  });

  useEffect(() => {
    let rafId: number | null = null;

    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const nextInfo = getDeviceInfo();
        setDeviceInfo(nextInfo);

        // Sync with document element attributes for native CSS targeting
        if (typeof document !== 'undefined' && document.documentElement) {
          const root = document.documentElement;
          root.setAttribute('data-device', nextInfo.deviceType);
          root.setAttribute('data-orientation', nextInfo.orientation);
          root.setAttribute('data-touch', nextInfo.isTouch ? 'true' : 'false');
          root.setAttribute('data-small-mobile', nextInfo.isSmallMobile ? 'true' : 'false');
          root.style.setProperty('--viewport-width', `${nextInfo.width}px`);
          root.style.setProperty('--viewport-height', `${nextInfo.height}px`);
        }
      });
    };

    // Initial sync
    handleResize();

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize, { passive: true });
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return deviceInfo;
}
