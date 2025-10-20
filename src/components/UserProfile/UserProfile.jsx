import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  Palette, 
  Save, 
  LogOut, 
  Shield,
  Crown,
  Star,
  Image as ImageIcon,
  Download,
  Clock
} from 'lucide-react';
import { authService, supabase } from '../../lib/supabase';

const UserProfile = ({ 
  user, 
  isAdmin = false, 
  onClose, 
  onLogout,
  onPreferencesChange,
  onOpenPresets
}) => {
  const [userPreferences, setUserPreferences] = useState({
    theme: 'dark',
    defaultCanvasSize: 'square',
    autoSave: true,
    showTutorials: true,
    emailNotifications: false,
    defaultFontFamily: 'Inter',
    defaultFontSize: 24,
    preferredImageFormat: 'png',
    compressionQuality: 90
  });
  
  const [userStats, setUserStats] = useState({
    imagesGenerated: 0,
    templatesCreated: 0,
    lastLogin: null,
    accountCreated: null,
    totalDownloads: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  // Load user preferences and stats
  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load user preferences
      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (preferences && !prefError) {
        setUserPreferences(prev => ({ ...prev, ...preferences.preferences }));
      }
      
      // Load user stats (you can expand this based on your database structure)
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (stats && !statsError) {
        setUserStats(prev => ({ ...prev, ...stats }));
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferences: userPreferences,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 2000);
      
      // Notify parent component of preference changes
      if (onPreferencesChange) {
        onPreferencesChange(userPreferences);
      }
      
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email ? email[0].toUpperCase() : 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
              {getInitials(user?.user_metadata?.full_name, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {user?.user_metadata?.full_name || 'User'}
              {isAdmin && (
                <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-500/30">
                  <Crown className="w-3 h-3 mr-1" />
                  {user?.email === 'baciauskas.aurimas@gmail.com' ? 'Super Admin' : 'Admin'}
                </Badge>
              )}
            </h2>
            <p className="text-white/70 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white transition-colors">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white transition-colors">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-white" />
                Account Information
              </CardTitle>
              <CardDescription className="text-white/70">
                Your account details are displayed above
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/60 text-center py-8">
                Soon to be implemented.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-white" />
                User Preferences
              </CardTitle>
              <CardDescription className="text-white/70">
                Customize your experience with Sattend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">General</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white/90">Show tutorials</Label>
                    <p className="text-sm text-white/60">Display helpful tips and guides</p>
                  </div>
                  <Switch
                    checked={userPreferences.showTutorials}
                    onCheckedChange={(checked) => handlePreferenceChange('showTutorials', checked)}
                  />
                </div>

                <div className="flex items-center justify-between opacity-50">
                  <div>
                    <Label className="text-white/90">Email notifications</Label>
                    <p className="text-sm text-white/60">Receive updates and news</p>
                    <p className="text-xs text-white/40 italic mt-1">Coming soon</p>
                  </div>
                  <Switch
                    checked={false}
                    disabled={true}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-white/20">
                <Button
                  onClick={savePreferences}
                  disabled={isSaving}
                  className="w-full bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/30 text-orange-300"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : showSavedMessage ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default UserProfile;
