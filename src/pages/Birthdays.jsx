import React, { useState, useEffect } from 'react';
import { FiSearch, FiMoreVertical, FiX } from 'react-icons/fi';

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
  const [data, setData] = useState(mockData);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    birthdayFull: '',
    telephone1: '',
    telephone2: '',
    email: '',
    nextOfKin: '',
    nokTelephone1: '',
    nokTelephone2: '',
  });
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

  // Modal form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for the field when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.birthdayFull) errors.birthdayFull = 'Birthday is required';
    if (!formData.telephone1.trim()) errors.telephone1 = 'Telephone 1 is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.nextOfKin.trim()) errors.nextOfKin = 'Next of Kin is required';
    if (!formData.nokTelephone1.trim()) errors.nokTelephone1 = 'Next of Kin Telephone 1 is required';
    return errors;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Format birthday to DD/MM
    const date = new Date(formData.birthdayFull);
    const birthday = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Generate unique ID
    const newId = `B${String(data.length + 1).padStart(3, '0')}`;

    // Create new entry
    const newEntry = {
      id: newId,
      fullName: formData.fullName,
      birthday,
      birthdayFull: formData.birthdayFull,
      telephone1: formData.telephone1,
      telephone2: formData.telephone2 || '',
      email: formData.email,
      nextOfKin: formData.nextOfKin,
      nokTelephone1: formData.nokTelephone1,
      nokTelephone2: formData.nokTelephone2 || '',
    };

    // Update data
    setData([...data, newEntry]);
    setShowModal(false);
    setFormData({
      fullName: '',
      birthdayFull: '',
      telephone1: '',
      telephone2: '',
      email: '',
      nextOfKin: '',
      nokTelephone1: '',
      nokTelephone2: '',
    });
    setFormErrors({});
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      fullName: '',
      birthdayFull: '',
      telephone1: '',
      telephone2: '',
      email: '',
      nextOfKin: '',
      nokTelephone1: '',
      nokTelephone2: '',
    });
    setFormErrors({});
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
              onClick={() => setShowModal(true)}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telephone 2
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next of Kin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NoK Telephone 1
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NoK Telephone 2
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.telephone2 || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.nextOfKin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.nokTelephone1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.nokTelephone2 || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <FiMoreVertical className="text-gray-400" size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Add New Birthday</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    className={`mt-1 w-full px-3 py-2 border ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="e.g., John Doe"
                  />
                  {formErrors.fullName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Birthday *</label>
                  <input
                    type="date"
                    name="birthdayFull"
                    value={formData.birthdayFull}
                    onChange={handleFormChange}
                    className={`mt-1 w-full px-3 py-2 border ${formErrors.birthdayFull ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {formErrors.birthdayFull && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.birthdayFull}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telephone 1 *</label>
                  <input
                    type="tel"
                    name="telephone1"
                    value={formData.telephone1}
                    onChange={handleFormChange}
                    className={`mt-1 w-full px-3 py-2 border ${formErrors.telephone1 ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="e.g., +1234567890"
                  />
                  {formErrors.telephone1 && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.telephone1}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telephone 2</label>
                  <input
                    type="tel"
                    name="telephone2"
                    value={formData.telephone2}
                    onChange={handleFormChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., +1234567891"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className={`mt-1 w-full px-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="e.g., john.doe@tekjuice.co.uk"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Next of Kin *</label>
                  <input
                    type="text"
                    name="nextOfKin"
                    value={formData.nextOfKin}
                    onChange={handleFormChange}
                    className={`mt-1 w-full px-3 py-2 border ${formErrors.nextOfKin ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="e.g., Jane Doe"
                  />
                  {formErrors.nextOfKin && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.nextOfKin}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Next of Kin Telephone 1 *</label>
                  <input
                    type="tel"
                    name="nokTelephone1"
                    value={formData.nokTelephone1}
                    onChange={handleFormChange}
                    className={`mt-1 w-full px-3 py-2 border ${formErrors.nokTelephone1 ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="e.g., +1234567892"
                  />
                  {formErrors.nokTelephone1 && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.nokTelephone1}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Next of Kin Telephone 2</label>
                  <input
                    type="tel"
                    name="nokTelephone2"
                    value={formData.nokTelephone2}
                    onChange={handleFormChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., +1234567893"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-semibold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
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
              Loading data...
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