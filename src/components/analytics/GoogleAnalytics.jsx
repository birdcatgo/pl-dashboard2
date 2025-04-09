import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-P3SV1ZNDB4';

// Initialize Google Analytics
const initGA = () => {
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
};

// Track page views
const trackPageView = (path) => {
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
  });
};

// Track custom events
export const trackEvent = (action, category, label, value) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize GA on component mount
    initGA();
  }, []);

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname);
  }, [location]);

  return null;
};

export default GoogleAnalytics; 