import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { SplashScreen } from '@/components/splash-screen';

export default function SplashPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [_, setLocation] = useLocation();
  
  // Check if we've shown the splash screen before
  useEffect(() => {
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setShowSplash(false);
      setLocation('/home');
    }
  }, [setLocation]);
  
  const handleSplashComplete = () => {
    // Save in localStorage so we don't show the splash screen again
    localStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
    setLocation('/home');
  };
  
  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    </>
  );
}