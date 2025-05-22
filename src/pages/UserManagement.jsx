import React, { useState, useEffect } from 'react';
import { FiUser, FiCheck, FiX, FiSave, FiXCircle } from 'react-icons/fi';
import { useUser } from '../context/UserContext';
import { Navigate } from 'react-router-dom';

const UserManagement = () => {
  const { userPermissions, updatePermissions } = useUser();
  const userRole = localStorage.getItem('userRole') || 'admin';

  if (userRole !== 'superadmin') {
    console.log('UserManagement: Redirecting to / - User is not superadmin');
    return <Navigate to="/" replace />;
  }

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    permissions: {
      dashboard: true,
      domains: false,
      hosting: false,
      subscriptions: false,
      birthdays: false,
      expenseSync: false,
      settings: false,
    },
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');

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

        if (result.status === 'success') {
          setUsers(result.users);
          console.log('UserManagement: Fetched users:', result.users);
        } else {
          throw new Error(result.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching users');
        console.error('UserManagement: Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const togglePermission = async (userId, permission) => {
    const user = users.find((u) => u.id === userId);
    const updatedPermissions = {
      ...user.permissions,
      [permission]: !user.permissions[permission],
    };

    // Optimistically update the UI
    setUsers(
      users.map((u) =>
        u.id === userId ? { ...u, permissions: updatedPermissions } : u
      )
    );

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/manage_users.php', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: userId,
          permissions: updatedPermissions,
        }),
      });

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to update permissions');
      }

      const loggedInEmail = localStorage.getItem('userEmail');
      if (user.email === loggedInEmail) {
        console.log('UserManagement: Updating logged-in user permissions:', updatedPermissions);
        updatePermissions(updatedPermissions); // Update UserContext
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating permissions');
      console.error('UserManagement: Error updating permissions:', err);
      // Revert UI on error
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, permissions: user.permissions } : u
        )
      );
    }
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleNewUserPermission = (permission) => {
    setNewUser({
      ...newUser,
      permissions: {
        ...newUser.permissions,
        [permission]: !newUser.permissions[permission],
      },
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/manage_users.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setUsers([...users, result.user]);
        setShowAddForm(false);
        setNewUser({
          email: '',
          name: '',
          password: '',
          permissions: {
            dashboard: true,
            domains: false,
            hosting: false,
            subscriptions: false,
            birthdays: false,
            expenseSync: false,
            settings: false,
          },
        });
        console.log('UserManagement: Added new user:', result.user);
      } else {
        throw new Error(result.message || 'Failed to add admin');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while adding the admin');
      console.error('UserManagement: Error adding user:', err);
    }
  };

  const startEditing = (user) => {
    setEditingUserId(user.id);
    setEditFormData({
      name: user.name,
      email: user.email,
      permissions: { ...user.permissions },
    });
    setEditErrors({});
    console.log('UserManagement: Started editing user:', user);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
    if (editErrors[name]) {
      setEditErrors({ ...editErrors, [name]: '' });
    }
  };

  const handleEditPermission = (permission) => {
    setEditFormData({
      ...editFormData,
      permissions: {
        ...editFormData.permissions,
        [permission]: !editFormData.permissions[permission],
      },
    });
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editFormData.name.trim()) errors.name = 'Name is required';
    if (!editFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editFormData.email)) {
      errors.email = 'Invalid email format';
    }
    return errors;
  };

  const saveEdit = async () => {
    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    const updatedUser = {
      id: editingUserId,
      name: editFormData.name,
      email: editFormData.email,
      permissions: editFormData.permissions,
    };

    // Optimistically update the UI
    setUsers(
      users.map((user) => (user.id === editingUserId ? { ...user, ...updatedUser } : user))
    );

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://goldenrod-cattle-809116.hostingersite.com/manage_users.php', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUser),
      });

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to update admin');
      }

      const loggedInEmail = localStorage.getItem('userEmail');
      if (updatedUser.email === loggedInEmail) {
        console.log('UserManagement: Updating logged-in user permissions:', updatedUser.permissions);
        updatePermissions(updatedUser.permissions); // Update UserContext
      }

      setEditingUserId(null);
      setEditFormData({});
      setEditErrors({});
      console.log('UserManagement: Successfully updated user:', updatedUser);
    } catch (err) {
      setError(err.message || 'An error occurred while updating the admin');
      console.error('UserManagement: Error updating user:', err);
      // Revert UI on error
      setUsers(
        users.map((user) =>
          user.id === editingUserId ? users.find((u) => u.id === editingUserId) : user
        )
      );
    }
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({});
    setEditErrors({});
    console.log('UserManagement: Cancelled editing');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            + Add New Admin
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>
        )}

        {showAddForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Admin User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={handleNewUserChange}
                  required
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleNewUserChange}
                  required
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleNewUserChange}
                  required
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2">
                  {Object.keys(newUser.permissions).map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newUser.permissions[permission]}
                        onChange={() => handleNewUserPermission(permission)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {permission.charAt(0).toUpperCase() + permission.slice(1)} Access
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Admin
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-semibold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-6">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    {Object.keys(newUser.permissions).map((permission) => (
                      <th
                        key={permission}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {permission.charAt(0).toUpperCase() + permission.slice(1)} Access
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === user.id ? (
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                              <FiUser size={16} />
                            </div>
                            <div className="ml-4 w-40">
                              <input
                                type="text"
                                name="name"
                                value={editFormData.name}
                                onChange={handleEditChange}
                                className={`w-full px-2 py-1 border ${
                                  editErrors.name ? 'border-red-500' : 'border-gray-300'
                                } rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                              />
                              {editErrors.name && (
                                <p className="mt-1 text-xs text-red-600">{editErrors.name}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                              <FiUser size={16} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === user.id ? (
                          <div className="w-64">
                            <input
                              type="email"
                              name="email"
                              value={editFormData.email}
                              onChange={handleEditChange}
                              className={`w-full px-2 py-1 border ${
                                editErrors.email ? 'border-red-500' : 'border-gray-300'
                              } rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            {editErrors.email && (
                              <p className="mt-1 text-xs text-red-600">{editErrors.email}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">{user.email}</span>
                        )}
                      </td>
                      {Object.keys(newUser.permissions).map((permission) => (
                        <td key={permission} className="px-6 py-4 whitespace-nowrap">
                          {editingUserId === user.id ? (
                            <input
                              type="checkbox"
                              checked={editFormData.permissions[permission]}
                              onChange={() => handleEditPermission(permission)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          ) : (
                            <button
                              onClick={() => togglePermission(user.id, permission)}
                              className="focus:outline-none"
                            >
                              {user.permissions[permission] ? (
                                <FiCheck className="text-green-500" size={20} />
                              ) : (
                                <FiX className="text-red-500" size={20} />
                              )}
                            </button>
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingUserId === user.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={saveEdit}
                              className="text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <FiSave size={16} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <FiXCircle size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(user)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;