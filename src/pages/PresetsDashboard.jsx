import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Copy, Share2, Trash2, RefreshCw, ArrowLeft, Shapes } from 'lucide-react';
import { presetService, supabase, authService } from '../lib/supabase';

export default function PresetsDashboard() {
  const navigate = useNavigate();
  const [presets, setPresets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        alert('Please log in to view your presets');
        navigate('/');
        return;
      }
      setCurrentUser(user);
      loadUserPresets(user.id);
    } catch (error) {
      console.error('Failed to get current user:', error);
      navigate('/');
    }
  };

  const loadUserPresets = async (userId) => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading presets for user ID:', userId);
      
      const { data, error } = await supabase
        .from('presets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase error loading presets:', error);
        throw error;
      }
      
      console.log('✅ Presets loaded:', data?.length || 0, 'presets found');
      console.log('📋 Preset data:', data);
      setPresets(data || []);
    } catch (error) {
      console.error('❌ Failed to load presets:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      setPresets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (presetId) => {
    navigate(`/p/${presetId}?edit=true`);
  };

  const handleDuplicate = async (preset) => {
    if (!currentUser) return;
    try {
      // Create a copy of the preset
      const { error } = await supabase
        .from('presets')
        .insert([{
          name: `${preset.name} (Copy)`,
          settings: preset.settings,
          user_id: currentUser.id,
          admin_email: null,
          is_active: true
        }]);
      
      if (error) throw error;
      loadUserPresets(currentUser.id);
    } catch (error) {
      console.error('Failed to duplicate preset:', error);
    }
  };

  const handleDelete = async (presetId) => {
    if (!currentUser) return;
    if (window.confirm('Are you sure you want to delete this preset?')) {
      try {
        await presetService.deletePreset(presetId);
        loadUserPresets(currentUser.id);
      } catch (error) {
        console.error('Failed to delete preset:', error);
      }
    }
  };

  const handleShare = (presetId) => {
    const url = `${window.location.origin}/p/${presetId}`;
    navigator.clipboard.writeText(url);
    alert('Preset URL copied to clipboard!');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2a1f1a, #000000)' }}>
      {/* Animated Background Gradient Orbs - matching generator page */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 via-transparent to-cyan-500/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              onClick={() => navigate('/')}
              className="w-10 h-10 sm:w-auto sm:h-auto bg-white/5 border border-white/10 backdrop-blur-xl text-white/70 hover:text-white transition-opacity hover:opacity-80 rounded-xl sm:rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-2xl sm:text-4xl font-bold text-white">
              Your Presets ({presets.length})
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/generator')}
              className="bg-orange-500/20 border border-orange-500/30 backdrop-blur-xl text-orange-300 hover:bg-orange-500/30 transition-all duration-300 px-4 py-2 rounded-xl"
              title="Create New Preset"
            >
              <span className="hidden sm:inline">Add New</span>
              <span className="sm:hidden text-lg">+</span>
            </Button>
            <Button
              onClick={() => currentUser && loadUserPresets(currentUser.id)}
              className="w-10 h-10 bg-white/5 border border-white/10 backdrop-blur-xl text-white/70 hover:text-white transition-opacity hover:opacity-80 rounded-xl"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Presets List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-400"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 bg-orange-500/20 rounded-full blur-xl"></div>
              </div>
            </div>
          </div>
        ) : presets.length === 0 ? (
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shapes className="w-10 h-10 text-orange-300" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No presets yet</h3>
              <p className="text-white/60 text-base mb-6">
                Create your first preset to save your favorite designs and reuse them anytime.
              </p>
              <Button
                onClick={() => navigate('/generator')}
                className="bg-orange-500/20 border border-orange-500/30 backdrop-blur-xl text-orange-300 hover:bg-orange-500/30 transition-all duration-300 px-6 py-3 rounded-xl"
              >
                Create Your First Preset
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="group bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-5 sm:p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">
                      {preset.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                      <p className="text-white/50 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                        Created {formatDate(preset.created_at)}
                      </p>
                      <p className="text-white/30 text-xs font-mono truncate hidden sm:block">
                        {window.location.origin}/p/{preset.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleEdit(preset.id)}
                      className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 backdrop-blur-xl text-orange-300 hover:bg-orange-500/20 transition-opacity hover:opacity-80 rounded-xl"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDuplicate(preset)}
                      className="w-10 h-10 bg-white/5 border border-white/10 backdrop-blur-xl text-white/70 hover:bg-white/10 transition-opacity hover:opacity-80 rounded-xl"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleShare(preset.id)}
                      className="w-10 h-10 bg-white/5 border border-white/10 backdrop-blur-xl text-white/70 hover:bg-white/10 transition-opacity hover:opacity-80 rounded-xl"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(preset.id)}
                      className="w-10 h-10 bg-red-500/10 border border-red-500/20 backdrop-blur-xl text-red-300 hover:bg-red-500/20 transition-opacity hover:opacity-80 rounded-xl"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
