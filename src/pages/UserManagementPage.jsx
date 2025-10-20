import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roleService, authService } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Shield, User, ChevronUp, ChevronDown, RefreshCw, ArrowLeft, Search, Mail } from 'lucide-react';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filterRole]);

  const checkAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        navigate('/');
        return;
      }

      const isSuperAdmin = await roleService.isSuperAdmin(user.id);
      if (!isSuperAdmin) {
        alert('Access denied. Super Admin only.');
        navigate('/');
        return;
      }

      setCurrentUser(user);
      loadUsers();
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/');
    }
  };

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

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.user_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    setFilteredUsers(filtered);
  };

  const handlePromote = async (userId) => {
    if (!confirm('Promote this user to Admin? They will be able to create presets and lock features.')) {
      return;
    }

    setActionLoading(userId);
    try {
      await roleService.promoteToAdmin(userId, currentUser.id);
      await loadUsers();
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
      await loadUsers();
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
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-sm px-3 py-1">
            <Shield className="w-4 h-4 mr-1" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 text-sm px-3 py-1">
            <Users className="w-4 h-4 mr-1" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-white/5 border-white/20 text-white/70 text-sm px-3 py-1">
            <User className="w-4 h-4 mr-1" />
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

  const stats = {
    superAdmins: users.filter(u => u.role === 'super_admin').length,
    admins: users.filter(u => u.role === 'admin').length,
    users: users.filter(u => u.role === 'user').length,
    total: users.length
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2a1f1a, #000000)' }}>
        <div className="flex items-center gap-3 text-white">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden p-6" style={{ background: 'linear-gradient(135deg, #2a1f1a, #000000)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="w-8 h-8" />
                User Management
              </h1>
              <p className="text-white/60 mt-1">Manage user roles and permissions</p>
            </div>
          </div>
          <Button
            onClick={loadUsers}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
            <div className="text-4xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-white/60 mt-1">Total Users</div>
          </Card>
          <Card className="glass-panel border border-purple-500/30 backdrop-blur-xl bg-purple-500/10 p-6">
            <div className="text-4xl font-bold text-purple-300">{stats.superAdmins}</div>
            <div className="text-sm text-purple-200/60 mt-1">Super Admins</div>
          </Card>
          <Card className="glass-panel border border-blue-500/30 backdrop-blur-xl bg-blue-500/10 p-6">
            <div className="text-4xl font-bold text-blue-300">{stats.admins}</div>
            <div className="text-sm text-blue-200/60 mt-1">Admins</div>
          </Card>
          <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
            <div className="text-4xl font-bold text-white">{stats.users}</div>
            <div className="text-sm text-white/60 mt-1">Regular Users</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  type="text"
                  placeholder="Search by User ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setFilterRole('all')}
                variant={filterRole === 'all' ? 'default' : 'outline'}
                className={filterRole === 'all' ? 'bg-white/20' : 'bg-white/5 border-white/20 text-white'}
              >
                All
              </Button>
              <Button
                onClick={() => setFilterRole('super_admin')}
                variant={filterRole === 'super_admin' ? 'default' : 'outline'}
                className={filterRole === 'super_admin' ? 'bg-purple-500' : 'bg-white/5 border-white/20 text-white'}
              >
                Super Admins
              </Button>
              <Button
                onClick={() => setFilterRole('admin')}
                variant={filterRole === 'admin' ? 'default' : 'outline'}
                className={filterRole === 'admin' ? 'bg-blue-500' : 'bg-white/5 border-white/20 text-white'}
              >
                Admins
              </Button>
              <Button
                onClick={() => setFilterRole('user')}
                variant={filterRole === 'user' ? 'default' : 'outline'}
                className={filterRole === 'user' ? 'bg-white/20' : 'bg-white/5 border-white/20 text-white'}
              >
                Users
              </Button>
            </div>
          </div>
        </Card>

        {/* User List */}
        <Card className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-6">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={loadUsers} variant="outline" className="bg-white/5 border-white/20 text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const isCurrentUser = user.user_id === currentUser?.id;
                const isSuperAdmin = user.role === 'super_admin';
                const isAdmin = user.role === 'admin';
                const isRegularUser = user.role === 'user';

                return (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-2">
                        {getRoleBadge(user.role)}
                        {isCurrentUser && (
                          <Badge variant="outline" className="bg-orange-500/20 border-orange-500/30 text-orange-300">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="font-mono text-sm text-white/90 mb-1">
                        {user.user_id}
                      </div>
                      <div className="text-xs text-white/50">
                        Created: {formatDate(user.created_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 ml-4">
                      {!isCurrentUser && (
                        <>
                          {isRegularUser && (
                            <Button
                              onClick={() => handlePromote(user.user_id)}
                              disabled={actionLoading === user.user_id}
                              className="bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
                            >
                              <ChevronUp className="w-4 h-4 mr-2" />
                              {actionLoading === user.user_id ? 'Changing...' : 'Change to Admin'}
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              onClick={() => handleDemote(user.user_id)}
                              disabled={actionLoading === user.user_id}
                              variant="outline"
                              className="bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                            >
                              <ChevronDown className="w-4 h-4 mr-2" />
                              {actionLoading === user.user_id ? 'Changing...' : 'Change to User'}
                            </Button>
                          )}
                          {isSuperAdmin && (
                            <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-300 px-4 py-2">
                              Protected
                            </Badge>
                          )}
                        </>
                      )}
                      {isCurrentUser && isSuperAdmin && (
                        <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-300 px-4 py-2">
                          Cannot modify own role
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Info Footer */}
        <Card className="glass-panel border border-blue-500/20 backdrop-blur-xl bg-blue-500/10 p-4">
          <p className="text-sm text-blue-300">
            <strong>Note:</strong> Super Admins cannot be demoted. Only regular users can be promoted to Admin, and Admins can be demoted back to regular users. All role changes take effect immediately.
          </p>
        </Card>
      </div>
    </div>
  );
}
