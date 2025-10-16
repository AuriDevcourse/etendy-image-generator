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
  onPreferencesChange 
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
                  Admin
                </Badge>
              )}
            </h2>
            <p className="text-white/70 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          className="text-white/70 hover:text-white"
        >
          ×
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/10 border border-white/20">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white/20">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-white/20">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-white/20">
            <Star className="w-4 h-4 mr-2" />
            Stats
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription className="text-white/70">
                Your account details and basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/90">Full Name</Label>
                  <Input
                    value={user?.user_metadata?.full_name || ''}
                    readOnly
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white/90">Email</Label>
                  <Input
                    value={user?.email || ''}
                    readOnly
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/90">Account Created</Label>
                  <Input
                    value={formatDate(user?.created_at)}
                    readOnly
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white/90">Last Sign In</Label>
                  <Input
                    value={formatDate(user?.last_sign_in_at)}
                    readOnly
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/20">
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full bg-red-500/20 border border-red-500/30 hover:bg-red-500/30"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                User Preferences
              </CardTitle>
              <CardDescription className="text-white/70">
                Customize your experience with Etendy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">General</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white/90">Auto-save projects</Label>
                    <p className="text-sm text-white/60">Automatically save your work</p>
                  </div>
                  <Switch
                    checked={userPreferences.autoSave}
                    onCheckedChange={(checked) => handlePreferenceChange('autoSave', checked)}
                  />
                </div>

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

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white/90">Email notifications</Label>
                    <p className="text-sm text-white/60">Receive updates and news</p>
                  </div>
                  <Switch
                    checked={userPreferences.emailNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                  />
                </div>
              </div>

              {/* Design Preferences */}
              <div className="space-y-4 pt-4 border-t border-white/20">
                <h3 className="text-lg font-semibold text-white">Design Defaults</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/90">Default Canvas Size</Label>
                    <Select
                      value={userPreferences.defaultCanvasSize}
                      onValueChange={(value) => handlePreferenceChange('defaultCanvasSize', value)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square (1:1)</SelectItem>
                        <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                        <SelectItem value="portrait">Portrait (9:16)</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white/90">Default Font</Label>
                    <Select
                      value={userPreferences.defaultFontFamily}
                      onValueChange={(value) => handlePreferenceChange('defaultFontFamily', value)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Archivo Expanded">Archivo Expanded</SelectItem>
                        <SelectItem value="DM Serif Text">DM Serif Text</SelectItem>
                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/90">Default Font Size</Label>
                    <Input
                      type="number"
                      value={userPreferences.defaultFontSize}
                      onChange={(e) => handlePreferenceChange('defaultFontSize', parseInt(e.target.value))}
                      className="bg-white/5 border-white/20 text-white"
                      min="8"
                      max="200"
                    />
                  </div>

                  <div>
                    <Label className="text-white/90">Export Format</Label>
                    <Select
                      value={userPreferences.preferredImageFormat}
                      onValueChange={(value) => handlePreferenceChange('preferredImageFormat', value)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpg">JPG</SelectItem>
                        <SelectItem value="webp">WebP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-white/20">
                <Button
                  onClick={savePreferences}
                  disabled={isSaving}
                  className="w-full bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30"
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

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="w-5 h-5" />
                Your Stats
              </CardTitle>
              <CardDescription className="text-white/70">
                Track your creative journey with Etendy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <ImageIcon className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{userStats.imagesGenerated}</p>
                      <p className="text-sm text-white/70">Images Generated</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Download className="w-5 h-5 text-green-300" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{userStats.totalDownloads}</p>
                      <p className="text-sm text-white/70">Downloads</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Save className="w-5 h-5 text-purple-300" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{userStats.templatesCreated}</p>
                      <p className="text-sm text-white/70">Templates Created</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{formatDate(userStats.lastLogin)}</p>
                      <p className="text-sm text-white/70">Last Login</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
