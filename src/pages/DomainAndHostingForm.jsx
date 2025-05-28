import React, { useState, useEffect } from "react";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { format, addMonths, addYears, parseISO } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const DomainAndHostingForm = ({ initialData, onCancel }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: "",
    planName: "",
    type: "Domain and Hosting",
    package: "",
    cost: 0,
    currency: "USD",
    status: "Active",
    cycle: "monthly",
    nextDueDate: null,
    domain: "",
    customer: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
    startDate: new Date(),
    method: "",
  });

  const [packages, setPackages] = useState([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [nameError, setNameError] = useState("");
  const [packageError, setPackageError] = useState("");

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch("https://goldenrod-cattle-809116.hostingersite.com/getdomainandhostingpackages.php");
        const data = await response.json();
        if (data.status === "success") {
          const formattedPackages = data.data.map((pkg) => ({
            value: pkg.packageLevel,
            label: pkg.packageName,
            cost: pkg.amount,
            currency: pkg.currency,
          }));
          setPackages(formattedPackages);
        } else {
          toast.error("Failed to load domain and hosting packages");
          setPackages([]);
        }
      } catch (error) {
        console.error("Error fetching domain and hosting packages:", error);
        toast.error("Failed to load domain and hosting packages");
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
        id: initialData.id || "",
        planName: initialData.planName || "",
        type: "Domain and Hosting",
        package: initialData.package || "",
        cost: initialData.cost || 0,
        currency: initialData.currency || "USD",
        status: initialData.status || "Active",
        cycle: initialData.cycle || "monthly",
        nextDueDate: initialData.nextDueDate ? parseISO(initialData.nextDueDate) : null,
        domain: initialData.domain || "",
        customer: {
          firstName: initialData.customer?.firstName || "",
          lastName: initialData.customer?.lastName || "",
          email: initialData.customer?.email || "",
          phone: initialData.customer?.phone || "",
        },
        startDate: initialData.startDate ? parseISO(initialData.startDate) : new Date(),
        method: initialData.method || "",
      });
    }
  }, [initialData]);

  const validateName = (name) => {
    const pattern = /^[a-zA-Z0-9-]{3,}$/;
    return pattern.test(name);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "planName") {
      if (!validateName(value) && value !== "") {
        setNameError("Please enter a valid plan name (alphanumeric, at least 3 characters)");
      } else {
        setNameError("");
      }
    }
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const calculateNextDueDate = (startDate, cycle) => {
    if (!startDate || !cycle) return null;
    switch (cycle) {
      case "monthly":
        return addMonths(startDate, 1);
      case "quarterly":
        return addMonths(startDate, 3);
      case "yearly":
        return addYears(startDate, 1);
      default:
        return addMonths(startDate, 1);
    }
  };

  const handlePackageChange = (e) => {
    const selectedPackage = packages.find((p) => p.value === e.target.value);
    if (selectedPackage) {
      setPackageError("");
      setFormData((prev) => ({
        ...prev,
        package: selectedPackage.value,
        cost: selectedPackage.cost,
        currency: selectedPackage.currency,
        nextDueDate: calculateNextDueDate(prev.startDate, prev.cycle),
      }));
    } else {
      setPackageError("Please select a valid package");
    }
  };

  const handleStartDateChange = (date) => {
    const newNextDueDate = calculateNextDueDate(date, formData.cycle);
    setFormData((prev) => ({
      ...prev,
      startDate: date,
      nextDueDate: newNextDueDate,
    }));
  };

  const handleCycleChange = (e) => {
    const newNextDueDate = calculateNextDueDate(formData.startDate, e.target.value);
    setFormData((prev) => ({
      ...prev,
      cycle: e.target.value,
      nextDueDate: newNextDueDate,
    }));
  };

  const handleCurrencyChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      currency: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nameError) {
      toast.error("Please fix plan name errors before submitting");
      return;
    }
    if (!validateName(formData.planName)) {
      toast.error("Please enter a valid plan name");
      return;
    }
    if (!formData.package) {
      setPackageError("Please select a package");
      toast.error("Please select a package");
      return;
    }
    if (!formData.nextDueDate) {
      toast.error("Please set a valid billing cycle to determine next due date");
      return;
    }

    const submissionData = {
      id: formData.id,
      planName: formData.planName,
      type: formData.type,
      package: formData.package,
      cost: parseFloat(formData.cost),
      currency: formData.currency,
      status: formData.status,
      cycle: formData.cycle,
      nextDueDate: format(formData.nextDueDate, "yyyy-MM-dd"),
      domain: formData.domain,
      customer: {
        firstName: formData.customer.firstName,
        lastName: formData.customer.lastName,
        email: formData.customer.email,
        phone: formData.customer.phone || "",
      },
      startDate: format(formData.startDate, "yyyy-MM-dd"),
      method: formData.method || "",
    };

    try {
      const endpoint = initialData
        ? "https://goldenrod-cattle-809116.hostingersite.com/updatedomainandhosting.php"
        : "https://goldenrod-cattle-809116.hostingersite.com/adddomainandhosting.php";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });
      const result = await response.json();
      if (result.status === "success") {
        toast.success(result.message || "Domain and hosting package saved successfully!");
        setFormData({
          id: "",
          planName: "",
          type: "Domain and Hosting",
          package: "",
          cost: 0,
          currency: "USD",
          status: "Active",
          cycle: "monthly",
          nextDueDate: null,
          domain: "",
          customer: { firstName: "", lastName: "", email: "", phone: "" },
          startDate: new Date(),
          method: "",
        });
        navigate("/domain-and-hosting");
      } else {
        toast.error(result.message || "Failed to save domain and hosting package");
      }
    } catch (error) {
      toast.error("Network or server error");
      console.error("Error submitting domain and hosting package:", error);
    }
  };

  const CustomDateInput = React.forwardRef(({ value, onClick, disabled }, ref) => (
    <button
      className={`
        w-full px-3 py-2 text-xs text-left border border-gray-300 rounded-lg
        focus:ring-2 focus:ring-indigo-900 focus:border-blue-500 bg-white
        ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
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

  const packageOptions = packages.map((pkg) => ({
    value: pkg.value,
    label: `${pkg.label} (${pkg.currency} ${pkg.cost})`,
  }));

  const currencyOptions = [
    { value: "USD", label: "US Dollar", symbol: "$" },
    { value: "EUR", label: "Euro", symbol: "€" },
    { value: "GBP", label: "British Pound Sterling", symbol: "£" },
    { value: "UGX", label: "Ugandan Shilling", symbol: "USh" },
  ];

  const billingCycleOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
  ];

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Expiring Soon", label: "Expiring Soon" },
    { value: "Expired", label: "Expired" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const paymentMethodOptions = [
    { value: "", label: "Select payment method" },
    { value: "Credit Card", label: "Credit Card" },
    { value: "PayPal", label: "PayPal" },
    { value: "Bank Transfer", label: "Bank Transfer" },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mx-auto text-xs max-w-4xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
        {initialData ? "Edit Domain and Hosting" : "Add New Domain and Hosting"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Domain and Hosting Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Domain and Hosting Information
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
              <input
                type="text"
                name="planName"
                value={formData.planName}
                onChange={handleChange}
                required
                placeholder="e.g., domain-plan-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              />
              {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
            </div>
            <Input
              label="Domain"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              required
              placeholder="e.g., example.com"
              className="text-xs"
            />
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="customer.firstName"
              value={formData.customer.firstName}
              onChange={handleChange}
              required
              className="text-xs"
            />
            <Input
              label="Last Name"
              name="customer.lastName"
              value={formData.customer.lastName}
              onChange={handleChange}
              required
              className="text-xs"
            />
            <Input
              label="Email"
              name="customer.email"
              type="email"
              value={formData.customer.email}
              onChange={handleChange}
              required
              className="text-xs"
            />
            <Input
              label="Phone (optional)"
              name="customer.phone"
              type="tel"
              value={formData.customer.phone}
              onChange={handleChange}
              className="text-xs"
            />
          </div>
        </div>

        {/* Package & Amount */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Domain and Hosting Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
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
              {packageError && <p className="mt-1 text-xs text-red-500">{packageError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Cost"
                name="cost"
                type="number"
                labelClassName="text-xs"
                value={formData.cost}
                onChange={handleChange}
                disabled
                className="bg-gray-50 text-xs"
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
            <Select
              label="Billing Cycle"
              name="cycle"
              value={formData.cycle}
              onChange={handleCycleChange}
              options={billingCycleOptions}
              required
              placeholder="Select billing cycle"
            />
            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              required
              placeholder="Select status"
            />
            <Select
              label="Payment Method (optional)"
              name="method"
              value={formData.method}
              onChange={handleChange}
              options={paymentMethodOptions}
              placeholder="Select payment method"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Dates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <div className="flex flex-col">
                <DatePicker
                  selected={formData.startDate}
                  onChange={handleStartDateChange}
                  customInput={<CustomDateInput />}
                  dateFormat="MMMM d, yyyy"
                  className="w-full"
                  popperPlacement="bottom-start"
                />
              </div>
            </div>
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">Next Due Date</label>
              <div className="flex flex-col">
                <DatePicker
                  selected={formData.nextDueDate}
                  onChange={(date) => setFormData((prev) => ({ ...prev, nextDueDate: date }))}
                  customInput={<CustomDateInput />}
                  dateFormat="MMMM d, yyyy"
                  className="w-full"
                  disabled
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
            disabled={nameError || packageError || isLoadingPackages}
          >
            {initialData ? "Update Domain and Hosting" : "+ Add Domain and Hosting"}
          </Button>
        </div>
      </form>

      <style dangerouslySetInnerHTML={{ __html: `
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
      ` }} />
    </div>
  );
};

export default DomainAndHostingForm;