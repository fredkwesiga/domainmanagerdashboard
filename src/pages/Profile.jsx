import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FiUser } from 'react-icons/fi';

const Profile = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail') || 'Unknown';
  const userRole = localStorage.getItem('userRole') || 'admin';
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'User');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user details on mount
 useEffect(() => {
  const fetchUserDetails = async () => {
    setFetchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/manage_users.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.status === 'success' && result.users.length > 0) {
        // Find user matching the logged-in email
        const user = result.users.find((u) => u.email === userEmail);
        if (user) {
          setUserName(user.name);
          localStorage.setItem('userName', user.name);
          localStorage.setItem('userRole', user.role);
          localStorage.setItem('permissions', JSON.stringify(user.permissions || {})); // Store permissions
          console.log('Profile: Fetched user details:', user);
        } else {
          throw new Error('User not found');
        }
      } else {
        throw new Error(result.message || 'Failed to fetch user details');
      }
    } catch (err) {
      console.error('Profile: Error fetching user details:', err);
      toast.error(err.message || 'Failed to load user details', { position: 'top-right', autoClose: 2000 });
    } finally {
      setFetchLoading(false);
    }
  };

  fetchUserDetails();
}, [userEmail]);

  // useEffect(() => {
  //   const fetchUserDetails = async () => {
  //     setFetchLoading(true);
  //     try {
  //       const token = localStorage.getItem('token');
  //       const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/manage_users.php', {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'Authorization': `Bearer ${token}`,
  //         },
  //       });

  //       const result = await response.json();
  //       if (result.status === 'success') {
  //         const user = result.users.find((u) => u.email === userEmail);
  //         if (user) {
  //           setUserName(user.name);
  //           localStorage.setItem('userName', user.name);
  //           console.log('Profile: Fetched user details:', user);
  //         } else {
  //           toast.error('User not found', { position: 'top-right', autoClose: 2000 });
  //         }
  //       } else {
  //         throw new Error(result.message || 'Failed to fetch user details');
  //       }
  //     } catch (err) {
  //       console.error('Profile: Error fetching user details:', err);
  //       toast.error('Failed to load user details', { position: 'top-right', autoClose: 2000 });
  //     } finally {
  //       setFetchLoading(false);
  //     }
  //   };

  //   fetchUserDetails();
  // }, [userEmail]);

  const validateForm = () => {
    const newErrors = {};
    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Client-side validation
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.error('Please fix form errors', { position: 'top-right', autoClose: 2000 });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/update_password.php', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userEmail,
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Password updated successfully!', { position: 'top-right', autoClose: 2000 });
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(result.message || 'Failed to update password');
      }
    } catch (err) {
      console.error('Profile: Error updating password:', err);
      setErrors({ api: err.message || 'Failed to update password' });
      toast.error(err.message || 'Failed to update password', { position: 'top-right', autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

        {/* User Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          {fetchLoading ? (
            <p className="text-gray-600">Loading user details...</p>
          ) : (
            <>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-900 flex items-center justify-center text-white mr-4">
                  <FiUser size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 capitalize">{userName}</h2>
                  <p className="text-sm text-gray-500">{userEmail}</p>
                  <p className="text-sm text-gray-500 capitalize">{userRole} User</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                  User Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Full Name:</span>
                    <p className="font-medium text-gray-800 capitalize">{userName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium text-gray-800">{userEmail}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Role:</span>
                    <p className="font-medium text-gray-800 capitalize">{userRole}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Change Password</h3>
          {errors.api && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg">{errors.api}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-8 text-gray-500"
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
              {errors.currentPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.currentPassword}</p>
              )}
            </div>
            <div className="relative">
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-8 text-gray-500"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>
              )}
            </div>
            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-8 text-gray-500"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={() => navigate('/')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-900 hover:bg-indigo-600 text-white px-6 py-2"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;