import React, { useState } from 'react';
import { FiUser, FiCheck, FiX, FiSave, FiXCircle } from 'react-icons/fi';

const initialUsers = [
  { id: '1', email: 'admin1@tekjuice.co.uk', name: 'Admin One', permissions: { dashboard: true, domains: true, hosting: false, subscriptions: false, birthdays: false, expenseSync: false } },
  { id: '2', email: 'admin2@tekjuice.co.uk', name: 'Admin Two', permissions: { dashboard: true, domains: false, hosting: true, subscriptions: false, birthdays: false, expenseSync: false } },
];

const UserManagement = () => {
  const [users, setUsers] = useState(initialUsers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    permissions: { dashboard: true, domains: false, hosting: false, subscriptions: false, birthdays: false, expenseSync: false },
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});

  const togglePermission = (userId, permission) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          permissions: {
            ...user.permissions,
            [permission]: !user.permissions[permission],
          },
        };
      }
      return user;
    }));
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

  const handleAddUser = (e) => {
    e.preventDefault();
    const newId = (users.length + 1).toString();
    setUsers([...users, { ...newUser, id: newId }]);
    setShowAddForm(false);
    setNewUser({
      email: '',
      name: '',
      password: '',
      permissions: { dashboard: true, domains: false, hosting: false, subscriptions: false, birthdays: false, expenseSync: false },
    });
  };

  const startEditing = (user) => {
    setEditingUserId(user.id);
    setEditFormData({
      name: user.name,
      email: user.email,
      permissions: { ...user.permissions },
    });
    setEditErrors({});
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

  const saveEdit = () => {
    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setUsers(users.map(user => {
      if (user.id === editingUserId) {
        return {
          ...user,
          name: editFormData.name,
          email: editFormData.email,
          permissions: { ...editFormData.permissions },
        };
      }
      return user;
    }));

    // Log for future API integration
    console.log('API PATCH /users/:id payload:', {
      id: editingUserId,
      name: editFormData.name,
      email: editFormData.email,
      permissions: editFormData.permissions,
    });

    setEditingUserId(null);
    setEditFormData({});
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({});
    setEditErrors({});
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
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.dashboard}
                      onChange={() => handleNewUserPermission('dashboard')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Dashboard Access</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.domains}
                      onChange={() => handleNewUserPermission('domains')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Domains Access</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.hosting}
                      onChange={() => handleNewUserPermission('hosting')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Hosting Access</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.subscriptions}
                      onChange={() => handleNewUserPermission('subscriptions')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Subscriptions Access</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.birthdays}
                      onChange={() => handleNewUserPermission('birthdays')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Birthdays Access</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.expenseSync}
                      onChange={() => handleNewUserPermission('expenseSync')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">ExpenseSync Access</span>
                  </label>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dashboard Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domains Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hosting Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscriptions Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Birthdays Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ExpenseSync Access
                  </th>
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
                              className={`w-full px-2 py-1 border ${editErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
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
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
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
                            className={`w-full px-2 py-1 border ${editErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                          />
                          {editErrors.email && (
                            <p className="mt-1 text-xs text-red-600">{editErrors.email}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">{user.email}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === user.id ? (
                        <input
                          type="checkbox"
                          checked={editFormData.permissions.dashboard}
                          onChange={() => handleEditPermission('dashboard')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      ) : (
                        <button
                          onClick={() => togglePermission(user.id, 'dashboard')}
                          className="focus:outline-none"
                        >
                          {user.permissions.dashboard ? (
                            <FiCheck className="text-green-500" size={20} />
                          ) : (
                            <FiX className="text-red-500" size={20} />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === user.id ? (
                        <input
                          type="checkbox"
                          checked={editFormData.permissions.domains}
                          onChange={() => handleEditPermission('domains')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      ) : (
                        <button
                          onClick={() => togglePermission(user.id, 'domains')}
                          className="focus:outline-none"
                        >
                          {user.permissions.domains ? (
                            <FiCheck className="text-green-500" size={20} />
                          ) : (
                            <FiX className="text-red-500" size={20} />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === user.id ? (
                        <input
                          type="checkbox"
                          checked={editFormData.permissions.hosting}
                          onChange={() => handleEditPermission('hosting')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      ) : (
                        <button
                          onClick={() => togglePermission(user.id, 'hosting')}
                          className="focus:outline-none"
                        >
                          {user.permissions.hosting ? (
                            <FiCheck className="text-green-500" size={20} />
                          ) : (
                            <FiX className="text-red-500" size={20} />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === user.id ? (
                        <input
                          type="checkbox"
                          checked={editFormData.permissions.subscriptions}
                          onChange={() => handleEditPermission('subscriptions')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      ) : (
                        <button
                          onClick={() => togglePermission(user.id, 'subscriptions')}
                          className="focus:outline-none"
                        >
                          {user.permissions.subscriptions ? (
                            <FiCheck className="text-green-500" size={20} />
                          ) : (
                            <FiX className="text-red-500" size={20} />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === user.id ? (
                        <input
                          type="checkbox"
                          checked={editFormData.permissions.birthdays}
                          onChange={() => handleEditPermission('birthdays')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      ) : (
                        <button
                          onClick={() => togglePermission(user.id, 'birthdays')}
                          className="focus:outline-none"
                        >
                          {user.permissions.birthdays ? (
                            <FiCheck className="text-green-500" size={20} />
                          ) : (
                            <FiX className="text-red-500" size={20} />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === user.id ? (
                        <input
                          type="checkbox"
                          checked={editFormData.permissions.expenseSync}
                          onChange={() => handleEditPermission('expenseSync')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      ) : (
                        <button
                          onClick={() => togglePermission(user.id, 'expenseSync')}
                          className="focus:outline-none"
                        >
                          {user.permissions.expenseSync ? (
                            <FiCheck className="text-green-500" size={20} />
                          ) : (
                            <FiX className="text-red-500" size={20} />
                          )}
                        </button>
                      )}
                    </td>
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
      </div>
    </div>
  );
};

export default UserManagement;