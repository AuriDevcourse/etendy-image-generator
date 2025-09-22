
import React, { useState, useCallback, useEffect } from 'react';
import { UploadFile } from "@/api/integrations";
import { GeneratedImage } from "@/api/entities";
import { Template } from "@/api/entities";
import { User } from "@/api/entities"; // Assuming User entity exists for role checking
import { AdminSettings } from '@/api/entities'; // Import AdminSettings

import CanvasPreview from "../components/ImageGenerator/CanvasPreview";
import Step1Background from '../components/ImageGenerator/steps/Step1_Background';
import Step2Image from '../components/ImageGenerator/steps/Step2_Image';
import Step3Text from '../components/ImageGenerator/steps/Step3_Text';
import Step4Elements from '../components/ImageGenerator/steps/Step4_Elements';
import Step5Download from '../components/ImageGenerator/steps/Step5_Download';
import LayersPanel from '../components/ImageGenerator/LayersPanel';
import TemplatesPanel from '../components/ImageGenerator/TemplatesPanel';
import ColorPicker from '../components/ImageGenerator/ColorPicker';
import Gallery from '../components/ImageGenerator/Gallery';
import AdminPanel from '../components/ImageGenerator/AdminPanel'; // Import AdminPanel
import { Button } from '@/components/ui/button';
import { Palette, X, CheckCircle, ChevronLeft, ChevronRight, Heart, Layers, Save, Settings, Image as ImageIcon, Type, Shapes, Download, Monitor, User as UserIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const DEFAULT_ADMIN_SETTINGS = {
  fonts: {
    enabled: true,
    allowedFonts: ['Archivo Expanded', 'DM Serif Text', 'Playfair Display', 'Inter', 'Archivo'],
    lockFontStyles: false,
    defaultFont: 'Archivo Expanded',
    defaultWeight: '600',
    defaultSize: 80,
  },
  backgroundControls: {
    locked: false,
    lockedSettings: {
      backgroundType: 'color',
      gradientColor1: '#6366f1',
      gradientColor2: '#8b5cf6',
      gradientAngle: 135,
      backgroundColor: '#1e1b4b',
      backgroundImage: null,
      backgroundImageScale: 1.0, // Added default for locked background
      backgroundImageX: 0, // Added default for locked background
      backgroundImageY: 0, // Added default for locked background
      overlayType: 'solid',
      overlayColor: '#000000',
      overlayOpacity: 0,
      overlayGradientColor1: '#000000',
      overlayGradientOpacity1: 0,
      overlayGradientColor2: '#000000',
      overlayGradientOpacity2: 0,
      overlayGradientAngle: 180,
    },
    colorEnabled: true,
    gradientEnabled: true,
    imageEnabled: true,
    overlayEnabled: true
  },
  pageBackgroundControls: {
    locked: false,
    lockedSettings: {
      pageBackgroundType: 'gradient',
      pageGradientColor1: '#7c3aed',
      pageGradientColor2: '#1e40af',
      pageBackgroundColor: '#1e1b4b',
      pageBackgroundImage: null,
      pageBackgroundScale: 1.0, // Added scale property
      pageBackgroundX: 0, // Added X position property
      pageBackgroundY: 0, // Added Y position property
    },
  },
  imageControls: {
    uploadEnabled: true,
    cropEnabled: true,
    borderEnabled: true,
    blurEnabled: true
  },
  shapeControls: {
    rectangleEnabled: true,
    circleEnabled: true,
    lineEnabled: true,
    starEnabled: true
  },
  generalControls: {
    canvasSizeEnabled: true,
    layersEnabled: true,
    templatesEnabled: true,
    galleryEnabled: true,
    undoEnabled: true,
    resetEnabled: true
  },
  canvasControls: { // NEW: Add canvasControls with default width and height
    defaultWidth: 1500,
    defaultHeight: 1500,
    lockCanvasSize: false // Can be used in AdminPanel later if desired
  }
};

export default function ImageGeneratorPage() {
  // Debug: Confirm latest code is loaded
  console.log('🚀🚀🚀 LATEST CODE LOADED - Update #23 - Console Debug Test 🚀🚀🚀');
  console.log('If you see this message, the latest code is running!');
  console.log('🎯 Admin panel debugging is active!');
  console.log('📍 Look for console messages when clicking admin panel buttons!');

  // Test console immediately
  console.log('🔍 CONSOLE TEST: If you see this, the console is working!');

  // NEW: Control Panel State (replaces old wizard state)
  const [activeControlPanel, setActiveControlPanel] = useState('background');

  // History State for Undo
  const [history, setHistory] = useState([]);
  const MAX_HISTORY_LENGTH = 30;

  // --- REFACTORED STATE ---
  // A single array to hold all canvas elements, managing layers and properties
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  
  // Background State (for Canvas) - Remains global
  const [backgroundType, setBackgroundType] = useState('color');
  const [gradientColor1, setGradientColor1] = useState('#6366f1');
  const [gradientColor2, setGradientColor2] = useState('#8b5cf6');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [backgroundColor, setBackgroundColor] = useState('#1e1b4b');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundImageNaturalDimensions, setBackgroundImageNaturalDimensions] = useState({ width: 0, height: 0 });
  const [backgroundImageScale, setBackgroundImageScale] = useState(1.0);
  const [backgroundImageX, setBackgroundImageX] = useState(0);
  const [backgroundImageY, setBackgroundImageY] = useState(0);
  
  // Overlay State - Remains global
  const [overlayType, setOverlayType] = useState('solid');
  const [overlayColor, setOverlayColor] = useState('#000000');
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [overlayGradientColor1, setOverlayGradientColor1] = useState('#000000');
  const [overlayGradientOpacity1, setOverlayGradientOpacity1] = useState(0);
  const [overlayGradientColor2, setOverlayGradientColor2] = useState('#000000');
  const [overlayGradientOpacity2, setOverlayGradientOpacity2] = useState(0);
  const [overlayGradientAngle, setOverlayGradientAngle] = useState(180);

  // Page Background State (for the entire app page)
  const [pageBackgroundType, setPageBackgroundType] = useState('gradient');
  const [pageGradientColor1, setPageGradientColor1] = useState('#7c3aed');
  const [pageGradientColor2, setPageGradientColor2] = useState('#1e40af');
  const [pageBackgroundColor, setPageBackgroundColor] = useState('#1e1b4b');
  const [pageBackgroundImage, setPageBackgroundImage] = useState(null); // No default image
  const [pageBackgroundScale, setPageBackgroundScale] = useState(1.0);
  const [pageBackgroundX, setPageBackgroundX] = useState(0);
  const [pageBackgroundY, setPageBackgroundY] = useState(0);
  
  // UI State for onboarding and panels
  const [showCanvasBackgroundOverlay, setShowCanvasBackgroundOverlay] = useState(true);
  const [showGalleryPanel, setShowGalleryPanel] = useState(false);
  const [showGalleryDot, setShowGalleryDot] = useState(true);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);
  
  // Canvas and UI State
  const [canvasWidth, setCanvasWidth] = useState(1500);
  const [canvasHeight, setCanvasHeight] = useState(1500);
  const [isCropping, setIsCropping] = useState(false); // NEW: isCropping state is now here
  // Removed isDragActive as it's now managed within CanvasPreview/elements
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Image Gallery State
  const [galleryImages, setGalleryImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  // Removed selectedGalleryImage, it's not directly used here for canvas state
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showSaveError, setShowSaveError] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);

  // Template State
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true); // Fixed: Added useState()
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Admin settings state
  const [adminSettings, setAdminSettings] = useState(DEFAULT_ADMIN_SETTINGS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isSavingAdminSettings, setIsSavingAdminSettings] = useState(false);
  const [initialSettingsApplied, setInitialSettingsApplied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminSettingsLoaded, setAdminSettingsLoaded] = useState(false);
  
  // Admin code - you can change this to whatever you want
  const ADMIN_CODE = 'admin123';

  // Handle admin code verification
  const handleAdminCodeSubmit = useCallback(() => {
    if (adminCode === ADMIN_CODE) {
      setIsAdmin(true);
      setShowAdminPrompt(false);
      localStorage.setItem('etendy_admin_session', 'true');
      console.log('✅ Admin login successful, session saved to localStorage');
      console.log('Verification - localStorage value after save:', localStorage.getItem('etendy_admin_session'));
      setAdminCode(''); // Clear the code
    } else if (adminCode === '') {
      // Empty code = regular user
      setIsAdmin(false);
      setShowAdminPrompt(false);
      localStorage.setItem('etendy_admin_session', 'false');
      console.log('Regular user mode selected');
    } else {
      // Wrong code
      alert('Invalid admin code. Please try again.');
      setAdminCode(''); // Clear the wrong code
    }
  }, [adminCode, ADMIN_CODE]);

  // Check for existing admin session on load
  useEffect(() => {
    console.log('🔍 Admin session check useEffect triggered');
    
    // Test localStorage functionality
    try {
      localStorage.setItem('test', 'working');
      const testValue = localStorage.getItem('test');
      console.log('localStorage test:', testValue === 'working' ? '✅ Working' : '❌ Not working');
      localStorage.removeItem('test');
    } catch (e) {
      console.error('❌ localStorage not available:', e);
    }
    
    const savedSession = localStorage.getItem('etendy_admin_session');
    console.log('Checking admin session on page load:', { 
      savedSession, 
      type: typeof savedSession,
      currentIsAdmin: isAdmin,
      allLocalStorage: Object.keys(localStorage).filter(k => k.startsWith('etendy')).map(k => ({ [k]: localStorage.getItem(k) }))
    });
    
    if (savedSession === 'true') {
      console.log('✅ Setting isAdmin to true from localStorage');
      setIsAdmin(true);
      console.log('✅ Admin session restored from localStorage');
    } else {
      console.log('❌ Setting isAdmin to false, session value:', savedSession);
      setIsAdmin(false);
      console.log('❌ No admin session found, loading as regular user. Session value:', savedSession);
    }
    // Never show prompt automatically
    setShowAdminPrompt(false);
  }, []);

  // Debug: Track isAdmin state changes
  useEffect(() => {
    console.log('🔄 isAdmin state changed to:', isAdmin);
  }, [isAdmin]);

  // Ensure Admin Panel sits on top and other overlays don't block clicks
  const toggleAdminPanel = useCallback(() => {
    setShowAdminPanel((prev) => {
      const next = !prev;
      if (next) {
        // Close other panels and their full-screen overlays
        setShowTemplatesPanel(false);
        setShowLayersPanel(false);
        setShowGalleryPanel(false);
      }
      return next;
    });
  }, [setShowTemplatesPanel, setShowLayersPanel, setShowGalleryPanel]);

  // --- Core Functions (moved up for initialization order) ---
  const gatherStateSnapshot = useCallback(() => {
    return {
      elements: JSON.parse(JSON.stringify(elements)), // Deep copy of elements
      backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor,
      backgroundImage, backgroundImageNaturalDimensions, backgroundImageScale,
      backgroundImageX, backgroundImageY,
      overlayType, overlayColor, overlayOpacity, overlayGradientColor1,
      overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2,
      overlayGradientAngle,
    };
  }, [
      elements, // Now tracks all canvas elements
      backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor,
      backgroundImage, backgroundImageNaturalDimensions, backgroundImageScale, backgroundImageX, backgroundImageY,
      overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, 
      overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle,
  ]);
  
  const pushToHistory = useCallback(() => {
    const snapshot = gatherStateSnapshot();
    setHistory(prev => {
        // Prevent adding duplicate state if the last action didn't change anything
        if (prev.length > 0 && JSON.stringify(prev[prev.length - 1]) === JSON.stringify(snapshot)) {
            return prev;
        }
        const newHistory = [...prev, snapshot];
        if (newHistory.length > MAX_HISTORY_LENGTH) {
            return newHistory.slice(newHistory.length - MAX_HISTORY_LENGTH);
        }
        return newHistory;
    });
  }, [gatherStateSnapshot]);

  const handleCanvasSizeChange = useCallback(({ width, height }) => {
    console.log('handleCanvasSizeChange called with:', { width, height }); // Debug log
    console.log('Current canvas size:', { canvasWidth, canvasHeight }); // Debug log
    
    // Only save to history if it's a meaningful change
    if (Math.abs(width - canvasWidth) > 1 || Math.abs(height - canvasHeight) > 1) {
      pushToHistory(); // Save state before changing canvas size
      
      // Calculate scaling factors for existing elements
      setElements(prevElements => {
        // Avoid division by zero if canvasWidth/Height are 0, though they should ideally be initialized
        const scaleX = canvasWidth > 0 ? width / canvasWidth : 1;
        const scaleY = canvasHeight > 0 ? height / canvasHeight : 1;

        const scaledElements = prevElements.map(el => ({
          ...el,
          x: el.x * scaleX,
          y: el.y * scaleY
        }));
        console.log('Scaled elements:', scaledElements); // Debug log
        return scaledElements;
      });

      // Scale background image position if it exists
      setBackgroundImageX(prevX => canvasWidth > 0 ? prevX * (width / canvasWidth) : prevX);
      setBackgroundImageY(prevY => canvasHeight > 0 ? prevY * (height / canvasHeight) : prevY);
      
      // Update canvas dimensions
      console.log('Setting new canvas dimensions:', { width, height }); // Debug log
      setCanvasWidth(width);
      setCanvasHeight(height);
    }
  }, [canvasWidth, canvasHeight, pushToHistory]);

  const applyLockedBackground = useCallback((settings) => {
    if (settings?.backgroundControls?.locked && settings.backgroundControls.lockedSettings) {
      const locked = settings.backgroundControls.lockedSettings;
      setBackgroundType(locked.backgroundType || 'color');
      setGradientColor1(locked.gradientColor1 || '#6366f1');
      setGradientColor2(locked.gradientColor2 || '#8b5cf6');
      setGradientAngle(locked.gradientAngle || 135);
      setBackgroundColor(locked.backgroundColor || '#1e1b4b');
      setBackgroundImage(locked.backgroundImage || null);
      setBackgroundImageScale(locked.backgroundImageScale || 1.0);
      setBackgroundImageX(locked.backgroundImageX || 0);
      setBackgroundImageY(locked.backgroundImageY || 0);
      setOverlayType(locked.overlayType || 'solid');
      setOverlayColor(locked.overlayColor || '#000000');
      setOverlayOpacity(locked.overlayOpacity || 0);
      setOverlayGradientColor1(locked.overlayGradientColor1 || '#000000');
      setOverlayGradientOpacity1(locked.overlayGradientOpacity1 || 0);
      setOverlayGradientColor2(locked.overlayGradientColor2 || '#000000');
      setOverlayGradientOpacity2(locked.overlayGradientOpacity2 || 0);
      setOverlayGradientAngle(locked.overlayGradientAngle || 180);
      setShowCanvasBackgroundOverlay(false); // Hide overlay if background is locked
    }
  }, []);

  const applyLockedPageBackground = useCallback((settings) => {
    if (settings?.pageBackgroundControls?.locked && settings.pageBackgroundControls.lockedSettings) {
      const locked = settings.pageBackgroundControls.lockedSettings;
      setPageBackgroundType(locked.pageBackgroundType || 'gradient');
      setPageGradientColor1(locked.pageGradientColor1 || '#7c3aed');
      setPageGradientColor2(locked.pageGradientColor2 || '#1e40af');
      setPageBackgroundColor(locked.pageBackgroundColor || '#1e1b4b');
      setPageBackgroundImage(locked.pageBackgroundImage || null);
      setPageBackgroundScale(locked.pageBackgroundScale || 1.0);
      setPageBackgroundX(locked.pageBackgroundX || 0);
      setPageBackgroundY(locked.pageBackgroundY || 0);
    }
  }, [setPageBackgroundType, setPageGradientColor1, setPageGradientColor2, setPageBackgroundColor, setPageBackgroundImage, setPageBackgroundScale, setPageBackgroundX, setPageBackgroundY]);
  
  const handleLoadTemplate = useCallback(async (template, shouldPushToHistory = true) => {
    if (shouldPushToHistory) {
        pushToHistory(); // Save current state before loading template
    }
    
    const data = template.template_data;
    const fontSettings = adminSettings.fonts;

    // Load elements and apply font restrictions/locks
    let loadedElements = data.elements || [];
    
    loadedElements = loadedElements.map(el => {
      if (el.type === 'text') {
        let newFont = el.font;
        // Enforce allowed fonts if user font selection is disabled for them
        if (fontSettings.enabled === false) {
          if (!fontSettings.allowedFonts.includes(el.font)) {
            newFont = fontSettings.allowedFonts[0] || 'Inter'; // Fallback
          }
        }
        // Override font styles if they are locked by admin
        if (fontSettings.lockFontStyles) {
          return { 
            ...el, 
            font: fontSettings.defaultFont,
            weight: fontSettings.defaultWeight,
            size: fontSettings.defaultSize
          };
        }
        return { ...el, font: newFont };
      }
      return el;
    });

    setElements(loadedElements);
    setSelectedElementId(null);
    
    // If canvas size is locked, apply admin settings' default canvas size
    if (adminSettings?.canvasControls?.lockCanvasSize) {
      const newWidth = adminSettings.canvasControls.defaultWidth || DEFAULT_ADMIN_SETTINGS.canvasControls.defaultWidth;
      const newHeight = adminSettings.canvasControls.defaultHeight || DEFAULT_ADMIN_SETTINGS.canvasControls.defaultHeight;
      
      // Use handleCanvasSizeChange to scale existing elements (which now includes loadedElements)
      // relative to the canvas size before this template load.
      // This will also update canvasWidth/canvasHeight.
      handleCanvasSizeChange({ width: newWidth, height: newHeight });
    } else {
      // Load canvas settings from template
      setCanvasWidth(data.canvasWidth || 1500);
      setCanvasHeight(data.canvasHeight || 1500);
    }
    
    // If background is locked, don't load it from template, apply locked settings
    if (adminSettings?.backgroundControls?.locked) {
      applyLockedBackground(adminSettings);
    } else {
      // Load background settings from template
      setBackgroundType(data.backgroundType || 'color');
      setGradientColor1(data.gradientColor1 || '#6366f1');
      setGradientColor2(data.gradientColor2 || '#8b5cf6');
      setGradientAngle(data.gradientAngle || 135);
      setBackgroundColor(data.backgroundColor || '#1e1b4b');
      setBackgroundImage(data.backgroundImage || null);
      setBackgroundImageScale(data.backgroundImageScale || 1.0);
      setBackgroundImageX(data.backgroundImageX || 0);
      setBackgroundImageY(data.backgroundImageY || 0);
      
      // Load overlay settings from template
      setOverlayType(data.overlayType || 'solid');
      setOverlayColor(data.overlayColor || '#000000');
      setOverlayOpacity(data.overlayOpacity || 0);
      setOverlayGradientColor1(data.overlayGradientColor1 || '#000000');
      setOverlayGradientOpacity1(data.overlayGradientOpacity1 || 0);
      setOverlayGradientColor2(data.overlayGradientColor2 || '#000000');
      setOverlayGradientOpacity2(data.overlayGradientOpacity2 || 0);
      setOverlayGradientAngle(data.overlayGradientAngle || 180);
    }
    
    setShowCanvasBackgroundOverlay(false);
    if (shouldPushToHistory) { // Only close panel if it's a user-initiated load
      setShowTemplatesPanel(false);
    }
  }, [pushToHistory, adminSettings, applyLockedBackground, handleCanvasSizeChange, setElements, setSelectedElementId, setCanvasWidth, setCanvasHeight, setBackgroundType, setGradientColor1, setGradientColor2, setGradientAngle, setBackgroundColor, setBackgroundImage, setBackgroundImageScale, setBackgroundImageX, setBackgroundImageY, setOverlayType, setOverlayColor, setOverlayOpacity, setOverlayGradientColor1, setOverlayGradientOpacity1, setOverlayGradientColor2, setOverlayGradientOpacity2, setOverlayGradientAngle]);

  const resetCanvasState = useCallback((settings) => {
      // Clear all elements
      setElements([]);
      setSelectedElementId(null);

      // Reset Background to default (locked settings will be applied later if user is not admin)
      setBackgroundType('color');
      setGradientColor1('#6366f1');
      setGradientColor2('#8b5cf6');
      setGradientAngle(135);
      setBackgroundColor('#1e1b4b');
      setBackgroundImage(null);
      setBackgroundImageNaturalDimensions({ width: 0, height: 0 });
      setBackgroundImageScale(1.0);
      setBackgroundImageX(0);
      setBackgroundImageY(0);
      setShowCanvasBackgroundOverlay(true);
      
      // Reset Overlay
      setOverlayType('solid');
      setOverlayColor('#000000');
      setOverlayOpacity(0);
      setOverlayGradientColor1('#000000');
      setOverlayGradientOpacity1(0);
      setOverlayGradientColor2('#000000');
      setOverlayGradientOpacity2(0);
      setOverlayGradientAngle(180);

      // Reset Canvas Size
      const newWidth = settings?.canvasControls?.defaultWidth || DEFAULT_ADMIN_SETTINGS.canvasControls.defaultWidth;
      const newHeight = settings?.canvasControls?.defaultHeight || DEFAULT_ADMIN_SETTINGS.canvasControls.defaultHeight;
      setCanvasWidth(newWidth);
      setCanvasHeight(newHeight);
  }, [applyLockedBackground, setElements, setSelectedElementId, setBackgroundType, setGradientColor1, setGradientColor2, setGradientAngle, setBackgroundColor, setBackgroundImage, setBackgroundImageNaturalDimensions, setBackgroundImageScale, setBackgroundImageX, setBackgroundImageY, setShowCanvasBackgroundOverlay, setOverlayType, setOverlayColor, setOverlayOpacity, setOverlayGradientColor1, setOverlayGradientOpacity1, setOverlayGradientColor2, setOverlayGradientOpacity2, setOverlayGradientAngle, setCanvasWidth, setCanvasHeight]);


  // Load admin settings and apply them ONCE
  useEffect(() => {
    const loadAndApplyInitialSettings = async () => {
      if (initialSettingsApplied) return;

      try {
        console.log('Loading admin settings (Base44 disabled)');
        
        // Start with default settings
        let effectiveSettings = JSON.parse(JSON.stringify(DEFAULT_ADMIN_SETTINGS));
        
        // Load from localStorage only (skip Base44 API calls)
        try {
          const local = localStorage.getItem('etendy_admin_settings');
          if (local) {
            // Deep merge utility that properly handles arrays
            const deepMerge = (target, source) => {
              const output = { ...target };
              if (target && typeof target === 'object' && source && typeof source === 'object') {
                Object.keys(source).forEach(key => {
                  if (Array.isArray(source[key])) {
                    // Handle arrays explicitly - replace with source array
                    output[key] = [...source[key]];
                  } else if (source[key] && typeof source[key] === 'object' && 
                            key in target && target[key] && typeof target[key] === 'object' && 
                            !Array.isArray(target[key])) {
                    // Only merge objects, not arrays
                    output[key] = deepMerge(target[key], source[key]);
                  } else {
                    output[key] = source[key];
                  }
                });
              }
              return output;
            };

            const localSettings = JSON.parse(local);
            effectiveSettings = deepMerge(effectiveSettings, localSettings);
          }
        } catch (lsErr) {
          console.warn('Failed to load admin settings from localStorage:', lsErr);
        }

        // Ensure allowedFonts is always an array
        if (!effectiveSettings.fonts || !Array.isArray(effectiveSettings.fonts.allowedFonts)) {
          effectiveSettings.fonts = { ...DEFAULT_ADMIN_SETTINGS.fonts };
        }

        setAdminSettings(effectiveSettings);

        // --- Apply settings in order of priority: Defaults -> Admin -> User's Default Template ---

        // 0. Reset canvas to a clean state based on admin settings first
        // This will apply default canvas size and locked backgrounds/overlays
        resetCanvasState(effectiveSettings);

        // 1. (Canvas size already set by resetCanvasState)

        // 2. (Admin-locked backgrounds already applied by resetCanvasState)
        // Only page background is not part of canvas reset, so apply it here.
        if (effectiveSettings?.pageBackgroundControls?.locked) {
          applyLockedPageBackground(effectiveSettings);
        }

        // 3. Skip default template loading (Base44 disabled)
        console.log('Skipping default template loading (Base44 disabled)');
        // if (user && user.default_template_id) {
        //   try {
        //     const defaultTemplate = await Template.get(user.default_template_id);
        //     if (defaultTemplate && defaultTemplate.template_data) {
        //       // Pass false to prevent pushing to history on initial load
        //       // handleLoadTemplate will respect admin locks.
        //       await handleLoadTemplate(defaultTemplate, false); 
        //     }
        //   } catch(templateError) {
        //       console.warn("Could not load default template:", templateError);
        //   }
        // }
        
      } catch (error) {
        console.error('Failed to load admin settings:', error);
        setIsAdmin(false);
        setCurrentUser(null); // No user if it fails
        
        // Try to load from localStorage on total failure
        let effectiveSettings = JSON.parse(JSON.stringify(DEFAULT_ADMIN_SETTINGS));
        try {
          const local = localStorage.getItem('etendy_admin_settings');
          if (local) {
            const localSettings = JSON.parse(local);
            const deepMerge = (target, source) => {
              const output = { ...target };
              if (target && typeof target === 'object' && source && typeof source === 'object') {
                Object.keys(source).forEach(key => {
                  if (Array.isArray(source[key])) {
                    output[key] = [...source[key]];
                  } else if (source[key] && typeof source[key] === 'object' && key in target && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                    output[key] = deepMerge(target[key], source[key]);
                  } else {
                    output[key] = source[key];
                  }
                });
              }
              return output;
            };
            effectiveSettings = deepMerge(effectiveSettings, localSettings);
          }
        } catch (lsErr) {
          console.warn('Failed to parse admin settings from localStorage:', lsErr);
        }
        setAdminSettings(effectiveSettings);
        setAdminSettingsLoaded(true);
        // Apply canvas state using fallback
        resetCanvasState(effectiveSettings);
      } finally {
        setInitialSettingsApplied(true);
      }
    };
    
    loadAndApplyInitialSettings();
  }, [initialSettingsApplied, applyLockedBackground, applyLockedPageBackground, handleLoadTemplate, resetCanvasState]);

  // This useEffect now handles updates from the AdminPanel, not initial load
  useEffect(() => {
    if (!initialSettingsApplied) return; // Don't run on initial load

    // Only apply locked settings to regular users, not admins
    if (!isAdmin) {
      if (adminSettings?.backgroundControls?.locked) {
        applyLockedBackground(adminSettings);
      } else {
        // If background is unlocked, ensure the overlay is shown
        setShowCanvasBackgroundOverlay(true);
      }
      
      if (adminSettings?.pageBackgroundControls?.locked) {
        applyLockedPageBackground(adminSettings);
      } else {
        // If page background becomes unlocked, reset to default user-controlled state
        setPageBackgroundType('gradient');
        setPageGradientColor1('#7c3aed');
        setPageGradientColor2('#1e40af');
        setPageBackgroundColor('#1e1b4b');
        setPageBackgroundImage(null);
        setPageBackgroundScale(1.0);
        setPageBackgroundX(0);
        setPageBackgroundY(0);
      }
    }
    
    // FIXED: Only apply admin canvas size if canvas size is LOCKED
    if (adminSettings?.canvasControls?.lockCanvasSize && 
        adminSettings?.canvasControls?.defaultWidth && 
        adminSettings?.canvasControls?.defaultHeight) {
      const newWidth = adminSettings.canvasControls.defaultWidth;
      const newHeight = adminSettings.canvasControls.defaultHeight;
      // Only apply if there's a significant difference to avoid unnecessary re-renders or history entries
      if (Math.abs(newWidth - canvasWidth) > 1 || Math.abs(newHeight - canvasHeight) > 1) {
        handleCanvasSizeChange({ width: newWidth, height: newHeight });
      }
    }
  }, [adminSettings, isAdmin, initialSettingsApplied, applyLockedBackground, applyLockedPageBackground, handleCanvasSizeChange, canvasWidth, canvasHeight, setPageBackgroundType, setPageGradientColor1, setPageGradientColor2, setPageBackgroundColor, setPageBackgroundImage, setPageBackgroundScale, setPageBackgroundX, setPageBackgroundY]);

  // Apply locked settings to regular users after initial load
  useEffect(() => {
    if (!initialSettingsApplied) return;
    
    // Only apply locked settings to regular users on initial load
    if (!isAdmin) {
      if (adminSettings?.backgroundControls?.locked) {
        applyLockedBackground(adminSettings);
      }
      if (adminSettings?.pageBackgroundControls?.locked) {
        applyLockedPageBackground(adminSettings);
      }
    }
  }, [initialSettingsApplied, isAdmin, adminSettings, applyLockedBackground, applyLockedPageBackground]);

  // Persist admin settings locally whenever they change (helps persistence in demo mode)
  // Guarded to avoid overwriting stored values with defaults during initial load
  useEffect(() => {
    if (!initialSettingsApplied || !adminSettingsLoaded) return;
    try {
      localStorage.setItem('etendy_admin_settings', JSON.stringify(adminSettings));
      console.log('Admin settings persisted to localStorage');
    } catch (e) {
      console.warn('Failed to persist admin settings to localStorage:', e);
    }
  }, [adminSettings, initialSettingsApplied, adminSettingsLoaded]);

  const saveAdminSettings = useCallback(async () => {
    // Save to localStorage only (Base44 disabled)
    console.log('🔥 Save Settings button clicked!');
    setIsSavingAdminSettings(true);
    try {
      console.log('Saving admin settings to localStorage (Base44 disabled)');
      console.log('Settings to save:', adminSettings);
      localStorage.setItem('etendy_admin_settings', JSON.stringify(adminSettings));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings locally:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSavingAdminSettings(false);
    }
  }, [adminSettings]);
  // Handle admin settings changes and apply locked settings immediately
  const handleAdminSettingsChange = useCallback((newSettings) => {
    const prevSettings = adminSettings;
    console.log('🔄 ADMIN SETTINGS CHANGE RECEIVED:', { prevSettings, newSettings });
    console.log('📊 Checking pageBackgroundControls:', newSettings?.pageBackgroundControls);

    // If page background lock is being enabled for the first time, initialize with current state
    if (!prevSettings?.pageBackgroundControls?.locked && newSettings?.pageBackgroundControls?.locked && !newSettings?.pageBackgroundControls?.lockedSettings) {
      newSettings = {
        ...newSettings,
        pageBackgroundControls: {
          ...newSettings.pageBackgroundControls,
          lockedSettings: {
            pageBackgroundType: pageBackgroundType,
            pageBackgroundColor: pageBackgroundColor,
            pageGradientColor1: pageGradientColor1,
            pageGradientColor2: pageGradientColor2,
            pageBackgroundImage: pageBackgroundImage,
            pageBackgroundScale: pageBackgroundScale,
            pageBackgroundX: pageBackgroundX,
            pageBackgroundY: pageBackgroundY,
          }
        }
      };
    }

    // If canvas background lock is being enabled for the first time, initialize with current state
    if (!prevSettings?.backgroundControls?.locked && newSettings?.backgroundControls?.locked && !newSettings?.backgroundControls?.lockedSettings) {
      newSettings = {
        ...newSettings,
        backgroundControls: {
          ...newSettings.backgroundControls,
          lockedSettings: {
            backgroundType: backgroundType,
            backgroundColor: backgroundColor,
            gradientColor1: gradientColor1,
            gradientColor2: gradientColor2,
            gradientAngle: gradientAngle,
            backgroundImage: backgroundImage,
            backgroundImageScale: backgroundImageScale,
            backgroundImageX: backgroundImageX,
            backgroundImageY: backgroundImageY,
            overlayType: overlayType,
            overlayColor: overlayColor,
            overlayOpacity: overlayOpacity,
            overlayGradientColor1: overlayGradientColor1,
            overlayGradientOpacity1: overlayGradientOpacity1,
            overlayGradientColor2: overlayGradientColor2,
            overlayGradientOpacity2: overlayGradientOpacity2,
            overlayGradientAngle: overlayGradientAngle,
          }
        }
      };
    }

    setAdminSettings(newSettings);

    // Only apply locked settings if they exist and have actual values
    const pageBackgroundLockChanged = prevSettings?.pageBackgroundControls?.locked !== newSettings?.pageBackgroundControls?.locked;
    const pageBackgroundSettingsChanged = JSON.stringify(prevSettings?.pageBackgroundControls?.lockedSettings) !== JSON.stringify(newSettings?.pageBackgroundControls?.lockedSettings);

    const canvasBackgroundLockChanged = prevSettings?.backgroundControls?.locked !== newSettings?.backgroundControls?.locked;
    const canvasBackgroundSettingsChanged = JSON.stringify(prevSettings?.backgroundControls?.lockedSettings) !== JSON.stringify(newSettings?.backgroundControls?.lockedSettings);

    // Apply locked settings only for non-admin users
    if (!isAdmin) {
      // Apply page background if locked and settings exist
      if (newSettings?.pageBackgroundControls?.locked && newSettings?.pageBackgroundControls?.lockedSettings && (pageBackgroundLockChanged || pageBackgroundSettingsChanged)) {
        applyLockedPageBackground(newSettings);
      }

      // Apply canvas background if locked and settings exist
      if (newSettings?.backgroundControls?.locked && newSettings?.backgroundControls?.lockedSettings && (canvasBackgroundLockChanged || canvasBackgroundSettingsChanged)) {
        applyLockedBackground(newSettings);
      }
    }
  }, [adminSettings, isAdmin, applyLockedPageBackground, applyLockedBackground, pageBackgroundType, pageBackgroundColor, pageGradientColor1, pageGradientColor2, pageBackgroundImage, pageBackgroundScale, pageBackgroundX, pageBackgroundY, backgroundType, backgroundColor, gradientColor1, gradientColor2, gradientAngle, backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY, overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle, setPageBackgroundType, setPageBackgroundColor, setPageGradientColor1, setPageGradientColor2, setPageBackgroundImage, setBackgroundType, setBackgroundColor, setGradientColor1, setGradientColor2, setBackgroundImage]);
  
  // REMOVED handleLockBackground and handleUnlockBackground as they are replaced by controls in AdminPanel

  // --- Element Management Functions ---
  const updateElement = (id, props) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...props } : el));
  };
  
  const addElement = (newElement) => {
    pushToHistory();
    const elementWithId = { ...newElement, id: crypto.randomUUID(), blur: 0 }; // Add blur property
    setElements(prev => [...prev, elementWithId]);
    setSelectedElementId(elementWithId.id); // Automatically select newly added element
  };
  
  const removeElement = useCallback((id) => {
    pushToHistory();
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [pushToHistory, selectedElementId]); // Wrap in useCallback with dependencies
  
  const moveLayer = (id, direction) => {
    console.log('🔼 Move layer:', { id, direction });
    pushToHistory();
    setElements(prev => {
      const index = prev.findIndex(el => el.id === id);
      if (index === -1) return prev;
      
      let newElements = [...prev];
      const [movedElement] = newElements.splice(index, 1);
      
      // Fix the direction logic - 'up' means higher in the layer stack (towards end of array)
      // 'down' means lower in the layer stack (towards beginning of array)
      const newIndex = direction === 'up' 
                       ? Math.min(index + 1, newElements.length) 
                       : Math.max(index - 1, 0);
      
      newElements.splice(newIndex, 0, movedElement);
      console.log('✅ Layer moved. New order:', newElements.map(el => ({ id: el.id, type: el.type })));
      return newElements;
    });
  };

  const handleReorderLayers = useCallback((draggedId, targetId, placeAfter = true) => {
    console.log('🔄 Layer reorder:', { draggedId, targetId, placeAfter });
    if (!draggedId || !targetId || draggedId === targetId) return;
    pushToHistory();
    setElements(prev => {
      const fromIndex = prev.findIndex(el => el.id === draggedId);
      const targetIndex = prev.findIndex(el => el.id === targetId);
      
      if (fromIndex === -1 || targetIndex === -1) return prev;

      const list = [...prev];
      const [dragged] = list.splice(fromIndex, 1);

      // Recalculate target index after removal
      const newTargetIndex = targetIndex > fromIndex ? targetIndex - 1 : targetIndex;
      
      // Insert position
      const insertIndex = placeAfter ? newTargetIndex + 1 : newTargetIndex;
      
      list.splice(insertIndex, 0, dragged);
      
      console.log('✅ Layer reorder complete. New order:', list.map(el => ({ id: el.id, type: el.type })));
      return list;
    });
  }, [pushToHistory, setElements]);

  const handleElementSelection = useCallback((elementId) => {
    if (!elementId) {
      setSelectedElementId(null);
      return;
    }
    
    // Only push to history if the selection is actually changing, or if selecting a new element
    if (selectedElementId !== elementId) {
        pushToHistory();
    }

    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    setSelectedElementId(elementId);
    
    // Navigate to the appropriate panel based on element type
    if (element.type === 'image') {
      setActiveControlPanel('image');
    } else if (element.type === 'text') {
      setActiveControlPanel('text');
    } else if (element.type === 'logo' || element.type === 'shape') {
      setActiveControlPanel('elements');
    }
  }, [elements, pushToHistory, selectedElementId, setActiveControlPanel]);

  // Add keydown listener for deleting elements (now AFTER removeElement is defined)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't delete if user is typing in an input, textarea, or content-editable field
      const activeElement = document.activeElement;
      const isTyping = activeElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(activeElement.tagName);

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && !isTyping) {
        e.preventDefault(); // Prevent browser back navigation on backspace
        removeElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, removeElement]); // useEffect dependencies are now correct

  const restoreState = (stateToRestore) => {
    if (!stateToRestore) return;
    setElements(stateToRestore.elements); // Restore all elements
    setBackgroundType(stateToRestore.backgroundType);
    setGradientColor1(stateToRestore.gradientColor1);
    setGradientColor2(stateToRestore.gradientColor2);
    setGradientAngle(stateToRestore.gradientAngle);
    setBackgroundColor(stateToRestore.backgroundColor);
    setBackgroundImage(stateToRestore.backgroundImage);
    setBackgroundImageNaturalDimensions(stateToRestore.backgroundImageNaturalDimensions);
    setBackgroundImageScale(stateToRestore.backgroundImageScale);
    setBackgroundImageX(stateToRestore.backgroundImageX);
    setBackgroundImageY(stateToRestore.backgroundImageY);
    setOverlayType(stateToRestore.overlayType);
    setOverlayColor(stateToRestore.overlayColor);
    setOverlayOpacity(stateToRestore.overlayOpacity);
    setOverlayGradientColor1(stateToRestore.overlayGradientColor1);
    setOverlayGradientOpacity1(stateToRestore.overlayGradientOpacity1);
    setOverlayGradientColor2(stateToRestore.overlayGradientColor2);
    setOverlayGradientOpacity2(stateToRestore.overlayGradientOpacity2);
    setOverlayGradientAngle(stateToRestore.overlayGradientAngle);
    setSelectedElementId(null); // Clear selected element after undo/restore
  };
  
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    restoreState(lastState);
    setHistory(prev => prev.slice(0, -1));
  }, [history]);


  const handleCanvasReset = useCallback(() => {
    if (window.confirm("Are you sure you want to reset the canvas? This will clear all text, images, and background settings.")) {
      // It's good practice to save the state *before* a major destructive action like reset
      pushToHistory(); 

      // Reset canvas state using the new unified function
      resetCanvasState(adminSettings);

      // Page background reset is not part of resetCanvasState, handle here
      // If page background is not locked, reset it to default user-controlled state
      if (!adminSettings?.pageBackgroundControls?.locked) {
        setPageBackgroundType('gradient');
        setPageGradientColor1('#7c3aed');
        setPageGradientColor2('#1e40af');
        setPageBackgroundColor('#1e1b4b');
        setPageBackgroundImage(null);
        setPageBackgroundScale(1.0);
        setPageBackgroundX(0);
        setPageBackgroundY(0);
      }
    }
  }, [pushToHistory, adminSettings, resetCanvasState, setPageBackgroundType, setPageGradientColor1, setPageGradientColor2, setPageBackgroundColor, setPageBackgroundImage, setPageBackgroundScale, setPageBackgroundX, setPageBackgroundY]);

  const loadGallery = useCallback(async () => {
    setIsLoadingGallery(true);
    try {
      console.log('Loading gallery from localStorage only (Base44 disabled)');
      // Skip API call, load from localStorage only
      const localGallery = JSON.parse(localStorage.getItem('etendy_gallery') || '[]');
      setGalleryImages(localGallery);
    } catch (error) {
      console.error('Failed to load gallery from localStorage:', error);
      setGalleryImages([]);
    } finally {
      setIsLoadingGallery(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      console.log('Loading templates from localStorage only (Base44 disabled)');
      // Skip API call, load from localStorage only
      const localTemplates = JSON.parse(localStorage.getItem('etendy_templates') || '[]');
      setTemplates(localTemplates);
    } catch (error) {
      console.error('Failed to load templates from localStorage:', error);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    loadGallery();
    loadTemplates();
  }, [loadGallery, loadTemplates]);

  const handlePhotoUpload = useCallback((fileData) => {
    pushToHistory();
    // Remove existing main photo if any
    const newElements = elements.filter(el => el.type !== 'image');
    if (fileData) {
        const newImage = {
            id: fileData.id || crypto.randomUUID(),
            type: 'image',
            src: fileData.src || fileData.url, // Accept either src or url
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            scale: Math.min(canvasWidth / fileData.width, canvasHeight / fileData.height) * 0.5,
            naturalWidth: fileData.width,
            naturalHeight: fileData.height,
            crop: { x: 0, y: 0, width: fileData.width, height: fileData.height },
            borderRadius: 0,
            borderWidth: 0,
            borderColor: '#ffffff',
            borderType: 'solid',
            borderGradient1: '#6366f1',
            borderGradient2: '#8b5cf6',
            opacity: 1, // Added opacity
            blur: 0,
            rotation: 0,
        };
        setElements([...newElements, newImage]);
        setSelectedElementId(newImage.id);
        setIsCropping(false); // Ensure cropping is turned off when new image is uploaded
    } else {
        setElements(newElements);
        setIsCropping(false); // Also turn off cropping when image is removed
    }
  }, [canvasWidth, canvasHeight, pushToHistory, elements]);

  const handleLogoUpload = useCallback((fileData) => {
    pushToHistory();
    // Remove existing logo if any
    const newElements = elements.filter(el => el.type !== 'logo');
    if (fileData) {
        const newLogo = {
            id: crypto.randomUUID(),
            type: 'logo',
            src: fileData.url,
            x: canvasWidth * 0.8, // Default position for logo
            y: canvasHeight * 0.2,
            scale: 0.3,
            naturalWidth: fileData.width,
            naturalHeight: fileData.height,
            borderRadius: 0,
            borderWidth: 0,
            borderColor: '#ffffff',
            borderType: 'solid',
            borderGradient1: '#6366f1',
            borderGradient2: '#8b5cf6',
            opacity: 1, // Added opacity
            blur: 0,
        };
        setElements([...newElements, newLogo]);
        setSelectedElementId(newLogo.id);
    } else {
        setElements(newElements);
    }
  }, [canvasWidth, canvasHeight, pushToHistory, elements]);
  
  const handleGalleryPanelToggle = () => {
    setShowGalleryPanel(!showGalleryPanel);
    if(showGalleryDot) {
        setShowGalleryDot(false);
    }
    if(!showGalleryPanel && galleryImages.length === 0 && !isLoadingGallery) {
        loadGallery();
    }
  };
  
  const handleLayersPanelToggle = () => {
    setShowLayersPanel(!showLayersPanel);
  };

  const handleTemplatesPanelToggle = () => {
    setShowTemplatesPanel(!showTemplatesPanel);
  };

  const handleBackgroundChange = useCallback(() => {
    if (showCanvasBackgroundOverlay) {
      setShowCanvasBackgroundOverlay(false);
    }
  }, [showCanvasBackgroundOverlay]);
  
  const handleSelectGalleryImage = useCallback((image) => {
    pushToHistory(); 
    setBackgroundImage(image ? image.image_url : null);
    setBackgroundType('image'); 
    
    if (image) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setBackgroundImageNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setBackgroundImageScale(1.0); 
        setBackgroundImageX(0);
        setBackgroundImageY(0);
      };
      img.src = image.image_url;
    } else {
        setBackgroundImageNaturalDimensions({ width: 0, height: 0 });
    }
    handleBackgroundChange();
  }, [setBackgroundImage, setBackgroundType, setBackgroundImageNaturalDimensions, setBackgroundImageScale, setBackgroundImageX, setBackgroundImageY, handleBackgroundChange, pushToHistory]);

  const drawFinalImage = useCallback(async (ctx) => {
    await document.fonts.ready;
    
    // Draw Background
    if (backgroundType === 'image' && backgroundImage) {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous'; 
      await new Promise((resolve) => {
        bgImg.onload = () => {
          const naturalWidth = bgImg.naturalWidth || bgImg.width;
          const naturalHeight = bgImg.naturalHeight || bgImg.height;
          const scaledWidth = naturalWidth * backgroundImageScale;
          const scaledHeight = naturalHeight * backgroundImageScale;
          ctx.drawImage(bgImg, backgroundImageX, backgroundImageY, scaledWidth, scaledHeight);
          resolve();
        };
        bgImg.onerror = () => {
          console.error("Failed to load background image:", backgroundImage);
          resolve();
        };
        bgImg.src = backgroundImage;
      });
    } else if (backgroundType === 'color') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else { // Gradient background
      const angleRad = (gradientAngle * Math.PI) / 180;
      const length = Math.abs(canvasWidth * Math.cos(angleRad)) + Math.abs(canvasHeight * Math.sin(angleRad));
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      
      const x0 = centerX - (Math.cos(angleRad) * length) / 2;
      const y0 = centerY - (Math.sin(angleRad) * length) / 2;
      const x1 = centerX + (Math.cos(angleRad) * length) / 2;
      const y1 = centerY + (Math.sin(angleRad) * length) / 2;

      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.addColorStop(0, gradientColor1);
      gradient.addColorStop(1, gradientColor2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    
    // Draw Overlay
    if (overlayType === 'solid' && overlayOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = overlayOpacity;
      ctx.fillStyle = overlayColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    } else if (overlayType === 'gradient' && (overlayGradientOpacity1 > 0 || overlayGradientOpacity2 > 0)) {
      ctx.save();

      const angleRad = (overlayGradientAngle * Math.PI) / 180;
      const length = Math.abs(canvasWidth * Math.cos(angleRad)) + Math.abs(canvasHeight * Math.sin(angleRad));
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      
      const x0 = centerX - (Math.cos(angleRad) * length) / 2;
      const y0 = centerY - (Math.sin(angleRad) * length) / 2;
      const x1 = centerX + (Math.cos(angleRad) * length) / 2;
      const y1 = centerY + (Math.sin(angleRad) * length) / 2;

      const overlayGradient = ctx.createLinearGradient(x0, y0, x1, y1);

      const toHexAlpha = (opacity) => Math.round(opacity * 255).toString(16).padStart(2, '0');
      const color1WithAlpha = overlayGradientColor1 + toHexAlpha(overlayGradientOpacity1);
      const color2WithAlpha = overlayGradientColor2 + toHexAlpha(overlayGradientOpacity2);
      
      overlayGradient.addColorStop(0, color1WithAlpha);
      overlayGradient.addColorStop(1, color2WithAlpha);
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    }
    
    // Draw Elements (Images, Text, Shapes)
    for (const el of elements) {
      ctx.save();
      
      // Apply blur if specified
      if (el.blur && el.blur > 0) {
        ctx.filter = `blur(${el.blur}px)`;
      }
      
      // Apply opacity if specified
      if (el.opacity !== undefined) {
        ctx.globalAlpha = el.opacity;
      }
      
      if (el.type === 'image' || el.type === 'logo') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise(resolve => {
          img.onload = () => {
            const isImage = el.type === 'image';
            const crop = isImage ? el.crop : { x: 0, y: 0, width: el.naturalWidth, height: el.naturalHeight };

            const scaledWidth = crop.width * el.scale;
            const scaledHeight = crop.height * el.scale;
            const halfW = scaledWidth / 2;
            const halfH = scaledHeight / 2;
            const borderRadius = Math.min(el.borderRadius || 0, halfW, halfH);
            const rotation = Number(el.rotation || 0);

            ctx.save();
            ctx.translate(el.x, el.y);
            if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);

            if (borderRadius > 0) {
              ctx.beginPath();
              ctx.moveTo(-halfW + borderRadius, -halfH);
              ctx.lineTo(halfW - borderRadius, -halfH);
              ctx.quadraticCurveTo(halfW, -halfH, halfW, -halfH + borderRadius);
              ctx.lineTo(halfW, halfH - borderRadius);
              ctx.quadraticCurveTo(halfW, halfH, halfW - borderRadius, halfH);
              ctx.lineTo(-halfW + borderRadius, halfH);
              ctx.quadraticCurveTo(-halfW, halfH, -halfW, halfH - borderRadius);
              ctx.lineTo(-halfW, -halfH + borderRadius);
              ctx.quadraticCurveTo(-halfW, -halfH, -halfW + borderRadius, -halfH);
              ctx.closePath();
              ctx.clip();
            }

            ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, -halfW, -halfH, scaledWidth, scaledHeight);

            if (el.borderWidth > 0) {
              ctx.beginPath();
              ctx.moveTo(-halfW + borderRadius, -halfH);
              ctx.lineTo(halfW - borderRadius, -halfH);
              ctx.quadraticCurveTo(halfW, -halfH, halfW, -halfH + borderRadius);
              ctx.lineTo(halfW, halfH - borderRadius);
              ctx.quadraticCurveTo(halfW, halfH, halfW - borderRadius, halfH);
              ctx.lineTo(-halfW + borderRadius, halfH);
              ctx.quadraticCurveTo(-halfW, halfH, -halfW, halfH - borderRadius);
              ctx.lineTo(-halfW, -halfH + borderRadius);
              ctx.quadraticCurveTo(-halfW, -halfH, -halfW + borderRadius, -halfH);
              ctx.closePath();
              ctx.lineWidth = el.borderWidth;
              if (el.borderType === 'gradient') {
                const gradient = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
                gradient.addColorStop(0, el.borderGradient1);
                gradient.addColorStop(1, el.borderGradient2);
                ctx.strokeStyle = gradient;
              } else {
                ctx.strokeStyle = el.borderColor;
              }
              ctx.stroke();
            }
            ctx.restore();
            resolve();
          };
          img.onerror = () => { console.error(`Failed to load ${el.type}:`, el.src); resolve(); };
          img.src = el.src;
        });
      } else if (el.type === 'text') {
        const applyTextTransform = (text, transform) => {
            if (transform === 'uppercase') return text.toUpperCase();
            if (transform === 'capitalize') return text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            return text;
        }

        const rotation = Number(el.rotation || 0);
        ctx.font = `${el.style} ${el.weight} ${el.size}px "${el.font}", Arial, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.textAlign = el.textAlign || 'left'; // Use element's text alignment

        const transformedText = applyTextTransform(el.content, el.transform);
        const textLines = transformedText.split('\n');
        const lineHeight = el.size * (el.lineHeight || 1.2); // Use element's line height
        
        // Measure text width for gradient sizing if needed
        let maxLineWidth = 0;
        textLines.forEach(line => {
          const metrics = ctx.measureText(line);
          maxLineWidth = Math.max(maxLineWidth, metrics.width);
        });

        if (el.colorType === 'gradient') {
            const gradient = ctx.createLinearGradient(el.x, el.y, el.x + maxLineWidth, el.y + textLines.length * lineHeight);
            gradient.addColorStop(0, el.color1);
            gradient.addColorStop(1, el.color2);
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = el.color1;
        }
        
        ctx.save();
        ctx.translate(el.x, el.y);
        if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
        // Draw each line relative to origin after rotation
        textLines.forEach((line, index) => {
            ctx.fillText(line, 0, index * lineHeight);
        });
        ctx.restore();
      } else if (el.type === 'shape') {
          const { shapeType, x, y, width, height, colorType, color1, color2, borderRadius, fillType, strokeWidth, spikes, rotation = 0 } = el;
          
          // Apply rotation for shapes
          if (rotation !== 0) {
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-(x + width / 2), -(y + height / 2));
          }
          
          if (colorType === 'gradient') {
              const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
              gradient.addColorStop(0, color1);
              gradient.addColorStop(1, color2);
              ctx.fillStyle = gradient;
              ctx.strokeStyle = gradient;
          } else {
              ctx.fillStyle = color1;
              ctx.strokeStyle = color1;
          }

          if (shapeType === 'rectangle') {
              const radii = typeof borderRadius === 'number' 
                ? { tl: borderRadius, tr: borderRadius, br: borderRadius, bl: borderRadius } 
                : { tl: 0, tr: 0, br: 0, bl: 0, ...borderRadius };
              
              ctx.beginPath();
              ctx.moveTo(x + radii.tl, y);
              ctx.lineTo(x + width - radii.tr, y);
              ctx.arcTo(x + width, y, x + width, y + radii.tr, radii.tr);
              ctx.lineTo(x + width, y + height - radii.br);
              ctx.arcTo(x + width, y + height, x + width - radii.br, y + height, radii.br);
              ctx.lineTo(x + radii.bl, y + height);
              ctx.arcTo(x, y + height, x, y + height - radii.bl, radii.bl);
              ctx.lineTo(x, y + radii.tl);
              ctx.arcTo(x, y, x + radii.tl, y, radii.tl);
              ctx.closePath();
          } else if (shapeType === 'circle') {
              ctx.beginPath();
              // Draw as ellipse to respect non-proportional scaling
              ctx.ellipse(x + width / 2, y + height / 2, Math.max(0, width / 2), Math.max(0, height / 2), 0, 0, Math.PI * 2);
              ctx.closePath();
          } else if (shapeType === 'line') {
              ctx.lineWidth = strokeWidth || 4;
              ctx.beginPath();
              ctx.moveTo(x, y + height / 2);
              ctx.lineTo(x + width, y + height / 2);
              ctx.stroke();
              // Lines are always strokes, skip fill/outline logic below
              ctx.restore(); // Restore context state after this element
              continue; // Move to the next element
          } else if (shapeType === 'star') {
              const centerX = x + width / 2;
              const centerY = y + height / 2;
              const outerRadius = width / 2;
              const innerRadius = height / 4;
              let rot = Math.PI / 2 * 3; // Start from top
              let step = Math.PI / (spikes || 5);
              
              ctx.beginPath();
              ctx.moveTo(centerX, centerY - outerRadius); // Top point
              for (let i = 0; i < (spikes || 5); i++) {
                  ctx.lineTo(centerX + Math.cos(rot) * outerRadius, centerY + Math.sin(rot) * outerRadius);
                  rot += step;
                  ctx.lineTo(centerX + Math.cos(rot) * innerRadius, centerY + Math.sin(rot) * innerRadius);
                  rot += step;
              }
              ctx.lineTo(centerX, centerY - outerRadius); // Close path to start
              ctx.closePath();
          }
          
          if (fillType === 'fill') {
              ctx.fill();
          } else { // outline
              ctx.lineWidth = strokeWidth || 2;
              ctx.stroke();
          }
      }
      ctx.restore(); // Restore context state after this element
    }
  }, [
    elements, canvasWidth, canvasHeight, backgroundType, backgroundImage, backgroundColor, gradientColor1, gradientColor2, gradientAngle,
    overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle,
    backgroundImageScale, backgroundImageX, backgroundImageY 
  ]);

  const handleSaveTemplate = useCallback(async (templateName) => {
    setIsSavingTemplate(true);
    try {
      // Create thumbnail
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasWidth;
      exportCanvas.height = canvasHeight;
      const ctx = exportCanvas.getContext('2d');
      await drawFinalImage(ctx);
      
      const blob = await new Promise(resolve => exportCanvas.toBlob(resolve, 'image/jpeg', 0.6)); // Reduced quality to 0.6 for faster uploads
      if (!blob) {
        throw new Error("Failed to create thumbnail.");
      }

      // Create a smaller file name to reduce potential issues
      const timestamp = Date.now();
      const file = new File([blob], `template-${timestamp}.jpg`, { type: 'image/jpeg' });

      // Add timeout and retry logic
      let uploadResult;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          // Add a timeout promise
          const uploadPromise = UploadFile({ file });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout')), 30000) // 30 second timeout
          );
          
          uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
          break; // If successful, break out of retry loop
        } catch (error) {
          console.log(`Template upload attempt ${attempts} failed:`, error.message);
          if (attempts === maxAttempts) {
            throw new Error(`Template upload failed after ${maxAttempts} attempts. ${error.message.includes('timeout') || error.message.includes('DatabaseTimeout') ? 'The server is experiencing high load. Please try again in a few moments.' : error.message}`);
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        }
      }

      if (!uploadResult || !uploadResult.file_url) {
        throw new Error("Failed to get file URL from upload.");
      }

      // Save template data with retry logic
      const templateData = {
        elements: JSON.parse(JSON.stringify(elements)),
        canvasWidth,
        canvasHeight,
        backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor,
        backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY,
        overlayType, overlayColor, overlayOpacity, overlayGradientColor1,
        overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2,
        overlayGradientAngle,
      };

      // Retry template creation
      attempts = 0;
      while (attempts < maxAttempts) {
        try {
          attempts++;
          await Template.create({
            name: templateName,
            thumbnail_url: uploadResult.file_url,
            template_data: templateData
          });
          break; // If successful, break out of retry loop
        } catch (error) {
          console.log(`Template save attempt ${attempts} failed:`, error.message);
          if (attempts === maxAttempts) {
            throw new Error(`Template save failed after ${maxAttempts} attempts. ${error.message.includes('DatabaseTimeout') ? 'Database is experiencing high load. Please try again in a few moments.' : error.message}`);
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      await loadTemplates();
      setShowTemplatesPanel(true);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2500); // Changed to show for 2.5s
    } catch (error) {
      console.warn('Template save via API failed, saving to localStorage instead:', error);
      try {
        // Build template data and thumbnail via dataURL fallback
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvasWidth;
        exportCanvas.height = canvasHeight;
        const ctx = exportCanvas.getContext('2d');
        await drawFinalImage(ctx);
        const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.6);

        const templateData = {
          elements: JSON.parse(JSON.stringify(elements)),
          canvasWidth,
          canvasHeight,
          backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor,
          backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY,
          overlayType, overlayColor, overlayOpacity, overlayGradientColor1,
          overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2,
          overlayGradientAngle,
        };
        const localTemplate = {
          id: crypto.randomUUID(),
          name: templateName,
          thumbnail_url: dataUrl,
          template_data: templateData,
          created_date: new Date().toISOString(),
        };
        const local = JSON.parse(localStorage.getItem('etendy_templates') || '[]');
        const updated = [localTemplate, ...local];
        localStorage.setItem('etendy_templates', JSON.stringify(updated));
        setTemplates(updated);
        setShowTemplatesPanel(true);
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2500);
      } catch (lsError) {
        console.error('Failed to save template locally:', lsError);
        setSaveErrorMessage('Failed to save template. Please try again.');
        setShowSaveError(true);
        setTimeout(() => setShowSaveError(false), 5000);
      }
    } finally {
      setIsSavingTemplate(false);
    }
  }, [elements, canvasWidth, canvasHeight, backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor, backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY, overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle, loadTemplates, drawFinalImage]);

  const handleDeleteTemplate = useCallback(async (templateId) => {
    try {
      await Template.delete(templateId);
      await loadTemplates();
      // If the deleted template was the user's default, unset it
      if (currentUser?.default_template_id === templateId) {
        await User.updateMyUserData({ default_template_id: null });
        setCurrentUser(prev => ({ ...prev, default_template_id: null }));
      }
    } catch (error) {
      console.warn('Failed to delete template via API. Deleting from localStorage instead:', error);
      try {
        const local = JSON.parse(localStorage.getItem('etendy_templates') || '[]');
        const updated = local.filter(t => t.id !== templateId);
        localStorage.setItem('etendy_templates', JSON.stringify(updated));
        setTemplates(updated);
      } catch (lsErr) {
        console.error('Failed to delete template locally:', lsErr);
        setSaveErrorMessage('Failed to delete template. Please try again.');
        setShowSaveError(true);
        setTimeout(() => setShowSaveError(false), 5000);
      }
    }
  }, [loadTemplates, currentUser]);

  const handleSetDefaultTemplate = useCallback(async (templateId) => {
    if (!currentUser) return;
    try {
        await User.updateMyUserData({ default_template_id: templateId });
        setCurrentUser(prev => ({...prev, default_template_id: templateId }));
        alert("Default preset updated!");
    } catch(error) {
        console.error("Failed to set default template:", error);
        alert("Could not set default preset. Please try again.");
    }
  }, [currentUser]);

  const handleSaveCurrentAsMyPreset = useCallback(async () => {
    if (!currentUser) return;
    
    const presetName = prompt("Enter a name for your preset:");
    if (!presetName || !presetName.trim()) return;
    
    setIsSavingTemplate(true); // Re-use the template saving spinner
    try {
      // Create thumbnail
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasWidth;
      exportCanvas.height = canvasHeight;
      const ctx = exportCanvas.getContext('2d');
      await drawFinalImage(ctx);
      
      const blob = await new Promise(resolve => exportCanvas.toBlob(resolve, 'image/jpeg', 0.6));
      if (!blob) {
        throw new Error("Failed to create thumbnail.");
      }

      const timestamp = Date.now();
      const file = new File([blob], `preset-${timestamp}.jpg`, { type: 'image/jpeg' });

      // Add timeout and retry logic
      let uploadResult;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          const uploadPromise = UploadFile({ file });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout')), 30000)
          );
          uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
          break;
        } catch (error) {
          console.log(`Preset upload attempt ${attempts} failed:`, error.message);
          if (attempts === maxAttempts) {
            throw new Error(`Preset upload failed. ${error.message.includes('timeout') || error.message.includes('DatabaseTimeout') ? 'The server is busy. Please try again.' : error.message}`);
          }
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        }
      }

      if (!uploadResult || !uploadResult.file_url) {
        throw new Error("Failed to get file URL from upload.");
      }

      // Save template data
      const templateData = {
        elements: JSON.parse(JSON.stringify(elements)),
        canvasWidth,
        canvasHeight,
        backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor,
        backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY,
        overlayType, overlayColor, overlayOpacity, overlayGradientColor1,
        overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2,
        overlayGradientAngle,
      };

      // Create the template with retry logic
      let newTemplate;
      attempts = 0;
      while (attempts < maxAttempts) {
        try {
          attempts++;
          newTemplate = await Template.create({
            name: presetName.trim(),
            thumbnail_url: uploadResult.file_url,
            template_data: templateData
          });
          break;
        } catch (error) {
          console.log(`Preset save attempt ${attempts} failed:`, error.message);
          if (attempts === maxAttempts) {
            throw new Error(`Preset save failed. ${error.message.includes('DatabaseTimeout') ? 'The database is busy. Please try again.' : error.message}`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      if (!newTemplate) {
        throw new Error("Failed to create the template record after multiple attempts.");
      }

      // Set this template as the user's default
      await User.updateMyUserData({ default_template_id: newTemplate.id });
      setCurrentUser(prev => ({...prev, default_template_id: newTemplate.id }));

      await loadTemplates();
      alert("Preset saved and set as your default!");
    } catch (error) {
      console.error('Failed to save preset:', error);
      setSaveErrorMessage(error.message || 'Failed to save preset. Please try again.');
      setShowSaveError(true);
      setTimeout(() => setShowSaveError(false), 5000);
    } finally {
      setIsSavingTemplate(false); // Re-use the template saving spinner
    }
  }, [currentUser, canvasWidth, canvasHeight, drawFinalImage, elements, backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor, backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY, overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle, loadTemplates]);
  
  const handleClearGallery = useCallback(async () => {
    try {
      // Delete all gallery images from the backend
      await Promise.all(galleryImages.map(image => GeneratedImage.delete(image.id)));
      setGalleryImages([]); // Clear local state
      setShowGalleryPanel(false); // Hide gallery panel as it's empty
      setLightboxIndex(null); // Close lightbox if open
    } catch (error) {
      console.warn('Failed to clear gallery via API. Clearing localStorage gallery instead:', error);
      try {
        localStorage.removeItem('etendy_gallery');
        setGalleryImages([]);
        setShowGalleryPanel(false);
        setLightboxIndex(null);
      } catch (lsError) {
        console.error('Failed to clear local gallery:', lsError);
        setSaveErrorMessage('Failed to clear gallery. Please try again.');
        setShowSaveError(true);
        setTimeout(() => setShowSaveError(false), 5000);
      }
    }
  }, [galleryImages]);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasWidth;
      exportCanvas.height = canvasHeight;
      const ctx = exportCanvas.getContext('2d');
      await drawFinalImage(ctx);
      
      const blob = await new Promise(resolve => exportCanvas.toBlob(resolve, 'image/jpeg', 0.9));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `etendy-graphic-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
      setSaveErrorMessage('Failed to download image. Please try again.');
      setShowSaveError(true);
      setTimeout(() => setShowSaveError(false), 5000);
    } finally {
      setIsDownloading(false);
    }
  }, [canvasWidth, canvasHeight, drawFinalImage]);

  const handleSaveToGallery = useCallback(async () => {
    setIsSaving(true);
    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasWidth;
      exportCanvas.height = canvasHeight;
      const ctx = exportCanvas.getContext('2d');
      await drawFinalImage(ctx);

      const canvasData = {
        elements: JSON.parse(JSON.stringify(elements)),
        canvasWidth,
        canvasHeight,
        backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor,
        backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY,
        overlayType, overlayColor, overlayOpacity, overlayGradientColor1,
        overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2,
        overlayGradientAngle,
      };

      const blob = await new Promise(resolve => exportCanvas.toBlob(resolve, 'image/jpeg', 0.8));
      const timestamp = Date.now();
      const file = new File([blob], `etendy-${timestamp}.jpg`, { type: 'image/jpeg' });

      let savedViaApi = false;
      try {
        const uploadResult = await UploadFile({ file });
        if (!uploadResult || !uploadResult.file_url) {
          throw new Error('Failed to upload image.');
        }
        await GeneratedImage.create({
          image_url: uploadResult.file_url,
          canvas_data: canvasData,
        });
        savedViaApi = true;
        await loadGallery();
      } catch (apiError) {
        console.warn('API save failed; saving to localStorage gallery instead:', apiError);
        const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.8);
        const newItem = {
          id: crypto.randomUUID(),
          image_url: dataUrl,
          canvas_data: canvasData,
          created_date: new Date().toISOString(),
        };
        try {
          const local = JSON.parse(localStorage.getItem('etendy_gallery') || '[]');
          const updated = [newItem, ...local];
          localStorage.setItem('etendy_gallery', JSON.stringify(updated));
          setGalleryImages(updated);
        } catch (lsError) {
          console.error('Failed to save gallery item to localStorage:', lsError);
          throw lsError;
        }
      }

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save to gallery:', error);
      setSaveErrorMessage('Failed to save to gallery. Please try again.');
      setShowSaveError(true);
      setTimeout(() => setShowSaveError(false), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [canvasWidth, canvasHeight, drawFinalImage, elements, backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor, backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY, overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle, loadGallery]);

  const handleLogin = async () => {
    if (isAdmin) {
      // If already admin, logout
      setIsAdmin(false);
      localStorage.setItem('etendy_admin_session', 'false');
      setShowAdminPanel(false);
    } else {
      // Show admin code prompt
      setShowAdminPrompt(true);
    }
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.reload(); // Reload to reset app state
  };

  const handleDeleteImage = useCallback(async (imageId) => {
    try {
      await GeneratedImage.delete(imageId);
      // After deleting, we need to re-fetch and also check if the lightbox needs to be closed
      const newImages = await GeneratedImage.list('-created_date');
      setGalleryImages(newImages);

      if (newImages.length === 0) {
        setShowGalleryPanel(false); // Close gallery panel if no images are left
        setLightboxIndex(null);
      } else if (lightboxIndex !== null) {
        // If the deleted image was the one in the lightbox, close it or move to the next.
        // For simplicity, if the current lightbox image is gone, close it.
        // A more advanced implementation might try to find the next valid index.
        const currentLightboxImageId = galleryImages[lightboxIndex]?.id;
        if (currentLightboxImageId === imageId) {
          setLightboxIndex(null);
        } else {
            // If the deleted image was not the one in the lightbox,
            // ensure the lightbox index still points to a valid image.
            // Depending on how you want to handle shifts, you might need more complex logic.
            // For now, if the original lightbox image is still present, update its index if needed.
            const newIndex = newImages.findIndex(img => img.id === currentLightboxImageId);
            if (newIndex === -1) {
                setLightboxIndex(null); // Current lightbox image is no longer in gallery
            } else {
                setLightboxIndex(newIndex); // Update index if it shifted
            }
        }
      }
    } catch (error) {
      console.warn('Failed to delete image via API. Deleting from localStorage gallery instead:', error);
      try {
        const local = JSON.parse(localStorage.getItem('etendy_gallery') || '[]');
        const updated = local.filter(img => img.id !== imageId);
        localStorage.setItem('etendy_gallery', JSON.stringify(updated));
        setGalleryImages(updated);
        if (updated.length === 0) {
          setShowGalleryPanel(false);
          setLightboxIndex(null);
        } else if (lightboxIndex !== null) {
          const currentLightboxImageId = galleryImages[lightboxIndex]?.id;
          const newIndex = updated.findIndex(img => img.id === currentLightboxImageId);
          if (newIndex === -1) {
            setLightboxIndex(null);
          } else {
            setLightboxIndex(newIndex);
          }
        }
      } catch (lsError) {
        console.error('Failed to delete image from local gallery:', lsError);
        setSaveErrorMessage('Failed to delete image. Please try again.');
        setShowSaveError(true);
        setTimeout(() => setShowSaveError(false), 5000);
      }
    }
  }, [galleryImages, lightboxIndex]);

  const handleDownloadAll = useCallback(async () => {
    let failedDownloads = 0;
    for (const image of galleryImages) {
      try {
        const response = await fetch(image.image_url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `etendy-graphic-${image.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
      } catch (error) {
        console.error(`Failed to download image ${image.id}:`, error);
        failedDownloads++;
      }
    }
    
    if (failedDownloads > 0) {
      setSaveErrorMessage(`${failedDownloads} image(s) failed to download. Please try again.`);
      setShowSaveError(true);
      setTimeout(() => setShowSaveError(false), 5000);
    }
  }, [galleryImages]);
  
  const getPageBackgroundStyle = useCallback(() => {
    // If page background is locked, use the locked settings
    if (adminSettings?.pageBackgroundControls?.locked && adminSettings?.pageBackgroundControls?.lockedSettings) {
      const lockedSettings = adminSettings.pageBackgroundControls.lockedSettings;

      if (lockedSettings.pageBackgroundType === 'image' && lockedSettings.pageBackgroundImage) {
        return {
          backgroundImage: `url(${lockedSettings.pageBackgroundImage})`,
          backgroundSize: `${(lockedSettings.pageBackgroundScale || 1) * 100}%`,
          backgroundPosition: `${lockedSettings.pageBackgroundX || 0}px ${lockedSettings.pageBackgroundY || 0}px`,
          backgroundRepeat: 'no-repeat'
        };
      } else if (lockedSettings.pageBackgroundType === 'color') {
        return { background: lockedSettings.pageBackgroundColor || '#1e1b4b' };
      } else {
        // Default to gradient
        return {
          background: `linear-gradient(135deg, ${lockedSettings.pageGradientColor1 || '#7c3aed'}, ${lockedSettings.pageGradientColor2 || '#1e40af'})`
        };
      }
    }

    // If not locked, use the regular page background state
    if (pageBackgroundType === 'image' && pageBackgroundImage) {
      return {
        backgroundImage: `url(${pageBackgroundImage})`,
        backgroundSize: `${pageBackgroundScale * 100}%`,
        backgroundPosition: `${pageBackgroundX}px ${pageBackgroundY}px`,
        backgroundRepeat: 'no-repeat'
      };
    } else if (pageBackgroundType === 'color') {
      return { background: pageBackgroundColor };
    } else {
      return {
        background: `linear-gradient(135deg, ${pageGradientColor1}, ${pageGradientColor2})`
      };
    }
  }, [adminSettings, pageBackgroundType, pageBackgroundImage, pageBackgroundColor, pageGradientColor1, pageGradientColor2, pageBackgroundScale, pageBackgroundX, pageBackgroundY]);

  const handleNextLightbox = () => {
    if (lightboxIndex === null || galleryImages.length === 0) return;
    setLightboxIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
  };

  const handlePrevLightbox = () => {
    if (lightboxIndex === null || galleryImages.length === 0) return;
    setLightboxIndex((prevIndex) => (prevIndex - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={getPageBackgroundStyle()}>
      {/* Admin Code Prompt */}
      {showAdminPrompt && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Admin Login</h2>
            <p className="text-white/80 mb-6 text-center">Enter the admin code to access admin features.</p>
            
            <div className="space-y-4">
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Enter admin code"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                onKeyPress={(e) => e.key === 'Enter' && handleAdminCodeSubmit()}
                autoFocus
              />
              
              <div className="flex gap-3">
                <button
                  onClick={handleAdminCodeSubmit}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowAdminPrompt(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            <p className="text-white/60 text-xs mt-4 text-center">
              Demo code: <code className="bg-white/10 px-2 py-1 rounded">admin123</code>
            </p>
          </div>
        </div>
      )}

      {/* Animated Background Overlay - only show if not using custom image and page background is not locked */}
      {(function() {
        // Determine the current background type being used
        let currentBackgroundType = pageBackgroundType;
        let isBackgroundLocked = adminSettings?.pageBackgroundControls?.locked === true;

        // If background is locked, use the locked settings
        if (isBackgroundLocked && adminSettings?.pageBackgroundControls?.lockedSettings) {
          currentBackgroundType = adminSettings.pageBackgroundControls.lockedSettings.pageBackgroundType || 'gradient';
        }

        // Only show animated overlay if not using image background and background is not locked
        return currentBackgroundType !== 'image' && !isBackgroundLocked;
      })() && (
        <div className="fixed inset-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 via-transparent to-cyan-500/20"></div>
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style>{`
        /* Custom scrollbar styles */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background-color: #ccc;
          border-radius: 10px;
          box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
        }
        ::-webkit-scrollbar-track {
          background-color: #eee;
          border-radius: 10px;
          box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
        }
      `}</style>

      {/* Google Fonts and Styles */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Archivo+Expanded:wght@300;400;500;600;700&family=Archivo:wght@300;400;500;600;700&family=DM+Serif+Text:ital@0;0&family=Indie+Flower&family=Inter:wght@100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .glass-panel { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
        .glass-input:focus { box-shadow: 0 0 20px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
        .glass-slider [data-slider-track] { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); }
        .glass-slider [data-slider-range] { background: linear-gradient(90deg, rgba(139, 92, 246, 0.6), rgba(99, 102, 241, 0.6)); }
        .glass-slider [data-slider-thumb] { background: rgba(255, 255, 255, 0.9); border: 2px solid rgba(255, 255, 255, 0.3); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); }
        body { font-family: 'Archivo', system-ui, sans-serif; }
        .font-archivo-expanded { font-family: 'Archivo Expanded', system-ui, sans-serif; }
      `}</style>

      {/* Admin Panel Toggle - Only show for admins */}
      {isAdmin && (
        <div className="fixed top-4 left-4 z-[200]">
          <Button 
            onClick={(e) => { e.stopPropagation(); toggleAdminPanel(); }}
            className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-xl flex items-center justify-center hover:bg-red-500/30 transition-all duration-300 text-red-300"
          >
            <Settings className="w-6 h-6" />
          </Button>

          {showAdminPanel && (
            <>
              {/* Backdrop specifically for Admin Panel */}
              <div 
                className="fixed inset-0 z-[210]"
                onClick={(e) => { e.stopPropagation(); setShowAdminPanel(false); }}
              />
              <div 
                className="fixed top-20 left-4 w-96 z-[220] glass-panel border border-white/20 backdrop-blur-xl bg-white/10 rounded-xl p-0 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={(e) => { e.stopPropagation(); setShowAdminPanel(false); }} className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors z-[225]">
                  <X className="w-5 h-5" />
                </button>
                <AdminPanel 
                  settings={adminSettings}
                  onSettingChange={handleAdminSettingsChange}
                  onSave={saveAdminSettings}
                  isSaving={isSavingAdminSettings}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Control Icons - Fixed in corner */}
      <div className="fixed top-4 right-4 z-30 flex items-start gap-2">
        {/* Templates Panel Control - Hide if disabled */}
        {(!adminSettings || adminSettings.generalControls?.templatesEnabled !== false) && (
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); handleTemplatesPanelToggle(); }}
              className="w-12 h-12 bg-white/20 border border-white/30 rounded-xl backdrop-blur-xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 text-white relative shadow-lg"
            >
              <Save className="w-6 h-6" />
            </button>
            
            {showTemplatesPanel && (
              <>
               {/* Backdrop for closing panel */}
                <div 
                  className="fixed inset-0 z-20"
                  onClick={(e) => { e.stopPropagation(); handleTemplatesPanelToggle(); }}
                />
                <div 
                  className="absolute top-14 right-0 w-80 glass-panel border border-white/20 backdrop-blur-xl bg-white/10 rounded-xl p-4 z-30 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={(e) => { e.stopPropagation(); handleTemplatesPanelToggle(); }} className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors z-10">
                    <X className="w-5 h-5" />
                  </button>
                  <TemplatesPanel 
                    templates={templates} 
                    onLoadTemplate={handleLoadTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    isLoading={isLoadingTemplates}
                    onRefresh={loadTemplates}
                    currentUser={currentUser}
                    onSetDefault={handleSetDefaultTemplate}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Layers Panel Control - Hide if disabled */}
        {(!adminSettings || adminSettings.generalControls?.layersEnabled !== false) && (
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); handleLayersPanelToggle(); }}
              className="w-12 h-12 bg-white/20 border border-white/30 rounded-xl backdrop-blur-xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 text-white relative shadow-lg"
            >
              <Layers className="w-6 h-6" />
            </button>
            
            {showLayersPanel && (
              <>
               {/* Backdrop for closing panel */}
                <div 
                  className="fixed inset-0 z-20"
                  onClick={(e) => { e.stopPropagation(); handleLayersPanelToggle(); }}
                />
                <div 
                  className="absolute top-14 right-0 w-80 glass-panel border border-white/20 backdrop-blur-xl bg-white/10 rounded-xl p-4 z-30 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={(e) => { e.stopPropagation(); handleLayersPanelToggle(); }} className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors z-10">
                    <X className="w-5 h-5" />
                  </button>
                  <LayersPanel 
                    elements={elements} 
                    selectedElementId={selectedElementId}
                    onSelectElement={handleElementSelection}
                    onDeleteElement={removeElement}
                    onMoveLayer={moveLayer}
                    onReorderLayers={handleReorderLayers}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Gallery Panel Control - Hide if disabled */}
        {(!adminSettings || adminSettings.generalControls?.galleryEnabled !== false) && (
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); handleGalleryPanelToggle(); }}
              className="w-12 h-12 bg-white/20 border border-white/30 rounded-xl backdrop-blur-xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 text-white relative shadow-lg"
            >
              <Heart className="w-6 h-6" />
              {showGalleryDot && galleryImages.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </button>
            
            {showGalleryPanel && (
              <>
               {/* Backdrop for closing panel */}
                <div 
                  className="fixed inset-0 z-20"
                  onClick={(e) => { e.stopPropagation(); handleGalleryPanelToggle(); }}
                />
                <div 
                  className="absolute top-14 right-0 w-80 glass-panel border border-white/20 backdrop-blur-xl bg-white/10 rounded-xl p-4 z-30 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={(e) => { e.stopPropagation(); handleGalleryPanelToggle(); }} className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors z-10">
                    <X className="w-5 h-5" />
                  </button>
                  <Gallery 
                    images={galleryImages} 
                    onImageSelect={(index) => setLightboxIndex(index)}
                    onClear={handleClearGallery}
                    onDelete={handleDeleteImage}
                    onDownloadAll={handleDownloadAll}
                    isLoading={isLoadingGallery}
                  />
                </div>
              </>
            )}
          </div>
        )}
        
        {/* User Menu */}
        {currentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-12 h-12 bg-white/20 border border-white/30 rounded-xl backdrop-blur-xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 text-white relative shadow-lg">
                <UserIcon className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass-panel border-white/20 bg-black/50 text-white mr-4">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium leading-none">Signed in as</p>
                <p className="text-xs leading-none text-white/70">{currentUser.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuItem 
                onClick={handleSaveCurrentAsMyPreset} 
                disabled={isSavingTemplate}
                className="cursor-pointer"
              >
                {isSavingTemplate ? "Saving..." : "Save as My Preset"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={handleLogin} className={`h-12 px-4 text-white rounded-xl shadow-lg ${isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}>
            {isAdmin ? 'Admin Logout' : 'Admin Login'}
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header removed (Etendy logo) */}

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Preview */}
            <div className="lg:col-span-2">
              <CanvasPreview
                elements={elements} 
                setElements={setElements}
                selectedElementId={selectedElementId} 
                setSelectedElementId={handleElementSelection}
                updateElement={updateElement}
                canvasWidth={canvasWidth} 
                canvasHeight={canvasHeight} 
                onCanvasSizeChange={handleCanvasSizeChange}
                backgroundType={backgroundType} 
                gradientColor1={gradientColor1} 
                gradientColor2={gradientColor2} 
                gradientAngle={gradientAngle} 
                backgroundColor={backgroundColor} 
                backgroundImage={backgroundImage}
                backgroundImageScale={backgroundImageScale} 
                backgroundImageX={backgroundImageX} 
                backgroundImageY={backgroundImageY}
                overlayType={overlayType} 
                overlayColor={overlayColor} 
                overlayOpacity={overlayOpacity} 
                overlayGradientColor1={overlayGradientColor1} 
                overlayGradientOpacity1={overlayGradientOpacity1} 
                overlayGradientColor2={overlayGradientColor2} 
                overlayGradientOpacity2={overlayGradientOpacity2}
                overlayGradientAngle={overlayGradientAngle} 
                showCanvasBackgroundOverlay={showCanvasBackgroundOverlay}
                onDownload={handleDownload}
                isDownloading={isDownloading}
                onSave={handleSaveToGallery}
                isSaving={isSaving}
                onCanvasReset={adminSettings?.generalControls?.resetEnabled !== false ? handleCanvasReset : null}
                onUndo={adminSettings?.generalControls?.undoEnabled !== false ? handleUndo : null}
                canUndo={history.length > 0 && adminSettings?.generalControls?.undoEnabled !== false}
                onInteractionStart={pushToHistory}
                onSaveTemplate={handleSaveTemplate}
                isSavingTemplate={isSavingTemplate}
                adminSettings={adminSettings}
                isCropping={isCropping}
              />
            </div>

            {/* Right Column - Controls (Unified Panel) */}
            <div className="flex flex-col">
              {/* Tab/Panel Navigator */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-1 mb-4 bg-white/10 rounded-xl p-1 border border-white/20 glass-panel">
                {/* Background Panel Tab */}
                {adminSettings?.backgroundControls?.locked !== true && (
                    <button onClick={() => setActiveControlPanel('background')} 
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${activeControlPanel === 'background' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                        <Palette className="w-5 h-5 mb-1" />
                        Background
                    </button>
                )}
                {/* Image Panel Tab */}
                {(!adminSettings || adminSettings.imageControls?.uploadEnabled !== false) && (
                    <button onClick={() => setActiveControlPanel('image')} 
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${activeControlPanel === 'image' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                        <ImageIcon className="w-5 h-5 mb-1" />
                        Image
                    </button>
                )}
                {/* Text Panel Tab */}
                <button onClick={() => setActiveControlPanel('text')} 
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${activeControlPanel === 'text' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                    <Type className="w-5 h-5 mb-1" />
                    Text
                </button>
                {/* Elements Panel Tab */}
                {(adminSettings?.shapeControls?.rectangleEnabled ||
                  adminSettings?.shapeControls?.circleEnabled ||
                  adminSettings?.shapeControls?.lineEnabled ||
                  adminSettings?.shapeControls?.starEnabled
                ) && (
                    <button onClick={() => setActiveControlPanel('elements')} 
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${activeControlPanel === 'elements' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                        <Shapes className="w-5 h-5 mb-1" />
                        Elements
                    </button>
                )}
                {/* Download Panel Tab */}
                <button onClick={() => setActiveControlPanel('download')} 
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${activeControlPanel === 'download' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                    <Download className="w-5 h-5 mb-1" />
                    Download
                </button>
              </div>

              {/* Render active panel content */}
              <div className="flex-grow bg-white/10 glass-panel border border-white/20 rounded-xl p-4">
                {activeControlPanel === 'background' && adminSettings?.backgroundControls?.locked !== true && (
                  <Step1Background 
                    backgroundType={backgroundType} 
                    setBackgroundType={(val) => { pushToHistory(); setBackgroundType(val); }} 
                    gradientColor1={gradientColor1} 
                    setGradientColor1={(val) => { pushToHistory(); setGradientColor1(val); }} 
                    gradientColor2={gradientColor2} 
                    setGradientColor2={(val) => { pushToHistory(); setGradientColor2(val); }} 
                    gradientAngle={gradientAngle} 
                    setGradientAngle={(val) => { pushToHistory(); setGradientAngle(val); }} 
                    backgroundColor={backgroundColor} 
                    setBackgroundColor={(val) => { pushToHistory(); setBackgroundColor(val); }} 
                    backgroundImage={backgroundImage} 
                    setBackgroundImage={(val) => { pushToHistory(); setBackgroundImage(val); }} 
                    backgroundImageScale={backgroundImageScale} 
                    setBackgroundImageScale={(val) => { pushToHistory(); setBackgroundImageScale(val); }} 
                    backgroundImageX={backgroundImageX} 
                    setBackgroundImageX={(val) => { pushToHistory(); setBackgroundImageX(val); }} 
                    backgroundImageY={backgroundImageY} 
                    setBackgroundImageY={(val) => { pushToHistory(); setBackgroundImageY(val); }}
                    backgroundImageNaturalDimensions={backgroundImageNaturalDimensions} 
                    setBackgroundImageNaturalDimensions={setBackgroundImageNaturalDimensions}
                    overlayType={overlayType} 
                    setOverlayType={(val) => { pushToHistory(); setOverlayType(val); }} 
                    overlayColor={overlayColor} 
                    setOverlayColor={(val) => { pushToHistory(); setOverlayColor(val); }} 
                    overlayOpacity={overlayOpacity} 
                    setOverlayOpacity={(val) => { pushToHistory(); setOverlayOpacity(val); }}
                    overlayGradientColor1={overlayGradientColor1} 
                    setOverlayGradientColor1={(val) => { pushToHistory(); setOverlayGradientColor1(val); }} 
                    overlayGradientOpacity1={overlayGradientOpacity1} 
                    setOverlayGradientOpacity1={(val) => { pushToHistory(); setOverlayGradientOpacity1(val); }}
                    overlayGradientColor2={overlayGradientColor2} 
                    setOverlayGradientColor2={(val) => { pushToHistory(); setOverlayGradientColor2(val); }} 
                    overlayGradientOpacity2={overlayGradientOpacity2} 
                    setOverlayGradientOpacity2={(val) => { pushToHistory(); setOverlayGradientOpacity2(val); }}
                    overlayGradientAngle={overlayGradientAngle} 
                    setOverlayGradientAngle={(val) => { pushToHistory(); setOverlayGradientAngle(val); }}
                    onBackgroundChange={handleBackgroundChange}
                    galleryImages={galleryImages}
                    onSelectGalleryImage={handleSelectGalleryImage}
                    canvasWidth={canvasWidth} 
                    canvasHeight={canvasHeight}
                    adminSettings={adminSettings}
                  />
                )}

                {activeControlPanel === 'image' && (!adminSettings || adminSettings.imageControls?.uploadEnabled !== false) && (
                  <Step2Image 
                    photo={elements.find(el => el.type === 'image')}
                    onPhotoUpload={handlePhotoUpload}
                    updateElement={updateElement}
                    pushToHistory={pushToHistory}
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    adminSettings={adminSettings}
                    isCropping={isCropping}
                    setIsCropping={setIsCropping}
                  />
                )}

                {activeControlPanel === 'text' && (
                  <Step3Text 
                    elements={elements}
                    selectedElement={elements.find(el => el.id === selectedElementId && el.type === 'text')}
                    updateElement={updateElement}
                    addElement={addElement}
                    setSelectedElementId={setSelectedElementId}
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    pushToHistory={pushToHistory}
                    adminSettings={adminSettings}
                  />
                )}

                {activeControlPanel === 'elements' && (adminSettings?.shapeControls?.rectangleEnabled ||
                  adminSettings?.shapeControls?.circleEnabled ||
                  adminSettings?.shapeControls?.lineEnabled ||
                  adminSettings?.shapeControls?.starEnabled
                ) && (
                  <Step4Elements 
                    elements={elements}
                    selectedElement={elements.find(el => el.id === selectedElementId && ['logo', 'shape'].includes(el.type))}
                    onLogoUpload={handleLogoUpload}
                    updateElement={updateElement}
                    addElement={addElement}
                    setSelectedElementId={setSelectedElementId}
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    pushToHistory={pushToHistory}
                    removeElement={removeElement}
                    adminSettings={adminSettings}
                  />
                )}

                {activeControlPanel === 'download' && (
                  <Step5Download 
                    onDownload={handleDownload} 
                    onSave={handleSaveToGallery} 
                    isDownloading={isDownloading} 
                    isSaving={isSaving} 
                    onSaveTemplate={handleSaveTemplate}
                    isSavingTemplate={isSavingTemplate}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightboxIndex !== null && galleryImages[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            className="absolute top-4 right-4 bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Prev Button */}
          {galleryImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevLightbox();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          
          <img 
            src={galleryImages[lightboxIndex].image_url} 
            alt="Lightbox Preview" 
            className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Next Button */}
          {galleryImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextLightbox();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      )}

      {/* Success Message */}
      {showSaveSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-6 h-6" />
          <span className="font-semibold">Saved successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {showSaveError && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-md animate-fade-in">
          <X className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-semibold">Operation Failed</p>
            <p className="text-sm opacity-90">{saveErrorMessage}</p>
          </div>
        </div>
      )}

      {/* Update Counter - For tracking code changes */}
      <div className="fixed bottom-4 left-4 z-50 bg-black/50 text-white/70 px-3 py-1 rounded text-xs font-mono">
        Update #25 - Page Background Controls Working
      </div>
    </div>
  );
}
