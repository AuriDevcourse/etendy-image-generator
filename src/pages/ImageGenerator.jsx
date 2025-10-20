import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UploadFile } from "@/api/integrations";
import { GeneratedImage } from "@/api/entities";
import { Template } from "@/api/entities";
import { User } from "@/api/entities"; // Assuming User entity exists for role checking
import { AdminSettings } from '@/api/entities'; // Import AdminSettings
import { supabase, presetService, authService, userService, adminSettingsService, templateService, roleService } from '../lib/supabase';

import CanvasPreview from '../components/ImageGenerator/CanvasPreview';
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
import UserProfile from '../components/UserProfile/UserProfile';
import TooltipTour from '../components/ImageGenerator/TooltipTour';
import KeyboardShortcutsHelp from '../components/ImageGenerator/KeyboardShortcutsHelp';
import QuickTooltips from '../components/ImageGenerator/QuickTooltips';
import Notification from '../components/Notification';
import { Button } from '@/components/ui/button';
import { Palette, X, CheckCircle, ChevronLeft, ChevronRight, Heart, Layers, Save, Settings, Image as ImageIcon, Type, Shapes, Download, Monitor, User as UserIcon, LogOut, Home, Grid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import sattendWhiteLogo from '../assets/sattend-white.png';
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
      backgroundColor: '#211c1a',
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
  const navigate = useNavigate();
  
  // Debug: Confirm latest code is loaded
  console.log('🚀🚀🚀 LATEST CODE LOADED - Update #28 - UX Improvements & Undo/Redo Fix 🚀🚀🚀');
  console.log('If you see this message, the latest code is running!');
  console.log('✅ Undo/Redo system fixed - one action per step');
  console.log('🎨 Grid overlay toggle added');
  console.log('🔗 Group/Ungroup functionality (Ctrl+G / Ctrl+Shift+G)');
  console.log('💬 Notification system implemented');
  console.log('⚠️ Background drag warning after 3 attempts');
  console.log('📝 Text editing workflow improved');

  // Custom scrollbar styles matching admin panel
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .panel-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .panel-scroll::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }
      .panel-scroll::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }
      .panel-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      .panel-scroll {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Test console immediately
  console.log('🔍 CONSOLE TEST: If you see this, the console is working!');

  // NEW: Control Panel State (replaces old wizard state)
  const [activeControlPanel, setActiveControlPanel] = useState('background');

  // History State for Undo/Redo
  const [history, setHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const MAX_HISTORY_LENGTH = 30;

  // --- REFACTORED STATE ---
  // A single array to hold all canvas elements, managing layers and properties
  const [elements, setElements] = useState([]);
  const [selectedElementIds, setSelectedElementIds] = useState([]); // Changed to array for multi-select
  const [ctrlPressed, setCtrlPressed] = useState(false); // Track Ctrl key state
  
  // Background State (for Canvas) - Remains global
  const [backgroundType, setBackgroundType] = useState('color');
  const [gradientColor1, setGradientColor1] = useState('#6366f1');
  const [gradientColor2, setGradientColor2] = useState('#8b5cf6');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [backgroundColor, setBackgroundColor] = useState('#211c1a');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundImageNaturalDimensions, setBackgroundImageNaturalDimensions] = useState({ width: 0, height: 0 });
  const [backgroundImageScale, setBackgroundImageScale] = useState(1.0);
  const [backgroundImageX, setBackgroundImageX] = useState(0);
  const [backgroundImageY, setBackgroundImageY] = useState(0);
  const [backgroundImageBlur, setBackgroundImageBlur] = useState(0); // Blur amount in pixels
  
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
  const [pageGradientColor1, setPageGradientColor1] = useState('#2a1f1a');
  const [pageGradientColor2, setPageGradientColor2] = useState('#000000');
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
  
  // Notification and UX states
  const [notification, setNotification] = useState(null);
  const [backgroundDragAttempts, setBackgroundDragAttempts] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  
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
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true); // Initial page load

  // Preset State
  const [currentPreset, setCurrentPreset] = useState(null);
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetRestrictions, setPresetRestrictions] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Template State
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true); // Fixed: Added useState()
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Admin settings state
  const [adminSettings, setAdminSettings] = useState(DEFAULT_ADMIN_SETTINGS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isSavingAdminSettings, setIsSavingAdminSettings] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [initialSettingsApplied, setInitialSettingsApplied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminSettingsLoaded, setAdminSettingsLoaded] = useState(false);
  
  // User profile state
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [regularUser, setRegularUser] = useState(null); // For non-admin users
  
  // Tooltip tour state
  const [showTooltipTour, setShowTooltipTour] = useState(false);
  
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
  const pushToHistory = useCallback(() => {
    const currentState = {
      elements,
      backgroundType,
      gradientColor1,
      gradientColor2,
      gradientAngle,
      backgroundColor,
      backgroundImage,
      backgroundImageScale,
      backgroundImageX,
      backgroundImageY,
      overlayType,
      overlayColor,
      overlayOpacity,
      overlayGradientColor1,
      overlayGradientOpacity1,
      overlayGradientColor2,
      overlayGradientOpacity2,
      overlayGradientAngle,
      canvasWidth,
      canvasHeight
    };
    
    // Save current design to localStorage for admin preset creation
    try {
      localStorage.setItem('etendy_current_design', JSON.stringify(currentState));
    } catch (error) {
      console.error('Failed to save current design to localStorage:', error);
    }
    
    setHistory(prev => {
      const newHistory = [currentState, ...prev.slice(0, MAX_HISTORY_LENGTH - 1)];
      return newHistory;
    });
    
    // Clear redo history when new changes are made
    setRedoHistory([]);
  }, [elements, backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor, backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY, overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle, canvasWidth, canvasHeight]);

  const gatherStateSnapshot = useCallback(() => {
    return {
      elements: JSON.parse(JSON.stringify(elements)), // Deep copy of elements
      backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor,
      backgroundImage, backgroundImageNaturalDimensions, backgroundImageScale,
      backgroundImageX, backgroundImageY, backgroundImageBlur,
      overlayType, overlayColor, overlayOpacity, overlayGradientColor1,
      overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2,
      overlayGradientAngle,
    };
  }, [
      elements, // Now tracks all canvas elements
      backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor,
      backgroundImage, backgroundImageNaturalDimensions, backgroundImageScale, backgroundImageX, backgroundImageY, backgroundImageBlur,
      overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, 
      overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle,
  ]);

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
    
    // IMPORTANT: Preserve ALL element properties when loading
    loadedElements = loadedElements.map(el => {
      // Create a copy of the element with all its properties
      const elementCopy = { ...el };
      
      if (el.type === 'text') {
        let newFont = el.font || 'Inter';
        // Enforce allowed fonts if user font selection is disabled for them
        if (fontSettings.enabled === false) {
          if (!fontSettings.allowedFonts.includes(el.font)) {
            newFont = fontSettings.allowedFonts[0] || 'Inter'; // Fallback
          }
        }
        // Override font styles if they are locked by admin
        if (fontSettings.lockFontStyles) {
          return { 
            ...elementCopy, // Preserve all other properties
            font: fontSettings.defaultFont,
            weight: fontSettings.defaultWeight,
            size: fontSettings.defaultSize
          };
        }
        return { ...elementCopy, font: newFont };
      }
      // For non-text elements, return the full copy with all properties
      return elementCopy;
    });

    setElements(loadedElements);
    setSelectedElementIds([]);
    
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
      setBackgroundImageNaturalDimensions(data.backgroundImageNaturalDimensions || { width: 0, height: 0 });
      setBackgroundImageScale(data.backgroundImageScale || 1.0);
      setBackgroundImageX(data.backgroundImageX || 0);
      setBackgroundImageY(data.backgroundImageY || 0);
      setBackgroundImageBlur(data.backgroundImageBlur || 0);
      
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
  }, [pushToHistory, adminSettings, applyLockedBackground, handleCanvasSizeChange, setElements, setSelectedElementIds, setCanvasWidth, setCanvasHeight, setBackgroundType, setGradientColor1, setGradientColor2, setGradientAngle, setBackgroundColor, setBackgroundImage, setBackgroundImageScale, setBackgroundImageX, setBackgroundImageY, setOverlayType, setOverlayColor, setOverlayOpacity, setOverlayGradientColor1, setOverlayGradientOpacity1, setOverlayGradientColor2, setOverlayGradientOpacity2, setOverlayGradientAngle]);

  const resetCanvasState = useCallback((settings) => {
      // Clear all elements
      setElements([]);
      setSelectedElementIds([]);

      // Reset Background to default (locked settings will be applied later if user is not admin)
      setBackgroundType('color');
      setGradientColor1('#6366f1');
      setGradientColor2('#8b5cf6');
      setGradientAngle(135);
      setBackgroundColor('#211c1a');
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
  }, [applyLockedBackground, setElements, setSelectedElementIds, setBackgroundType, setGradientColor1, setGradientColor2, setGradientAngle, setBackgroundColor, setBackgroundImage, setBackgroundImageNaturalDimensions, setBackgroundImageScale, setBackgroundImageX, setBackgroundImageY, setShowCanvasBackgroundOverlay, setOverlayType, setOverlayColor, setOverlayOpacity, setOverlayGradientColor1, setOverlayGradientOpacity1, setOverlayGradientColor2, setOverlayGradientOpacity2, setOverlayGradientAngle, setCanvasWidth, setCanvasHeight]);


  // Load admin settings and apply them ONCE
  useEffect(() => {
    const loadAndApplyInitialSettings = async () => {
      if (initialSettingsApplied) return;

      try {
        console.log('🔄 Loading admin settings from Supabase...');
        
        // Start with default settings
        let effectiveSettings = JSON.parse(JSON.stringify(DEFAULT_ADMIN_SETTINGS));
        
        // Load from Supabase (global settings for all users)
        try {
          const supabaseSettings = await adminSettingsService.getSettings();
          if (supabaseSettings) {
            console.log('✅ Loaded admin settings from Supabase:', supabaseSettings);
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

            effectiveSettings = deepMerge(effectiveSettings, supabaseSettings);
          } else {
            console.log('⚠️ No admin settings found in Supabase, using defaults');
          }
        } catch (supabaseErr) {
          console.warn('⚠️ Failed to load admin settings from Supabase, using defaults:', supabaseErr);
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

    // Apply locked settings for both regular users and admins (for preview)
    if (adminSettings?.backgroundControls?.locked) {
      console.log('🎨 Applying existing locked canvas background settings');
      applyLockedBackground(adminSettings);
    } else if (!isAdmin) {
      // If background is unlocked, ensure the overlay is shown (only for non-admins)
      setShowCanvasBackgroundOverlay(true);
    }
    
    if (adminSettings?.pageBackgroundControls?.locked) {
      console.log('🎨 Applying existing locked page background settings');
      applyLockedPageBackground(adminSettings);
    } else if (!isAdmin) {
      // If page background becomes unlocked, reset to default user-controlled state (only for non-admins)
      setPageBackgroundType('gradient');
      setPageGradientColor1('#7c3aed');
      setPageGradientColor2('#1e40af');
      setPageBackgroundColor('#1e1b4b');
      setPageBackgroundImage(null);
      setPageBackgroundScale(1.0);
      setPageBackgroundX(0);
      setPageBackgroundY(0);
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

  // REMOVED: Automatic save on settings change
  // Settings are now only saved when the "Save Settings" button is clicked

  const saveAdminSettings = useCallback(async () => {
    console.log('🔥 SAVE SETTINGS BUTTON CLICKED!');
    console.log('📊 Current adminSettings state:', adminSettings);
    setIsSavingAdminSettings(true);
    try {
      // Get current user
      const currentUser = await authService.getCurrentUser();
      const userId = currentUser?.id || null;
      
      console.log('💾 Saving admin settings to Supabase...');
      console.log('📝 Settings to save:', JSON.stringify(adminSettings, null, 2));
      
      // Save to Supabase (global settings for all users)
      await adminSettingsService.saveSettings(adminSettings, userId);
      
      console.log('✅ Settings saved successfully to Supabase!');
      console.log('🌍 These settings are now live for ALL users!');
      
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      setShowSavedMessage(true); // Show "Saved!" message
      setTimeout(() => setShowSavedMessage(false), 2000); // Hide after 2 seconds
    } catch (error) {
      console.error('❌ Failed to save settings to Supabase:', error);
      alert('Failed to save settings to server. Please try again.');
    } finally {
      setIsSavingAdminSettings(false);
      console.log('🏁 Save operation completed');
    }
  }, [adminSettings]);
  // Handle admin settings changes and apply locked settings immediately
  const handleAdminSettingsChange = useCallback((newSettings) => {
    const prevSettings = adminSettings;
    console.log('🔄 ADMIN SETTINGS CHANGE RECEIVED:', { prevSettings, newSettings });
    console.log('📊 Checking pageBackgroundControls:', newSettings?.pageBackgroundControls);
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);

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

    // Apply locked settings for preview (admins can see changes immediately)
    // Apply page background if locked and settings exist
    if (newSettings?.pageBackgroundControls?.locked && newSettings?.pageBackgroundControls?.lockedSettings && (pageBackgroundLockChanged || pageBackgroundSettingsChanged)) {
      console.log('🎨 Applying locked page background settings for preview');
      applyLockedPageBackground(newSettings);
    }

    // Apply canvas background if locked and settings exist
    if (newSettings?.backgroundControls?.locked && newSettings?.backgroundControls?.lockedSettings && (canvasBackgroundLockChanged || canvasBackgroundSettingsChanged)) {
      console.log('🎨 Applying locked canvas background settings for preview');
      applyLockedBackground(newSettings);
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
    setSelectedElementIds([elementWithId.id]); // Automatically select newly added element
  };
  
  const removeElement = useCallback((id) => {
    pushToHistory();
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementIds.includes(id)) {
      setSelectedElementIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  }, [pushToHistory, selectedElementIds]); // Wrap in useCallback with dependencies
  
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
      setSelectedElementIds([]);
      return;
    }

    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    setSelectedElementIds([elementId]);
    
    // Navigate to the appropriate panel based on element type
    if (element.type === 'image') {
      setActiveControlPanel('image');
    } else if (element.type === 'text') {
      setActiveControlPanel('text');
    } else if (element.type === 'logo' || element.type === 'shape') {
      setActiveControlPanel('elements');
    }
  }, [elements, selectedElementIds, setActiveControlPanel]);

  // Add keydown listener for deleting elements (now AFTER removeElement is defined)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't delete if user is typing in an input, textarea, or content-editable field
      const activeElement = document.activeElement;
      const isTyping = activeElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(activeElement.tagName);

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0 && !isTyping) {
        e.preventDefault(); // Prevent browser back navigation on backspace
        // Delete all selected elements
        selectedElementIds.forEach(id => removeElement(id));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementIds, removeElement]); // useEffect dependencies are now correct

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
    setBackgroundImageBlur(stateToRestore.backgroundImageBlur || 0);
    setOverlayType(stateToRestore.overlayType);
    setOverlayColor(stateToRestore.overlayColor);
    setOverlayOpacity(stateToRestore.overlayOpacity);
    setOverlayGradientColor1(stateToRestore.overlayGradientColor1);
    setOverlayGradientOpacity1(stateToRestore.overlayGradientOpacity1);
    setOverlayGradientColor2(stateToRestore.overlayGradientColor2);
    setOverlayGradientOpacity2(stateToRestore.overlayGradientOpacity2);
    setOverlayGradientAngle(stateToRestore.overlayGradientAngle);
    setSelectedElementIds([]); // Clear selected elements after undo/restore
  };
  
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    
    // Save current state to redo history before undoing
    const currentState = {
      elements,
      backgroundType,
      gradientColor1,
      gradientColor2,
      gradientAngle,
      backgroundColor,
      backgroundImage,
      backgroundImageScale,
      backgroundImageX,
      backgroundImageY,
      overlayType,
      overlayColor,
      overlayOpacity,
      overlayGradientColor1,
      overlayGradientOpacity1,
      overlayGradientColor2,
      overlayGradientOpacity2,
      overlayGradientAngle,
      canvasWidth,
      canvasHeight
    };
    
    setRedoHistory(prev => [currentState, ...prev.slice(0, MAX_HISTORY_LENGTH - 1)]);
    
    // Get the most recent state (index 0, not last index)
    const previousState = history[0];
    restoreState(previousState);
    setHistory(prev => prev.slice(1)); // Remove first item
  }, [history, elements, backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor, backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY, overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle, canvasWidth, canvasHeight]);

  const handleRedo = useCallback(() => {
    if (redoHistory.length === 0) return;
    
    // Save current state to undo history before redoing
    const currentState = {
      elements,
      backgroundType,
      gradientColor1,
      gradientColor2,
      gradientAngle,
      backgroundColor,
      backgroundImage,
      backgroundImageScale,
      backgroundImageX,
      backgroundImageY,
      overlayType,
      overlayColor,
      overlayOpacity,
      overlayGradientColor1,
      overlayGradientOpacity1,
      overlayGradientColor2,
      overlayGradientOpacity2,
      overlayGradientAngle,
      canvasWidth,
      canvasHeight
    };
    
    setHistory(prev => [currentState, ...prev.slice(0, MAX_HISTORY_LENGTH - 1)]);
    
    // Get the most recent redo state (index 0)
    const nextState = redoHistory[0];
    restoreState(nextState);
    setRedoHistory(prev => prev.slice(1)); // Remove first item
  }, [redoHistory, elements, backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor, backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY, overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle, canvasWidth, canvasHeight]);

  // Show notification helper
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  // Group selected elements together
  const handleGroupElements = useCallback(() => {
    if (selectedElementIds.length < 2) {
      showNotification('Select at least 2 elements to group', 'info');
      return;
    }
    
    pushToHistory(); // Save state before grouping
    
    // Create a unique group ID
    const groupId = `group_${Date.now()}`;
    
    // Update all selected elements with the group ID
    setElements(prevElements => 
      prevElements.map(el => 
        selectedElementIds.includes(el.id) 
          ? { ...el, groupId } 
          : el
      )
    );
    
    showNotification(`Grouped ${selectedElementIds.length} elements`, 'success');
    console.log(`✅ Grouped ${selectedElementIds.length} elements with ID: ${groupId}`);
  }, [selectedElementIds, pushToHistory, showNotification]);

  // Ungroup selected elements
  const handleUngroupElements = useCallback(() => {
    // Find if any selected element is in a group
    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
    const hasGroupedElements = selectedElements.some(el => el.groupId);
    
    if (!hasGroupedElements) {
      showNotification('No grouped elements selected', 'info');
      return;
    }
    
    pushToHistory(); // Save state before ungrouping
    
    // Remove groupId from all selected elements
    setElements(prevElements => 
      prevElements.map(el => 
        selectedElementIds.includes(el.id) && el.groupId
          ? { ...el, groupId: undefined } 
          : el
      )
    );
    
    showNotification('Elements ungrouped', 'success');
    console.log(`✅ Ungrouped ${selectedElements.length} elements`);
  }, [elements, selectedElementIds, pushToHistory, showNotification]);

  // Track Ctrl key for multi-select and shortcuts (placed after handleUndo and handleGroupElements are defined)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) setCtrlPressed(true);
      
      // Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (history.length > 0 && adminSettings?.generalControls?.undoEnabled !== false) {
          handleUndo();
        }
      }
      
      // Ctrl+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (redoHistory.length > 0 && adminSettings?.generalControls?.undoEnabled !== false) {
          handleRedo();
        }
      }
      
      // Ctrl+G for grouping / Ctrl+Shift+G for ungrouping
      if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl+Shift+G for ungroup
          handleUngroupElements();
        } else {
          // Ctrl+G for group
          if (selectedElementIds.length > 1) {
            handleGroupElements();
          }
        }
      }
    };
    
    const handleKeyUp = (e) => {
      if (!e.ctrlKey && !e.metaKey) setCtrlPressed(false);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [history, redoHistory, adminSettings, selectedElementIds, handleUndo, handleRedo, handleGroupElements, handleUngroupElements]);

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
    console.log('🔄 LOAD TEMPLATES CALLED for preset:', currentPreset?.name || 'global');
    
    if (!currentPreset?.id) {
      console.log('⚠️ No preset selected, skipping template load');
      setTemplates([]);
      return;
    }
    
    setIsLoadingTemplates(true);
    try {
      // Load templates from database
      console.log('📊 Loading templates from database for preset:', currentPreset.id);
      const dbTemplates = await templateService.getTemplates(currentPreset.id);
      console.log('✅ Loaded templates from database:', dbTemplates.map(t => ({ name: t.name, id: t.id })));
      console.log('📊 Total templates:', dbTemplates.length);
      setTemplates(dbTemplates);
      
      // Optional: Auto-migrate localStorage templates if database is empty
      if (currentUser && dbTemplates.length === 0) {
        console.log('🔄 Checking for localStorage templates to migrate...');
        const result = await templateService.migrateFromLocalStorage(
          currentPreset.id, 
          currentUser.id
        );
        if (result.migrated > 0) {
          console.log(`✅ Migrated ${result.migrated} templates from localStorage`);
          // Reload templates after migration
          const updatedTemplates = await templateService.getTemplates(currentPreset.id);
          setTemplates(updatedTemplates);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load templates:', error);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [currentPreset, currentUser]);

  useEffect(() => {
    loadGallery();
    loadTemplates();
  }, [loadGallery, loadTemplates]);

  // Load preset from URL on page load
  useEffect(() => {
    const loadPresetFromUrl = async () => {
      // Check URL for preset ID: /p/ABC123 or ?preset=ABC123
      const urlPath = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      
      console.log('🔍 Checking for preset in URL:', urlPath);
      
      // Check if we're in edit mode
      const editMode = urlParams.get('edit') === 'true';
      setIsEditMode(editMode);
      
      let presetId = null;
      if (urlPath.startsWith('/p/')) {
        presetId = urlPath.split('/p/')[1];
        console.log('🎨 Found preset ID in path:', presetId);
      } else if (urlParams.get('preset')) {
        presetId = urlParams.get('preset');
        console.log('🎨 Found preset ID in query:', presetId);
      }

      if (presetId) {
        setIsLoadingPreset(true);
        try {
          console.log('🎨 Loading preset:', presetId);
          const preset = await presetService.getPreset(presetId);
          
          if (preset && preset.settings) {
            console.log('✅ Preset loaded:', preset.name);
            console.log('📋 Preset settings:', preset.settings);
            console.log('🔒 Preset restrictions:', preset.restrictions);
            
            // Store preset restrictions
            if (preset.restrictions) {
              setPresetRestrictions(preset.restrictions);
            }
            
            // Apply preset settings
            const settings = preset.settings;
            
            // Background settings
            if (settings.backgroundType) setBackgroundType(settings.backgroundType);
            if (settings.backgroundColor) setBackgroundColor(settings.backgroundColor);
            if (settings.gradientColor1) setGradientColor1(settings.gradientColor1);
            if (settings.gradientColor2) setGradientColor2(settings.gradientColor2);
            if (settings.gradientAngle) setGradientAngle(settings.gradientAngle);
            if (settings.backgroundImage) setBackgroundImage(settings.backgroundImage);
            if (settings.backgroundImageScale) setBackgroundImageScale(settings.backgroundImageScale);
            if (settings.backgroundImageX) setBackgroundImageX(settings.backgroundImageX);
            if (settings.backgroundImageY) setBackgroundImageY(settings.backgroundImageY);
            if (settings.backgroundImageNaturalDimensions) setBackgroundImageNaturalDimensions(settings.backgroundImageNaturalDimensions);
            
            // Overlay settings
            if (settings.overlayType) setOverlayType(settings.overlayType);
            if (settings.overlayColor) setOverlayColor(settings.overlayColor);
            if (settings.overlayOpacity !== undefined) setOverlayOpacity(settings.overlayOpacity);
            if (settings.overlayGradientColor1) setOverlayGradientColor1(settings.overlayGradientColor1);
            if (settings.overlayGradientOpacity1 !== undefined) setOverlayGradientOpacity1(settings.overlayGradientOpacity1);
            if (settings.overlayGradientColor2) setOverlayGradientColor2(settings.overlayGradientColor2);
            if (settings.overlayGradientOpacity2 !== undefined) setOverlayGradientOpacity2(settings.overlayGradientOpacity2);
            if (settings.overlayGradientAngle) setOverlayGradientAngle(settings.overlayGradientAngle);
            
            // Canvas size
            if (settings.canvasWidth) setCanvasWidth(settings.canvasWidth);
            if (settings.canvasHeight) setCanvasHeight(settings.canvasHeight);
            
            // Page background settings
            if (settings.pageBackgroundType) setPageBackgroundType(settings.pageBackgroundType);
            if (settings.pageGradientColor1) setPageGradientColor1(settings.pageGradientColor1);
            if (settings.pageGradientColor2) setPageGradientColor2(settings.pageGradientColor2);
            if (settings.pageBackgroundColor) setPageBackgroundColor(settings.pageBackgroundColor);
            if (settings.pageBackgroundImage) setPageBackgroundImage(settings.pageBackgroundImage);
            if (settings.pageBackgroundScale) setPageBackgroundScale(settings.pageBackgroundScale);
            if (settings.pageBackgroundX) setPageBackgroundX(settings.pageBackgroundX);
            if (settings.pageBackgroundY) setPageBackgroundY(settings.pageBackgroundY);
            
            // Elements (text, images, shapes, etc.)
            if (settings.elements && Array.isArray(settings.elements)) {
              console.log('🎨 Loading elements:', settings.elements);
              setElements(settings.elements);
            }
            
            // UI state
            if (settings.showCanvasBackgroundOverlay !== undefined) {
              setShowCanvasBackgroundOverlay(settings.showCanvasBackgroundOverlay);
            } else {
              setShowCanvasBackgroundOverlay(false); // Hide overlay since preset is loaded
            }
            
            setCurrentPreset({ 
              id: presetId, 
              name: preset.name,
              user_id: preset.user_id,
              admin_email: preset.admin_email
            });
          }
        } catch (error) {
          console.error('❌ Failed to load preset:', error);
        } finally {
          setIsLoadingPreset(false);
        }
      }
    };

    loadPresetFromUrl();
  }, []); // Run once on mount

  // Check for user authentication on page load
  useEffect(() => {
    const checkUserAuth = async () => {
      setIsCheckingAdmin(true);
      setIsPageLoading(true); // Start page loading
      try {
        const user = await authService.getCurrentUser();
        if (user && user.email) {
          // Check user role from new role system
          const isSuperAdminUser = await roleService.isSuperAdmin(user.id);
          const isAdminUser = await roleService.isAdmin(user.id); // This checks for both admin and super_admin
          
          if (isSuperAdminUser) {
            setAdminUser(user);
            setIsAdmin(true);
            setIsSuperAdmin(true);
            console.log('✅ Super Admin user authenticated:', user.email);
          } else if (isAdminUser) {
            // Regular admin (not super admin)
            setAdminUser(user);
            setIsAdmin(true);
            setIsSuperAdmin(false);
            console.log('✅ Admin user authenticated:', user.email);
          } else {
            // Regular user
            setRegularUser(user);
            setCurrentUser(user);
            setIsSuperAdmin(false);
            console.log('✅ Regular user authenticated:', user.email);
            
            // Initialize user profile if first time
            await userService.initializeUserProfile(user);
            
            // Load user preferences
            const preferences = await userService.getUserPreferences(user.id);
            if (preferences) {
              setUserPreferences(preferences);
              console.log('✅ User preferences loaded');
            }
          }
        }
      } catch (error) {
        console.error('❌ User auth check failed:', error);
      } finally {
        setIsCheckingAdmin(false);
        // End page loading after a short delay to ensure everything is rendered
        setTimeout(() => {
          setIsPageLoading(false);
          // Check if user has completed the tour
          const tourCompleted = localStorage.getItem('etendy_tour_completed');
          if (!tourCompleted) {
            setShowTooltipTour(true);
          }
        }, 500);
      }
    };

    checkUserAuth();
  }, []);

  // Admin login function
  const handleAdminLogin = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('❌ Admin login failed:', error);
      alert('Failed to login. Please try again.');
    }
  };

  // Admin logout function
  const handleAdminLogout = async () => {
    try {
      await authService.signOut();
      setAdminUser(null);
      setIsAdmin(false);
      setShowAdminPanel(false);
      alert('Logged out successfully!');
    } catch (error) {
      console.error('❌ Admin logout failed:', error);
    }
  };

  // Regular user login function
  const handleUserLogin = async () => {
    try {
      await authService.signInWithGoogle();
      // The auth state change will be handled by the useEffect above
    } catch (error) {
      console.error('❌ User login failed:', error);
      alert('Failed to login. Please try again.');
    }
  };

  // Regular user logout function
  const handleUserLogout = async () => {
    try {
      await authService.signOut();
      setRegularUser(null);
      setCurrentUser(null);
      setUserPreferences(null);
      setShowUserProfile(false);
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ User logout failed:', error);
    }
  };

  // Handle user preferences change
  const handleUserPreferencesChange = (newPreferences) => {
    setUserPreferences(newPreferences);
    console.log('✅ User preferences updated:', newPreferences);
  };

  // Toggle user profile panel
  const toggleUserProfile = () => {
    setShowUserProfile(!showUserProfile);
  };

  // Update user stats
  const handleStatsUpdate = async (statName, incrementBy = 1) => {
    if (!regularUser) return;
    
    try {
      await userService.incrementStat(regularUser.id, statName, incrementBy);
      console.log(`✅ Updated ${statName} by ${incrementBy} for user:`, regularUser.email);
    } catch (error) {
      console.error(`❌ Failed to update ${statName}:`, error);
    }
  };

  // Save current design as preset (for edit mode)
  const saveCurrentPreset = useCallback(async () => {
    if (!currentPreset || !isEditMode) return;
    
    setIsSavingPreset(true);
    try {
      // Capture complete current state
      const currentSettings = {
        // Background settings
        backgroundType,
        gradientColor1,
        gradientColor2,
        gradientAngle,
        backgroundColor,
        backgroundImage,
        backgroundImageScale,
        backgroundImageX,
        backgroundImageY,
        backgroundImageNaturalDimensions,
        
        // Overlay settings
        overlayType,
        overlayColor,
        overlayOpacity,
        overlayGradientColor1,
        overlayGradientOpacity1,
        overlayGradientColor2,
        overlayGradientOpacity2,
        overlayGradientAngle,
        
        // Canvas settings
        canvasWidth,
        canvasHeight,
        
        // Page background settings
        pageBackgroundType,
        pageGradientColor1,
        pageGradientColor2,
        pageBackgroundColor,
        pageBackgroundImage,
        pageBackgroundScale,
        pageBackgroundX,
        pageBackgroundY,
        
        // All elements (text, shapes, etc.) - EXCLUDE images to save space
        elements: JSON.parse(JSON.stringify(elements.filter(el => el.type !== 'image'))), // Deep copy without images
        
        // UI state
        showCanvasBackgroundOverlay,
        
        // Timestamp for tracking
        lastUpdated: new Date().toISOString(),
        
        // Version for future compatibility
        version: '1.0'
      };

      console.log('💾 Saving complete preset state:', currentSettings);

      // Determine the user ID for ownership verification
      // If the preset has a user_id, use that for verification
      // If it has an admin_email instead, don't verify (admin preset)
      const userId = currentPreset.user_id || null;
      
      console.log('🔐 Updating preset with user verification:', {
        presetId: currentPreset.id,
        userId: userId,
        isUserPreset: !!currentPreset.user_id,
        isAdminPreset: !!currentPreset.admin_email
      });

      // Update the existing preset with user ownership verification
      await presetService.updatePreset(currentPreset.id, currentSettings, userId);
      
      alert(`Preset "${currentPreset.name}" updated successfully!`);
    } catch (error) {
      console.error('Failed to save preset:', error);
      alert('Failed to save preset. Please try again.');
    } finally {
      setIsSavingPreset(false);
    }
  }, [
    currentPreset, isEditMode, 
    // Background state
    backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor, 
    backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY, backgroundImageNaturalDimensions,
    // Overlay state
    overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, 
    overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle,
    // Canvas state
    canvasWidth, canvasHeight,
    // Page background state
    pageBackgroundType, pageGradientColor1, pageGradientColor2, pageBackgroundColor,
    pageBackgroundImage, pageBackgroundScale, pageBackgroundX, pageBackgroundY,
    // Elements
    elements,
    // UI state
    showCanvasBackgroundOverlay
  ]);

  const handlePhotoUpload = useCallback((fileData) => {
    pushToHistory();
    // Add new image without removing existing ones (support multiple images)
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
        setElements([...elements, newImage]); // Keep existing elements, add new image
        setSelectedElementIds([newImage.id]);
        setIsCropping(false); // Ensure cropping is turned off when new image is uploaded
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
        setSelectedElementIds([newLogo.id]);
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
          
          // Apply blur filter if set
          if (backgroundImageBlur > 0) {
            ctx.filter = `blur(${backgroundImageBlur}px)`;
          }
          
          ctx.drawImage(bgImg, backgroundImageX, backgroundImageY, scaledWidth, scaledHeight);
          
          // Reset filter
          ctx.filter = 'none';
          
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

        // Safety check: ensure content exists
        const textContent = el.content || el.text || 'Text';
        const transformedText = applyTextTransform(textContent, el.transform);
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
          
          // Safety check: ensure colors exist
          const safeColor1 = color1 || '#000000';
          const safeColor2 = color2 || color1 || '#FFFFFF';
          
          if (colorType === 'gradient') {
              try {
                const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
                gradient.addColorStop(0, safeColor1);
                gradient.addColorStop(1, safeColor2);
                ctx.fillStyle = gradient;
                ctx.strokeStyle = gradient;
              } catch (gradientError) {
                console.warn('Gradient creation failed, using solid color:', gradientError);
                ctx.fillStyle = safeColor1;
                ctx.strokeStyle = safeColor1;
              }
          } else {
              ctx.fillStyle = safeColor1;
              ctx.strokeStyle = safeColor1;
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
    backgroundImageScale, backgroundImageX, backgroundImageY, backgroundImageBlur
  ]);

  const handleSaveTemplate = useCallback(async (templateName) => {
    console.log('🚀 HANDLE SAVE TEMPLATE CALLED with name:', templateName);
    console.log('📊 Current state - elements:', elements.length, 'canvasWidth:', canvasWidth, 'canvasHeight:', canvasHeight);
    console.log('👤 User:', currentUser?.email);
    console.log('📍 Current preset:', currentPreset?.id, currentPreset?.name);
    
    // Check if user is logged in (regular user or admin)
    const loggedInUser = currentUser || adminUser || regularUser;
    
    if (!currentPreset?.id) {
      // Special handling for admins - offer to go to preset dashboard
      if (adminUser) {
        const goToPresets = window.confirm(
          '⚠️ No preset selected!\n\n' +
          'To save templates, you need to work within a preset.\n\n' +
          'Would you like to go to the Preset Dashboard to create or edit a preset?'
        );
        if (goToPresets) {
          window.location.href = '/admin/presets';
        }
        return;
      }
      alert('Please select a preset first');
      return;
    }
    
    if (!loggedInUser?.id) {
      alert('Please sign in to save templates');
      return;
    }
    
    setIsSavingTemplate(true);
    try {
      // Check template count first
      const count = await templateService.getTemplateCount(currentPreset.id);
      if (count >= 4) {
        alert('Maximum of 4 templates per preset reached. Please delete an existing template first.');
        setIsSavingTemplate(false);
        return;
      }
      
      console.log('💾 Saving template to database for preset:', currentPreset.name);
      
      // Build template data and thumbnail via dataURL
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasWidth;
      exportCanvas.height = canvasHeight;
      const ctx = exportCanvas.getContext('2d');
      console.log('🎨 Drawing final image for template thumbnail...');
      console.log('📐 Canvas dimensions:', { width: canvasWidth, height: canvasHeight });
      console.log('📦 Elements to save:', elements.length);
      
      let dataUrl = null;
      try {
        // Add timeout to prevent hanging (10 seconds)
        const drawPromise = drawFinalImage(ctx);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Thumbnail generation timeout')), 10000)
        );
        
        await Promise.race([drawPromise, timeoutPromise]);
        console.log('✅ drawFinalImage completed successfully');
        
        // Create a very small thumbnail canvas for minimal storage usage
        const thumbnailCanvas = document.createElement('canvas');
        thumbnailCanvas.width = 50; // Even smaller for storage efficiency
        thumbnailCanvas.height = 50;
        const thumbnailCtx = thumbnailCanvas.getContext('2d');
        
        // Draw the full canvas scaled down to thumbnail size
        thumbnailCtx.drawImage(exportCanvas, 0, 0, canvasWidth, canvasHeight, 0, 0, 50, 50);
        
        // Use very low quality for tiny file size
        dataUrl = thumbnailCanvas.toDataURL('image/jpeg', 0.05); // Even lower quality
        console.log('📸 Small thumbnail generated successfully, length:', dataUrl.length);
      } catch (drawError) {
        console.warn('⚠️ Thumbnail generation failed or timed out, creating simple preview:', drawError);
        // Create a simple preview showing canvas background color/gradient
        try {
          const simpleCanvas = document.createElement('canvas');
          simpleCanvas.width = 50;
          simpleCanvas.height = 50;
          const simpleCtx = simpleCanvas.getContext('2d');
          
          // Draw background based on type
          if (backgroundType === 'gradient') {
            const gradient = simpleCtx.createLinearGradient(0, 0, 50, 50);
            gradient.addColorStop(0, gradientColor1);
            gradient.addColorStop(1, gradientColor2);
            simpleCtx.fillStyle = gradient;
          } else {
            simpleCtx.fillStyle = backgroundColor;
          }
          simpleCtx.fillRect(0, 0, 50, 50);
          
          dataUrl = simpleCanvas.toDataURL('image/jpeg', 0.3);
        } catch (fallbackError) {
          // Ultimate fallback - gray square
          dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mM8w8DwHwAEOQHCb6aP0AAAAABJRU5ErkJggg==';
        }
      }

      // Prepare template data
      const templateData = {
        elements: JSON.parse(JSON.stringify(elements)),
        canvasWidth,
        canvasHeight,
        backgroundType, 
        gradientColor1, 
        gradientColor2, 
        gradientAngle, 
        backgroundColor,
        backgroundImage, // Include background image in database (no storage limits!)
        backgroundImageNaturalDimensions: backgroundImageNaturalDimensions,
        backgroundImageScale, 
        backgroundImageX, 
        backgroundImageY,
        backgroundImageBlur,
        overlayType, 
        overlayColor, 
        overlayOpacity, 
        overlayGradientColor1,
        overlayGradientOpacity1, 
        overlayGradientColor2, 
        overlayGradientOpacity2,
        overlayGradientAngle,
      };
      
      console.log('💾 Template data prepared:', { name: templateName, elements: elements.length });
      
      // Save to database
      await templateService.saveTemplate(
        currentPreset.id,
        loggedInUser.id,
        templateName,
        templateData,
        dataUrl // thumbnail
      );
      
      console.log('✅ Template saved to database successfully');
      
      // Reload templates from database
      await loadTemplates();
      
      setShowTemplatesPanel(true);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2500);
      
      alert(`Template "${templateName}" saved successfully!`);
      
    } catch (error) {
      console.error('❌ Failed to save template:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Error handling
      const errorMessage = error.message || 'Failed to save template. Please try again.';
      
      setSaveErrorMessage(errorMessage);
      setShowSaveError(true);
      setTimeout(() => setShowSaveError(false), 5000);
      
      alert(`Template save failed: ${errorMessage}`);
    } finally {
      setIsSavingTemplate(false);
      console.log('🏁 Template save operation completed');
    }
  }, [elements, canvasWidth, canvasHeight, backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor, backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY, overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle, backgroundImageNaturalDimensions, drawFinalImage, currentPreset, currentUser, adminUser, regularUser, loadTemplates]);

  const handleDeleteTemplate = useCallback(async (templateId) => {
    try {
      console.log('🗑️ Deleting template:', templateId);
      await templateService.deleteTemplate(templateId);
      await loadTemplates();
      console.log('✅ Template deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete template:', error);
      alert('Failed to delete template. Please try again.');
    }
  }, [loadTemplates]);

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
    if (!regularUser) return;
    
    const presetName = prompt("Enter a name for your preset:");
    if (!presetName || !presetName.trim()) return;
    
    setIsSavingTemplate(true); // Re-use the template saving spinner
    try {
      // Capture complete current state
      const currentSettings = {
        // Background settings
        backgroundType,
        gradientColor1,
        gradientColor2,
        gradientAngle,
        backgroundColor,
        backgroundImage,
        backgroundImageScale,
        backgroundImageX,
        backgroundImageY,
        backgroundImageNaturalDimensions,
        
        // Overlay settings
        overlayType,
        overlayColor,
        overlayOpacity,
        overlayGradientColor1,
        overlayGradientOpacity1,
        overlayGradientColor2,
        overlayGradientOpacity2,
        overlayGradientAngle,
        
        // Canvas settings
        canvasWidth,
        canvasHeight,
        
        // Page background settings
        pageBackgroundType,
        pageGradientColor1,
        pageGradientColor2,
        pageBackgroundColor,
        pageBackgroundImage,
        pageBackgroundScale,
        pageBackgroundX,
        pageBackgroundY,
        
        // All elements (text, shapes, etc.) - EXCLUDE images to save space
        elements: JSON.parse(JSON.stringify(elements.filter(el => el.type !== 'image'))),
        
        // UI state
        showCanvasBackgroundOverlay,
        
        // Timestamp for tracking
        lastUpdated: new Date().toISOString(),
        
        // Version for future compatibility
        version: '1.0'
      };

      console.log('💾 Creating new preset:', presetName.trim());
      console.log('👤 User ID:', regularUser.id);
      console.log('📋 Settings to save:', currentSettings);

      // Create new preset using Supabase
      const { data, error } = await supabase
        .from('presets')
        .insert([{
          name: presetName.trim(),
          settings: currentSettings,
          user_id: regularUser.id,
          admin_email: null, // Regular user preset
          is_active: true
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Preset created successfully:', data);
      
      // Update current preset state to enable edit mode
      setCurrentPreset({
        id: data.id,
        name: data.name,
        user_id: data.user_id,
        admin_email: data.admin_email
      });
      setIsEditMode(true);
      
      // Update URL to reflect the new preset
      window.history.pushState({}, '', `/p/${data.id}?edit=true`);
      
      alert(`Preset "${presetName.trim()}" created successfully! You can now edit it or create a copy.`);
    } catch (error) {
      console.error('❌ Failed to save preset:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      alert(`Failed to save preset: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsSavingTemplate(false);
    }
  }, [regularUser, canvasWidth, canvasHeight, elements, backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor, backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY, backgroundImageNaturalDimensions, overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle, pageBackgroundType, pageGradientColor1, pageGradientColor2, pageBackgroundColor, pageBackgroundImage, pageBackgroundScale, pageBackgroundX, pageBackgroundY, showCanvasBackgroundOverlay]);
  
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
      
      // Track image generation for logged-in users
      if (regularUser) {
        try {
          await handleStatsUpdate('images_generated', 1);
        } catch (error) {
          console.error('❌ Failed to track image generation:', error);
          // Don't block the download if tracking fails
        }
      }
    } catch (error) {
      console.error('Failed to download image:', error);
      setSaveErrorMessage('Failed to download image. Please try again.');
      setShowSaveError(true);
      setTimeout(() => setShowSaveError(false), 5000);
    } finally {
      setIsDownloading(false);
    }
  }, [canvasWidth, canvasHeight, drawFinalImage, regularUser, handleStatsUpdate]);

  const handleSaveToGallery = useCallback(async () => {
    console.log('💾 SAVE TO GALLERY CALLED');
    console.log('👤 Admin status:', { isAdmin, currentUser });
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

      // Skip API and save directly to localStorage due to auth issues
      console.log('💾 Saving to localStorage gallery (API disabled due to auth issues)...');
      const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.8);
      const newItem = {
        id: crypto.randomUUID(),
        image_url: dataUrl,
        canvas_data: canvasData,
        created_date: new Date().toISOString(),
      };
      
      const local = JSON.parse(localStorage.getItem('etendy_gallery') || '[]');
      const updated = [newItem, ...local.slice(0, 19)]; // Keep max 20 gallery items
      
      try {
        localStorage.setItem('etendy_gallery', JSON.stringify(updated));
        setGalleryImages(updated);
        console.log('✅ Gallery item saved to localStorage successfully!');
      } catch (quotaError) {
        if (quotaError.name === 'QuotaExceededError') {
          console.log('⚠️ Gallery storage quota exceeded, cleaning up...');
          // Keep fewer gallery items
          const limitedGallery = [newItem, ...local.slice(0, 9)]; // Keep only 10
          try {
            localStorage.setItem('etendy_gallery', JSON.stringify(limitedGallery));
            setGalleryImages(limitedGallery);
            console.log('✅ Gallery item saved after cleanup (kept 10 items)');
          } catch (stillFullError) {
            // Keep even fewer
            const minimalGallery = [newItem, ...local.slice(0, 4)]; // Keep only 5
            localStorage.setItem('etendy_gallery', JSON.stringify(minimalGallery));
            setGalleryImages(minimalGallery);
            console.log('✅ Gallery item saved after aggressive cleanup (kept 5 items)');
          }
        } else {
          throw quotaError;
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
  }, [canvasWidth, canvasHeight, drawFinalImage, elements, backgroundType, gradientColor1, gradientColor2, gradientAngle, backgroundColor, backgroundImage, backgroundImageScale, backgroundImageX, backgroundImageY, overlayType, overlayColor, overlayOpacity, overlayGradientColor1, overlayGradientOpacity1, overlayGradientColor2, overlayGradientOpacity2, overlayGradientAngle, isAdmin, currentUser]);

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
                  className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold transition-opacity hover:opacity-80"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowAdminPrompt(false)}
                  className="flex-1 bg-white/10 text-white py-3 px-6 rounded-lg font-semibold transition-opacity hover:opacity-80"
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
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=DM+Sans:wght@100;200;300;400;500;600;700;800;900&family=Archivo:wght@100;200;300;400;500;600;700;800;900&family=Host+Grotesk:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
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

      {/* User Authentication Panel - Show for both admins and regular users */}
      <div className="fixed top-4 left-4 z-[200] flex gap-2">
        {/* Logo - Always visible */}
        <Button 
          onClick={() => navigate('/')}
          className="h-12 px-3 bg-transparent !border-0 shadow-none flex items-center justify-center hover:opacity-80 transition-all duration-300"
          variant="ghost"
          title="Go to Home"
        >
          <img src={sattendWhiteLogo} alt="Sattend" className="h-10" />
        </Button>

        {/* User Authentication Buttons */}
        {adminUser ? (
          <div className="flex gap-2">
            <Button 
              onClick={(e) => { e.stopPropagation(); toggleUserProfile(); }}
              className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-xl flex items-center justify-center hover:bg-red-500/30 transition-all duration-300 text-red-300"
              title={`Admin Profile - ${adminUser.email} - View stats, preferences, and account details`}
            >
              <UserIcon className="w-6 h-6" />
            </Button>
            <Button 
              onClick={(e) => { e.stopPropagation(); toggleAdminPanel(); }}
              className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-xl flex items-center justify-center hover:bg-red-500/30 transition-all duration-300 text-red-300"
              title="Admin Settings - Configure fonts, backgrounds, controls, and preset restrictions"
            >
              <Settings className="w-6 h-6" />
            </Button>
            <Button 
              onClick={(e) => { e.stopPropagation(); handleAdminLogout(); }}
              className="w-12 h-12 bg-gray-500/20 border border-gray-500/30 rounded-xl backdrop-blur-xl flex items-center justify-center hover:bg-gray-500/30 transition-all duration-300 text-gray-300"
              title={`Sign out from admin account - ${adminUser.email}`}
            >
              <LogOut className="w-6 h-6" />
            </Button>
          </div>
        ) : regularUser ? (
          <div className="flex gap-2">
            <Button 
              onClick={(e) => { e.stopPropagation(); toggleUserProfile(); }}
              className="w-12 h-12 bg-orange-500/20 border border-orange-500/30 rounded-xl backdrop-blur-xl flex items-center justify-center hover:bg-orange-500/30 transition-all duration-300 text-orange-300"
              title={`View Profile & Settings - ${regularUser.email} - Track your stats, manage preferences, and view account info`}
            >
              <UserIcon className="w-6 h-6" />
            </Button>
            <Button 
              onClick={(e) => { e.stopPropagation(); handleUserLogout(); }}
              className="w-12 h-12 bg-gray-500/20 border border-gray-500/30 rounded-xl backdrop-blur-xl flex items-center justify-center hover:bg-gray-500/30 transition-all duration-300 text-gray-300"
              title={`Sign out from ${regularUser.email} - Your templates and gallery are saved in the cloud`}
            >
              <LogOut className="w-6 h-6" />
            </Button>
          </div>
        ) : (
          <Button 
            data-tour="sign-in-button"
            onClick={(e) => { e.stopPropagation(); handleUserLogin(); }}
            disabled={isCheckingAdmin}
            className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-xl backdrop-blur-xl flex items-center gap-2 hover:bg-orange-500/30 transition-all duration-300 text-orange-300"
            title="Sign in with Google to unlock: Save Templates, Save to Gallery, Cross-device Sync, Track Statistics, and more!"
          >
            <UserIcon className="w-5 h-5" />
            {isCheckingAdmin ? 'Checking...' : 'Sign In'}
          </Button>
        )}
      </div>

      {/* Admin Panel */}
      {adminUser && showAdminPanel && (
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
                  adminUser={adminUser}
                  isSuperAdmin={isSuperAdmin}
                  isSaving={isSavingAdminSettings}
                  hasUnsavedChanges={hasUnsavedChanges}
                  showSavedMessage={showSavedMessage}
                />
              </div>
            </>
      )}

      {/* User Profile Panel - Show for both admin and regular users */}
      {(adminUser || regularUser) && showUserProfile && (
            <>
              {/* Backdrop specifically for User Profile Panel */}
              <div 
                className="fixed inset-0 z-[210]"
                onClick={(e) => { e.stopPropagation(); setShowUserProfile(false); }}
              />
              <div 
                className="fixed top-20 left-4 w-[600px] max-h-[80vh] overflow-y-auto z-[220] glass-panel border border-white/20 backdrop-blur-xl bg-white/10 rounded-xl p-0 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={(e) => { e.stopPropagation(); setShowUserProfile(false); }} className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors z-[225]">
                  <X className="w-5 h-5" />
                </button>
                <UserProfile 
                  user={adminUser || regularUser}
                  isAdmin={!!adminUser}
                  onClose={() => setShowUserProfile(false)}
                  onLogout={adminUser ? handleAdminLogout : handleUserLogout}
                  onPreferencesChange={handleUserPreferencesChange}
                  onOpenPresets={() => {
                    setShowUserProfile(false);
                    setShowTemplatesPanel(true);
                  }}
                />
              </div>
            </>
      )}

      {/* Control Icons - Fixed in corner */}
      <div className="fixed top-4 right-4 z-30 flex items-start gap-2">
        {/* Templates Panel Control - Hide if disabled */}
        {(!adminSettings || adminSettings.generalControls?.templatesEnabled !== false) && (
          <div className="relative">
            <button 
              data-tour="templates-button"
              onClick={(e) => { e.stopPropagation(); handleTemplatesPanelToggle(); }}
              className="w-12 h-12 bg-white/20 border border-white/30 rounded-xl backdrop-blur-xl flex items-center justify-center transition-opacity hover:opacity-80 text-white relative shadow-lg"
              title="Templates - Save & load design templates (max 4 per preset, requires login)"
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
              data-tour="layers-button"
              onClick={(e) => { e.stopPropagation(); handleLayersPanelToggle(); }}
              className="w-12 h-12 bg-white/20 border border-white/30 rounded-xl backdrop-blur-xl flex items-center justify-center transition-opacity hover:opacity-80 text-white relative shadow-lg"
              title="Layers - View, reorder, lock, and manage all canvas elements"
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
                    selectedElementIds={selectedElementIds}
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
              data-tour="gallery-button"
              onClick={(e) => { e.stopPropagation(); handleGalleryPanelToggle(); }}
              className="w-12 h-12 bg-white/20 border border-white/30 rounded-xl backdrop-blur-xl flex items-center justify-center transition-opacity hover:opacity-80 text-white relative shadow-lg"
              title="Gallery - View & manage saved images (requires login, syncs across devices)"
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
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-4 md:p-8 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header removed (Sattend logo) */}

          {/* Main Grid - Fixed height layout */}
          <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Left Column - Preview */}
            <div className="lg:col-span-2 flex justify-center items-start overflow-auto">
              <CanvasPreview
                elements={elements} 
                setElements={setElements}
                selectedElementIds={selectedElementIds} 
                setSelectedElementIds={setSelectedElementIds}
                updateElement={updateElement}
                ctrlPressed={ctrlPressed}
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
                backgroundImageBlur={backgroundImageBlur}
                setBackgroundImageX={(val) => { pushToHistory(); setBackgroundImageX(val); }}
                setBackgroundImageY={(val) => { pushToHistory(); setBackgroundImageY(val); }}
                backgroundImageNaturalDimensions={backgroundImageNaturalDimensions}
                allowBackgroundDragging={activeControlPanel === 'background'}
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
                onRedo={adminSettings?.generalControls?.undoEnabled !== false ? handleRedo : null}
                canRedo={redoHistory.length > 0 && adminSettings?.generalControls?.undoEnabled !== false}
                onInteractionStart={pushToHistory}
                onSaveTemplate={handleSaveTemplate}
                isSavingTemplate={isSavingTemplate}
                adminSettings={adminSettings}
                isAdmin={isAdmin}
                isCropping={isCropping}
                onElementSelect={(elementId) => {
                  const element = elements.find(el => el.id === elementId);
                  if (element) {
                    if (element.type === 'image') setActiveControlPanel('image');
                    else if (element.type === 'text') setActiveControlPanel('text');
                    else if (element.type === 'logo' || element.type === 'shape') setActiveControlPanel('elements');
                  }
                }}
                showNotification={showNotification}
                showGrid={showGrid}
                backgroundDragAttempts={backgroundDragAttempts}
                setBackgroundDragAttempts={setBackgroundDragAttempts}
                activeControlPanel={activeControlPanel}
                handleGroupElements={handleGroupElements}
                handleUngroupElements={handleUngroupElements}
              />
            </div>

            {/* Right Column - Controls (Unified Panel) - Fixed height with scroll */}
            <div className="flex flex-col h-full overflow-hidden">
              {/* Tab/Panel Navigator */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-1 mb-4 bg-white/10 rounded-xl p-1 border border-white/20 glass-panel">
                {/* Background Panel Tab */}
                {adminSettings?.backgroundControls?.locked !== true && (
                    <button data-tour="background-tab" onClick={() => setActiveControlPanel('background')} 
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-opacity ${activeControlPanel === 'background' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/70 hover:opacity-80'}`}
                            title="Background - Set colors, gradients, or images. Add overlays and blur effects">
                        <Palette className="w-5 h-5 mb-1" />
                        Background
                    </button>
                )}
                {/* Image Panel Tab */}
                {(!adminSettings || adminSettings.imageControls?.uploadEnabled !== false) && (
                    <button data-tour="image-tab" onClick={() => setActiveControlPanel('image')} 
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-opacity ${activeControlPanel === 'image' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/70 hover:opacity-80'}`}
                            title="Image - Upload, crop, resize, and style images with borders and effects">
                        <ImageIcon className="w-5 h-5 mb-1" />
                        Image
                    </button>
                )}
                {/* Text Panel Tab */}
                <button data-tour="text-tab" onClick={() => setActiveControlPanel('text')} 
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-opacity ${activeControlPanel === 'text' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/70 hover:opacity-80'}`}
                        title="Text - Add text with custom fonts, colors, gradients, and transformations">
                    <Type className="w-5 h-5 mb-1" />
                    Text
                </button>
                {/* Elements Panel Tab */}
                {((presetRestrictions?.shapeControls?.rectangleEnabled !== false ||
                  presetRestrictions?.shapeControls?.circleEnabled !== false ||
                  presetRestrictions?.shapeControls?.lineEnabled !== false ||
                  presetRestrictions?.shapeControls?.starEnabled !== false) ||
                  (!presetRestrictions && (adminSettings?.shapeControls?.rectangleEnabled ||
                  adminSettings?.shapeControls?.circleEnabled ||
                  adminSettings?.shapeControls?.lineEnabled ||
                  adminSettings?.shapeControls?.starEnabled))
                ) && (
                    <button data-tour="elements-tab" onClick={() => setActiveControlPanel('elements')} 
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-opacity ${activeControlPanel === 'elements' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/70 hover:opacity-80'}`}
                            title="Elements - Add shapes (rectangles, circles, lines, stars) with colors and effects">
                        <Shapes className="w-5 h-5 mb-1" />
                        Elements
                    </button>
                )}
                {/* Download Panel Tab */}
                <button data-tour="download-tab" onClick={() => setActiveControlPanel('download')} 
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-opacity ${activeControlPanel === 'download' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/70 hover:opacity-80'}`}
                        title="Download - Export as PDF (PNG coming soon) or save to gallery (requires login)">
                    <Download className="w-5 h-5 mb-1" />
                    Download
                </button>
              </div>

              {/* Render active panel content - Scrollable with admin-style scrollbar */}
              <div className="flex-grow bg-white/10 glass-panel border border-white/20 rounded-xl p-4 overflow-auto panel-scroll">
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
                    backgroundImageBlur={backgroundImageBlur}
                    setBackgroundImageBlur={(val) => { pushToHistory(); setBackgroundImageBlur(val); }}
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
                    photo={selectedElementIds.length === 1 ? elements.find(el => el.id === selectedElementIds[0] && el.type === 'image') : null}
                    images={elements.filter(el => el.type === 'image' && el.src)}
                    onPhotoUpload={handlePhotoUpload}
                    updateElement={updateElement}
                    pushToHistory={pushToHistory}
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    isLoading={isLoading}
                    adminSettings={adminSettings}
                    isCropping={isCropping}
                    setIsCropping={setIsCropping}
                    selectedElementIds={selectedElementIds}
                    setSelectedElementIds={setSelectedElementIds}
                  />
                )}

                {activeControlPanel === 'text' && (
                  <Step3Text 
                    elements={elements}
                    selectedElement={selectedElementIds.length === 1 ? elements.find(el => el.id === selectedElementIds[0] && el.type === 'text') : null}
                    updateElement={updateElement}
                    addElement={addElement}
                    setSelectedElementIds={setSelectedElementIds}
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    pushToHistory={pushToHistory}
                    adminSettings={adminSettings}
                  />
                )}

                {activeControlPanel === 'elements' && ((presetRestrictions?.shapeControls?.rectangleEnabled !== false ||
                  presetRestrictions?.shapeControls?.circleEnabled !== false ||
                  presetRestrictions?.shapeControls?.lineEnabled !== false ||
                  presetRestrictions?.shapeControls?.starEnabled !== false) ||
                  (!presetRestrictions && (adminSettings?.shapeControls?.rectangleEnabled ||
                  adminSettings?.shapeControls?.circleEnabled ||
                  adminSettings?.shapeControls?.lineEnabled ||
                  adminSettings?.shapeControls?.starEnabled))
                ) && (
                  <Step4Elements 
                    elements={elements}
                    selectedElement={selectedElementIds.length === 1 ? elements.find(el => el.id === selectedElementIds[0] && ['logo', 'shape'].includes(el.type)) : null}
                    onLogoUpload={handleLogoUpload}
                    updateElement={updateElement}
                    addElement={addElement}
                    setSelectedElementIds={setSelectedElementIds}
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    pushToHistory={pushToHistory}
                    removeElement={removeElement}
                    adminSettings={presetRestrictions || adminSettings}
                  />
                )}

                {activeControlPanel === 'download' && (
                  <>
                    {console.log('🔍 ImageGenerator - Passing to Step5Download:', { regularUser, isEditMode, currentPreset })}
                    <Step5Download 
                      onDownload={handleDownload} 
                      onSave={handleSaveToGallery} 
                      isDownloading={isDownloading} 
                      isSaving={isSaving} 
                      onSaveTemplate={handleSaveTemplate}
                      isSavingTemplate={isSavingTemplate}
                      onSavePreset={saveCurrentPreset}
                      isSavingPreset={isSavingPreset}
                      isEditMode={isEditMode}
                      presetName={currentPreset?.name}
                      onSaveAsNewPreset={handleSaveCurrentAsMyPreset}
                      user={regularUser}
                      onStatsUpdate={handleStatsUpdate}
                    />
                  </>
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

      {/* Page Loading Overlay - Shows on initial page load */}
      {isPageLoading && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center gap-4 border border-white/20">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            <p className="text-white text-lg font-semibold">Loading...</p>
          </div>
        </div>
      )}

      {/* Loading Overlay - Shows when preset is loading */}
      {isLoadingPreset && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center gap-4 border border-white/20">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            <p className="text-white text-lg font-semibold">Loading Preset...</p>
          </div>
        </div>
      )}

      {/* Update Counter - For tracking code changes */}
      <div className="fixed bottom-4 left-4 z-50 bg-black/50 text-white/70 px-3 py-1 rounded text-xs font-mono">
        Update #28 - UX Improvements & Undo/Redo Fix
      </div>

      {/* Tooltip Tour */}
      {showTooltipTour && (
        <TooltipTour onComplete={() => setShowTooltipTour(false)} />
      )}

      {/* Bottom Right Controls - All 3 icons together */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-row items-center gap-2">
        {/* 1. Keyboard Shortcuts */}
        <KeyboardShortcutsHelp />
        
        {/* 2. Grid Toggle */}
        <button
          data-tour="grid-toggle-button"
          onClick={() => setShowGrid(!showGrid)}
          className={`w-12 h-12 rounded-xl ${
            showGrid ? 'bg-orange-500' : 'bg-white/20'
          } hover:bg-orange-600 border border-white/30 backdrop-blur-xl flex items-center justify-center transition-all hover:opacity-80 text-white shadow-lg`}
          title={showGrid ? "Hide Grid Overlay - Grid helps align elements precisely" : "Show Grid Overlay - Visual guide for precise positioning (won't appear in exports)"}
        >
          <Grid className="w-6 h-6" />
        </button>
        
        {/* 3. Quick Help */}
        <QuickTooltips />
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
