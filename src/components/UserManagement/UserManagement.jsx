import React, { useState, useEffect } from 'react';
import { roleService } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, User, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersData = await roleService.getAllUsersWithRoles();
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handlePromote = async (userId) => {
    if (!confirm('Promote this user to Admin? They will be able to create presets and lock features.')) {
      return;
    }

    setActionLoading(userId);
    try {
      await roleService.promoteToAdmin(userId, currentUser.id);
      await loadUsers(); // Reload to show updated roles
      alert('User promoted to Admin successfully!');
    } catch (err) {
      console.error('Failed to promote user:', err);
      alert('Failed to promote user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemote = async (userId) => {
    if (!confirm('Demote this admin to Regular User? They will lose access to admin features.')) {
      return;
    }

    setActionLoading(userId);
    try {
      await roleService.demoteToUser(userId);
      await loadUsers(); // Reload to show updated roles
      alert('User demoted to Regular User successfully!');
    } catch (err) {
      console.error('Failed to demote user:', err);
      alert('Failed to demote user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <Shield className="w-3 h-3 mr-1" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
            <Users className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-white/5 border-white/20 text-white/70">
            <User className="w-3 h-3 mr-1" />
            User
          </Badge>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-white/70 animate-spin" />
          <span className="ml-3 text-white/70">Loading users...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadUsers} variant="outline" className="bg-white/5 border-white/20 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </h3>
            <p className="text-sm text-white/60 mt-1">
              Manage user roles and permissions
            </p>
          </div>
          <Button 
            onClick={loadUsers} 
            variant="outline" 
            size="sm"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-2xl font-bold text-white">
              {users.filter(u => u.role === 'super_admin').length}
            </div>
            <div className="text-xs text-white/60">Super Admins</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-2xl font-bold text-white">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-xs text-white/60">Admins</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-2xl font-bold text-white">
              {users.filter(u => u.role === 'user').length}
            </div>
            <div className="text-xs text-white/60">Regular Users</div>
          </div>
        </div>

        {/* User List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {users.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No users found
            </div>
          ) : (
            users.map((user) => {
              const isCurrentUser = user.user_id === currentUser?.id;
              const isSuperAdmin = user.role === 'super_admin';
              const isAdmin = user.role === 'admin';
              const isRegularUser = user.role === 'user';

              return (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">
                            {user.user_id}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="bg-orange-500/20 border-orange-500/30 text-orange-300 text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-white/50 mt-1">
                          Created: {formatDate(user.created_at)}
                        </p>
                      </div>
                      <div>
                        {getRoleBadge(user.role)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {!isCurrentUser && (
                      <>
                        {isRegularUser && (
                          <Button
                            size="sm"
                            onClick={() => handlePromote(user.user_id)}
                            disabled={actionLoading === user.user_id}
                            className="bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
                          >
                            <ChevronUp className="w-4 h-4 mr-1" />
                            {actionLoading === user.user_id ? 'Promoting...' : 'Promote to Admin'}
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            size="sm"
                            onClick={() => handleDemote(user.user_id)}
                            disabled={actionLoading === user.user_id}
                            variant="outline"
                            className="bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                          >
                            <ChevronDown className="w-4 h-4 mr-1" />
                            {actionLoading === user.user_id ? 'Demoting...' : 'Demote to User'}
                          </Button>
                        )}
                        {isSuperAdmin && (
                          <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-300">
                            Protected
                          </Badge>
                        )}
                      </>
                    )}
                    {isCurrentUser && isSuperAdmin && (
                      <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-300">
                        Cannot modify own role
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-300">
            <strong>Note:</strong> Super Admins cannot be demoted. Only regular users can be promoted to Admin, and Admins can be demoted back to regular users.
          </p>
        </div>
      </div>
    </Card>
  );
}
