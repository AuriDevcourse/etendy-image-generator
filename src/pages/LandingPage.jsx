import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { authService } from '../lib/supabase';
import sattendWhiteLogo from '../assets/sattend-white.png';
import image1 from '../../1.png';
import image2 from '../../2.png';
import image3 from '../../3.png';
import image4 from '../../4.png';
import image5 from '../../5.png';
import image6 from '../../6.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [scribblePosition, setScribblePosition] = useState({ x: 20, y: 30, rotation: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    authService.getCurrentUser().then(setUser);
    
    // Randomize scribble position every 14 seconds (animation + pause)
    const interval = setInterval(() => {
      setScribblePosition({
        x: Math.random() * 100, // 0-100% from left (can be off-screen)
        y: Math.random() * 100, // 0-100% from top (can be off-screen)
        rotation: Math.random() * 90 - 45 // -45 to +45 degrees for more variety
      });
    }, 14000);
    
    return () => clearInterval(interval);
  }, []);

  const handleTryNow = async () => {
    // Check if user is logged in
    const currentUser = await authService.getCurrentUser();
    
    setIsTransitioning(true);
    setTimeout(() => {
      if (currentUser) {
        // User is logged in, go to generator
        navigate('/generator');
      } else {
        // User is not logged in, redirect to Google login
        authService.signInWithGoogle();
      }
    }, 500); // Wait for fade-out animation
  };

  // Example gradient designs inspired by the images
  const gradientExamples = [
    // Row 1 - Orange/warm tones
    { gradient: 'radial-gradient(circle at 30% 30%, #ff8c42 0%, #ff6b35 40%, #1a1a1a 100%)' },
    { gradient: 'radial-gradient(ellipse at center, #ff6b35 0%, #1a1a1a 70%)' },
    { gradient: 'linear-gradient(135deg, #ff8c42 0%, #d4522a 50%, #1a1a1a 100%)' },
    
    // Row 2 - Mixed warm
    { gradient: 'linear-gradient(180deg, #ff8c42 0%, #1a1a1a 100%)' },
    { gradient: 'radial-gradient(circle at 50% 50%, #ff8c42 0%, #1a1a1a 60%)' },
    { gradient: 'radial-gradient(ellipse at 70% 30%, #ff8c42 0%, #ff6b35 30%, #1a1a1a 70%)' },
    
    // Row 3 - Purple/Pink tones
    { gradient: 'radial-gradient(ellipse at 30% 30%, #a855f7 0%, #ec4899 40%, #1e1b4b 100%)' },
    { gradient: 'radial-gradient(circle at center, #10b981 0%, #06b6d4 50%, #1e293b 100%)' },
    { gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #1e293b 100%)' },
    
    // Row 4 - Blue/Cyan tones
    { gradient: 'radial-gradient(circle at 30% 50%, #3b82f6 0%, #06b6d4 40%, #0f172a 100%)' },
    { gradient: 'radial-gradient(ellipse at center, #8b5cf6 0%, #ec4899 50%, #1e1b4b 100%)' },
    { gradient: 'radial-gradient(circle at 70% 40%, #10b981 0%, #06b6d4 40%, #0f172a 100%)' },
  ];

  return (
    <div className={`min-h-screen w-full relative overflow-hidden transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`} style={{ background: 'linear-gradient(135deg, #2a1f1a, #000000)' }}>
      {/* Animated wavy scribble background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <svg 
          className="scribble-svg" 
          width="200%" 
          height="200%" 
          viewBox="0 0 3000 1500" 
          preserveAspectRatio="xMidYMid slice"
          style={{
            position: 'absolute',
            left: `${scribblePosition.x}%`,
            top: `${scribblePosition.y}%`,
            transform: `translate(-50%, -50%) rotate(${scribblePosition.rotation}deg)`
          }}
        >
          <defs>
            <linearGradient id="scribbleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fc384b" />
              <stop offset="50%" stopColor="#ff8c42" />
              <stop offset="100%" stopColor="#ffcb00" />
            </linearGradient>
          </defs>
          <path
            d="M -600 750 Q -300 400, 200 700 Q 600 950, 1100 600 Q 1500 300, 1900 750 Q 2300 1100, 2700 700 Q 3100 450, 3600 750"
            stroke="url(#scribbleGradient)"
            strokeWidth="70"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="scribble-path"
          />
        </svg>
      </div>
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-orange-400/3 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content Container - Single Screen Layout */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Hero Section - Compact */}
        <div className="flex flex-col items-center justify-center px-4 pt-12 pb-8">
          {/* Company Logo */}
          <div className="mb-6">
            <img 
              src={sattendWhiteLogo} 
              alt="Sattend" 
              className="h-32 md:h-40 lg:h-48 w-auto object-contain"
            />
          </div>

          {/* Slogan */}
          <p className="text-xl md:text-3xl text-white/90 mb-2 text-center max-w-4xl font-light">
            Personalize visuals that match your brand
          </p>
          <p className="text-base md:text-lg text-orange-200/60 mb-6 text-center max-w-2xl">
            Create professional designs in seconds. No experience needed.
          </p>

          {/* Call to Action */}
          <Button
            onClick={handleTryNow}
            size="lg"
            className="group bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white/90 text-lg px-12 py-6 rounded-xl shadow-2xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-105 font-semibold border-0"
          >
            Try Now
            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Horizontal Scrolling Gallery - Takes remaining space */}
        <div className="relative w-full flex-1 overflow-hidden flex items-center mt-8">
          {/* Scrolling container */}
          <div className="horizontal-scroll-container flex gap-6">
            {/* Duplicate the 6 images twice for seamless loop */}
            {[...Array(2)].map((_, setIndex) => (
              <React.Fragment key={setIndex}>
                <div className="gradient-card">
                  <img src={image1} alt="Gallery 1" className="w-full h-full object-cover" />
                </div>
                <div className="gradient-card">
                  <img src={image2} alt="Gallery 2" className="w-full h-full object-cover" />
                </div>
                <div className="gradient-card">
                  <img src={image3} alt="Gallery 3" className="w-full h-full object-cover" />
                </div>
                <div className="gradient-card">
                  <img src={image4} alt="Gallery 4" className="w-full h-full object-cover" />
                </div>
                <div className="gradient-card">
                  <img src={image5} alt="Gallery 5" className="w-full h-full object-cover" />
                </div>
                <div className="gradient-card">
                  <img src={image6} alt="Gallery 6" className="w-full h-full object-cover" />
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

