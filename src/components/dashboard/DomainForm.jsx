import React, { useState, useEffect } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { format, addDays, addWeeks, addMonths, addYears, parseISO } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DomainForm = ({ initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    domainName: "",
    owner: {
      firstName: "",
      lastName: "",
    },
    contact: {
      email1: "",
      email2: "",
      phone1: "",
      phone2: "",
    },
    dates: {
      startDate: new Date(),
      expiryDate: null,
    },
    package: "",
    amount: 0,
    currency: "USD", // Default currency
  });

  const [packages, setPackages] = useState([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [domainError, setDomainError] = useState("");
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    // Fetch packages from API
    const fetchPackages = async () => {
      try {
        const response = await fetch(
          "https://goldenrod-cattle-809116.hostingersite.com/getpackages.php"
        );
        const data = await response.json();
        
        if (data.status === "success") {
          // Transform package data to match our Select component format
          const formattedPackages = data.data.map(pkg => ({
            value: pkg.id.toString(), // Convert ID to string for select value
            label: pkg.packageName,
            duration: pkg.duration,
            price: pkg.amount,
            currency: pkg.currency
          }));
          setPackages(formattedPackages);
        } else {
          showNotification("error", "Failed to load packages");
          setPackages([]);
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
        showNotification("error", "Failed to load packages");
        setPackages([]);
      } finally {
        setIsLoadingPackages(false);
      }
    };

    fetchPackages();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        dates: {
          startDate: initialData.dates.startDate
            ? parseISO(initialData.dates.startDate)
            : new Date(),
          expiryDate: initialData.dates.expiryDate
            ? parseISO(initialData.dates.expiryDate)
            : null,
        },
        currency: initialData.currency || "USD", // Set currency from initial data or default to USD
      });
    }
  }, [initialData]);

  // Auto-hide notifications after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, type: "", message: "" });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const validateDomain = (domain) => {
    const pattern = /^(?!:\/\/)([a-zA-Z0-9-]+\.){1,}[a-zA-Z]{2,}$/;
    return pattern.test(domain);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "domainName") {
      if (!validateDomain(value) && value !== "") {
        setDomainError("Please enter a valid domain name (e.g., example.com)");
      } else {
        setDomainError("");
      }
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const calculateExpiryDate = (startDate, selectedPackageId) => {
    if (!startDate || !selectedPackageId) return null;

    // Find the selected package to get its duration
    const pkg = packages.find(p => p.value === selectedPackageId);
    if (!pkg) return null;

    const { value, unit } = pkg.duration;
    
    // Calculate expiry date based on duration unit
    switch(unit) {
      case 'day':
        return addDays(startDate, value);
      case 'week':
        return addWeeks(startDate, value);
      case 'month':
        return addMonths(startDate, value);
      case 'year':
        return addYears(startDate, value);
      default:
        return addMonths(startDate, value); // Default to months if unit is unknown
    }
  };

  const handlePackageChange = (e) => {
    const selectedPackageId = e.target.value;
    const pkg = packages.find(p => p.value === selectedPackageId);
    
    if (!pkg) return;

    const expiryDate = calculateExpiryDate(
      formData.dates.startDate,
      selectedPackageId
    );

    setFormData((prev) => ({
      ...prev,
      package: selectedPackageId,
      amount: pkg.price,
      currency: pkg.currency, // Set the currency from the selected package
      dates: {
        ...prev.dates,
        expiryDate,
      },
    }));
  };

  const handleStartDateChange = (date) => {
    const newDates = {
      ...formData.dates,
      startDate: date,
    };

    if (formData.package) {
      newDates.expiryDate = calculateExpiryDate(date, formData.package);
    }

    setFormData((prev) => ({
      ...prev,
      dates: newDates,
    }));
  };

  const handleExpiryDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      dates: {
        ...prev.dates,
        expiryDate: date,
      },
    }));
  };

  const handleCurrencyChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      currency: e.target.value,
    }));
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (domainError) {
      showNotification("error", "Please fix domain name errors before submitting");
      return;
    }

    if (!validateDomain(formData.domainName)) {
      showNotification("error", "Please enter a valid domain name");
      return;
    }

    // Prepare data with formatted dates
    const submissionData = {
      ...formData,
      dates: {
        startDate: format(formData.dates.startDate, "yyyy-MM-dd"),
        expiryDate: formData.dates.expiryDate
          ? format(formData.dates.expiryDate, "yyyy-MM-dd")
          : "",
      },
    };

    try {
      const response = await fetch(
        "https://goldenrod-cattle-809116.hostingersite.com/adddomain.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        showNotification("success", result.message || "Domain added successfully!");
        setFormData({
          domainName: "",
          owner: { firstName: "", lastName: "" },
          contact: { email1: "", email2: "", phone1: "", phone2: "" },
          dates: {
            startDate: new Date(),
            expiryDate: null,
          },
          package: "",
          amount: 0,
          currency: "USD", // Reset to default currency
        });
      } else if (result.message === "Domain already exists or is duplicated") {
        showNotification("error", "Domain already exists!");
      } else {
        showNotification("error", result.message || "Something went wrong");
      }
    } catch (error) {
      showNotification("error", "Network or server error");
      console.error("Error:", error);
    }
  };

  // Custom input component for date picker
  const CustomDateInput = React.forwardRef(({ value, onClick, disabled }, ref) => (
    <button
      className={`
        w-full px-3 py-2 text-xs text-left border border-gray-300 rounded-lg
        focus:ring-2 focus:ring-indigo-900 focus:border-blue-500 bg-white
        ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
      `}
      onClick={onClick}
      ref={ref}
      type="button"
      disabled={disabled}
    >
      {value || "Select date"}
      {!disabled && (
        <svg
          className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  ));
  
  // Format package options for Select component
  const packageOptions = packages.map((pkg) => {
    // Format duration based on unit and value
    const durationText = `${pkg.duration.value} ${pkg.duration.unit}${pkg.duration.value !== 1 ? 's' : ''}`;
    
    return {
      value: pkg.value,
      label: `${pkg.label} (${pkg.currency} ${pkg.price} - ${durationText})`,
    };
  });

  // Currency options
  const currencyOptions = [
    { value: "USD", label: "US Dollar", symbol: "$" },
    { value: "EUR", label: "Euro", symbol: "€" },
    { value: "GBP", label: "British Pound Sterling", symbol: "£" },
    { value: "UGX", label: "Ugandan Shilling", symbol: "USh" },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mx-auto text-xs">
      {notification.show && (
        <div 
          className={`mb-4 p-3 rounded-lg ${
            notification.type === "success" 
              ? "bg-green-100 border border-green-200 text-green-800" 
              : "bg-red-100 border border-red-200 text-red-800"
          }`}
        >
          {notification.message}
        </div>
      )}
      
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
        {initialData ? "Edit Domain" : "Register New Domain"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Domain Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Domain Information
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="domainName"
                  value={formData.domainName}
                  onChange={handleChange}
                  required
                  placeholder="example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">.com</span>
                </div>
              </div>
              {domainError && (
                <p className="mt-1 text-xs text-red-500">{domainError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Owner Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="owner.firstName"
              value={formData.owner.firstName}
              onChange={handleChange}
              required
            />
            <Input
              label="Last Name"
              name="owner.lastName"
              value={formData.owner.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Contact Details
          </h3>
          <div className="space-y-4">
            <Input
              label="Primary Email"
              name="contact.email1"
              type="email"
              value={formData.contact.email1}
              onChange={handleChange}
              required
            />
            <Input
              label="Secondary Email (Optional)"
              name="contact.email2"
              type="email"
              value={formData.contact.email2}
              onChange={handleChange}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Primary Phone"
                name="contact.phone1"
                type="tel"
                value={formData.contact.phone1}
                onChange={handleChange}
                required
              />
              <Input
                label="Secondary Phone (Optional)"
                name="contact.phone2"
                type="tel"
                value={formData.contact.phone2}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Package & Amount */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Subscription Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <Select
              label="Package"
              name="package"
              labelClassName="text-xs"
              value={formData.package}
              onChange={handlePackageChange}
              options={packageOptions}
              required
              isLoading={isLoadingPackages}
              placeholder={isLoadingPackages ? "Loading packages..." : "Select a package"}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Amount"
                name="amount"
                type="number"
                labelClassName="text-xs"
                value={formData.amount}
                onChange={handleChange}
                disabled
                className="bg-gray-50"
              />
              <Select
                label="Currency"
                name="currency"
                labelClassName="text-xs"
                value={formData.currency}
                onChange={handleCurrencyChange}
                options={currencyOptions}
                required
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Subscription Dates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="flex flex-col">
                <DatePicker
                  selected={formData.dates.startDate}
                  onChange={handleStartDateChange}
                  customInput={<CustomDateInput />}
                  dateFormat="MMMM d, yyyy"
                  className="w-full"
                  popperPlacement="bottom-start"
                />
              </div>
            </div>
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <div className="flex flex-col">
                <DatePicker
                  selected={formData.dates.expiryDate}
                  onChange={handleExpiryDateChange}
                  customInput={<CustomDateInput />}
                  dateFormat="MMMM d, yyyy"
                  className="w-full"
                  disabled={!formData.package}
                  popperPlacement="bottom-start"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-6 py-2 rounded-lg transition-colors text-xs"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-6 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-xs"
            disabled={domainError || isLoadingPackages}
          >
            {initialData ? "Update Domain" : "+ Add Domain"}
          </Button>
        </div>
      </form>

      <style dangerouslySetInnerHTML={{__html: `
        .react-datepicker {
          font-family: "Inter", sans-serif;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .react-datepicker__header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          padding-top: 0.5rem;
        }
        .react-datepicker__current-month {
          font-weight: 600;
          color: #111827;
        }
        .react-datepicker__day-name {
          color: #6b7280;
          font-weight: 500;
        }
        .react-datepicker__day {
          color: #111827;
          margin: 0.2rem;
        }
        .react-datepicker__day--selected {
          background-color: #3b82f6;
          color: white;
          border-radius: 0.375rem;
        }
        .react-datepicker__day--selected:hover {
          background-color: #2563eb;
        }
        .react-datepicker__day:hover {
          border-radius: 0.375rem;
          background-color: #f3f4f6;
        }
        .react-datepicker__navigation {
          top: 0.5rem;
        }
        .react-datepicker__navigation--previous {
          left: 1rem;
        }
        .react-datepicker__navigation--next {
          right: 1rem;
        }
      `}} />
    </div>
  );
};

export default DomainForm;