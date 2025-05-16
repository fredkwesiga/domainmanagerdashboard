import React, { useState, useEffect } from 'react';
import { FiSearch, FiMoreVertical, FiX, FiEye, FiEdit, FiTrash } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Mock data for Birthdays
const mockData = [
  {
    id: 'B001',
    fullName: 'Shamuza Tekjuice',
    birthday: '15/06',
    birthdayFull: '1990-06-15',
    telephone1: '+256234567890',
    telephone2: '+1234567891',
    email: 'shamuza@tekjuice.co.uk',
    nextOfKin: 'Jane Doe',
    nokTelephone1: '+1234567892',
    nokTelephone2: '+1234567893',
  },
  {
    id: 'B002',
    fullName: 'Jane Smith',
    birthday: '20/05',
    birthdayFull: '1985-05-20',
    telephone1: '+1234567894',
    telephone2: '',
    email: 'jane.smith@tekjuice.co.uk',
    nextOfKin: 'Bob Smith',
    nokTelephone1: '+1234567895',
    nokTelephone2: '',
  },
  {
    id: 'B003',
    fullName: 'Alice Johnson',
    birthday: '10/05',
    birthdayFull: '1992-05-10',
    telephone1: '+1234567896',
    telephone2: '+1234567897',
    email: 'alice.johnson@tekjuice.co.uk',
    nextOfKin: 'Tom Johnson',
    nokTelephone1: '+1234567898',
    nokTelephone2: '+1234567899',
  },
];

const Birthdays = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(mockData);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editingPerson, setEditingPerson] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Simulate email notification for birthdays within 7 days
  const checkBirthdays = () => {
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    data.forEach((person) => {
      const [day, month] = person.birthday.split('/');
      const birthdayThisYear = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
      
      if (birthdayThisYear < today) {
        birthdayThisYear.setFullYear(today.getFullYear() + 1);
      }

      if (
        birthdayThisYear >= today &&
        birthdayThisYear <= sevenDaysFromNow
      ) {
        console.log(`Sending email notification for ${person.fullName}'s birthday on ${person.birthday}`);
        simulateEmailNotification(person);
      }
    });
  };

  const simulateEmailNotification = (person) => {
    console.log(`Email sent to admins: Birthday alert for ${person.fullName} on ${person.birthday}`);
  };

  // Filter data based on search query
  const filterData = () => {
    let filtered = data;
    if (searchQuery) {
      filtered = data.filter((person) =>
        person.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.nextOfKin.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredData(filtered);
  };

  useEffect(() => {
    setFilteredData(data);
    checkBirthdays();
  }, [data]);

  useEffect(() => {
    filterData();
  }, [searchQuery]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAdd = () => {
    navigate('/birthdays/add');
  };

  const handleEdit = (person) => {
    setEditingPerson({ ...person });
    setShowEditModal(true);
    setDropdownOpen(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingPerson((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editingPerson.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!editingPerson.birthdayFull) errors.birthdayFull = 'Birthday is required';
    if (!editingPerson.telephone1.trim()) errors.telephone1 = 'Telephone 1 is required';
    if (!editingPerson.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editingPerson.email)) {
      errors.email = 'Invalid email format';
    }
    if (!editingPerson.nextOfKin.trim()) errors.nextOfKin = 'Next of Kin is required';
    if (!editingPerson.nokTelephone1.trim()) errors.nokTelephone1 = 'Next of Kin Telephone 1 is required';
    return errors;
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix form errors before submitting', {
        position: 'top-right',
        autoClose: 2000,
      });
      return;
    }

    const updatedPerson = {
      ...editingPerson,
      birthday: editingPerson.birthdayFull
        ? `${String(new Date(editingPerson.birthdayFull).getDate()).padStart(2, '0')}/${String(
            new Date(editingPerson.birthdayFull).getMonth() + 1
          ).padStart(2, '0')}`
        : editingPerson.birthday,
    };

    setData((prev) =>
      prev.map((item) => (item.id === updatedPerson.id ? updatedPerson : item))
    );
    toast.success('Birthday updated successfully!', {
      position: 'top-right',
      autoClose: 2000,
    });
    setShowEditModal(false);
    setEditingPerson(null);
    setFormErrors({});
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const updatedData = data.filter((item) => item.id !== id);
      setData(updatedData);
      setDropdownOpen(null);
      toast.success('Birthday deleted successfully!', {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (err) {
      setError(err.message || 'Failed to delete person');
      toast.error('Failed to delete birthday', {
        position: 'top-right',
        autoClose: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (person) => {
    setSelectedPerson(person);
    setShowViewModal(true);
    setDropdownOpen(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Birthdays</h1>
        </div>

        {/* Search and Add Button */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full max-w-xs">
              <FiSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search birthdays..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              + Add New Birthday
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Birthday
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telephone 1
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((person) => (
                  <tr key={person.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {person.fullName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {person.fullName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.birthday}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.telephone1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <FiMoreVertical
                          className="text-gray-400 cursor-pointer"
                          size={16}
                          onClick={() => setDropdownOpen(dropdownOpen === person.id ? null : person.id)}
                        />
                        {dropdownOpen === person.id && (
                          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                              <button
                                onClick={() => handleView(person)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                role="menuitem"
                              >
                                <FiEye className="mr-2" size={16} />
                                View Details
                              </button>
                              <button
                                onClick={() => handleEdit(person)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                role="menuitem"
                              >
                                <FiEdit className="mr-2" size={16} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(person.id)}
                                className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-gray-100 w-full text-left"
                                role="menuitem"
                              >
                                <FiTrash className="mr-2" size={16} />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Modal */}
        {showViewModal && selectedPerson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              {/* Header */}
              <div className="bg-indigo-800 text-white p-3 rounded-t-lg flex justify-between items-center">
                <h2 className="text-xl font-bold">Birthday Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-white hover:text-gray-200 focus:outline-none"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              {/* Status badge and name */}
              <div className="bg-indigo-800 text-white px-3 pb-3 flex items-center">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                  Active
                </span>
                <span className="text-lg">{selectedPerson.fullName}</span>
              </div>
              
              {/* Personal Information Section */}
              <div className="p-4">
                <div className="flex items-start mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-indigo-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-gray-500">Full Name</div>
                      <div className="text-right font-medium">{selectedPerson.fullName}</div>
                      <div className="text-gray-500">Birthday</div>
                      <div className="text-right font-medium">{selectedPerson.birthday}</div>
                      <div className="text-gray-500">Telephone 1</div>
                      <div className="text-right font-medium">{selectedPerson.telephone1}</div>
                      <div className="text-gray-500">Telephone 2</div>
                      <div className="text-right font-medium">{selectedPerson.telephone2 || 'N/A'}</div>
                      <div className="text-gray-500">Email</div>
                      <div className="text-right font-medium truncate">{selectedPerson.email}</div>
                    </div>
                  </div>
                </div>
                
                {/* Next of Kin Section */}
                <div className="flex items-start">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Next of Kin</h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-gray-500">Name</div>
                      <div className="text-right font-medium">{selectedPerson.nextOfKin}</div>
                      <div className="text-gray-500">Telephone 1</div>
                      <div className="text-right font-medium">{selectedPerson.nokTelephone1}</div>
                      <div className="text-gray-500">Telephone 2</div>
                      <div className="text-right font-medium">{selectedPerson.nokTelephone2 || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer button */}
              <div className="p-3 rounded-b-lg">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full py-2 bg-indigo-800 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm"
                >
                  Close Overview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingPerson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-4">
              <h2 className="text-xl font-bold mb-4">Edit Birthday</h2>
              
              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label className="block text-gray-700 text-sm mb-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={editingPerson.fullName}
                    onChange={handleEditChange}
                    required
                    placeholder="e.g., John Doe"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formErrors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.fullName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm mb-1">Birthday</label>
                  <input
                    type="date"
                    name="birthdayFull"
                    value={editingPerson.birthdayFull}
                    onChange={handleEditChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formErrors.birthdayFull && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.birthdayFull}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Primary Telephone</label>
                    <input
                      type="tel"
                      name="telephone1"
                      value={editingPerson.telephone1}
                      onChange={handleEditChange}
                      required
                      placeholder="e.g., +1234567890"
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {formErrors.telephone1 && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.telephone1}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Secondary Telephone (Optional)</label>
                    <input
                      type="tel"
                      name="telephone2"
                      value={editingPerson.telephone2}
                      onChange={handleEditChange}
                      placeholder="e.g., +1234567891"
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editingPerson.email}
                    onChange={handleEditChange}
                    required
                    placeholder="e.g., john.doe@example.com"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Next of Kin Name</label>
                    <input
                      type="text"
                      name="nextOfKin"
                      value={editingPerson.nextOfKin}
                      onChange={handleEditChange}
                      required
                      placeholder="e.g., Jane Doe"
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {formErrors.nextOfKin && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.nextOfKin}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Next of Kin Telephone 1</label>
                    <input
                      type="tel"
                      name="nokTelephone1"
                      value={editingPerson.nokTelephone1}
                      onChange={handleEditChange}
                      required
                      placeholder="e.g., +1234567892"
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {formErrors.nokTelephone1 && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.nokTelephone1}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm mb-1">Next of Kin Telephone 2 (Optional)</label>
                  <input
                    type="tel"
                    name="nokTelephone2"
                    value={editingPerson.nokTelephone2}
                    onChange={handleEditChange}
                    placeholder="e.g., +1234567893"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPerson(null);
                      setFormErrors({});
                    }}
                    className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-800 hover:bg-indigo-900 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-500"
                    disabled={Object.keys(formErrors).length > 0}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading and Error States */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-900 transition ease-in-out duration-150 cursor-not-allowed">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Birthdays;