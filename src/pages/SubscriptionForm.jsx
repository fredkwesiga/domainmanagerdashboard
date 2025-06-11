import React, { useState, useEffect } from "react";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { format, addDays, addWeeks, addMonths, addYears, parseISO } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";

const SubscriptionForm = ({ initialData, onCancel }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subscriptionName: "",
    subscriptionType: "",
    customer: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
    dates: {
      startDate: new Date(),
      expiryDate: null,
    },
    package: "",
    amount: 0,
    currency: "USD",
    cycle: "",
    domain: "",
    paymentMethod: "",
  });

  const [packages, setPackages] = useState([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [nameError, setNameError] = useState("");
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    // Fetch subscription packages from API
    const fetchPackages = async () => {
      try {
        const response = await fetch(
          "https://goldenrod-cattle-809116.hostingersite.com/getsubscriptionpackages.php"
        );
        const data = await response.json();

        if (data.status === "success") {
          const formattedPackages = data.data.map((pkg) => ({
            value: pkg.id.toString(),
            label: pkg.packageName,
            duration: pkg.duration,
            price: pkg.amount,
            currency: pkg.currency,
            subscriptionType: pkg.subscriptionType,
          }));
          setPackages(formattedPackages);
        } else {
          showNotification("error", "Failed to load subscription packages");
          setPackages([]);
        }
      } catch (error) {
        console.error("Error fetching subscription packages:", error);
        showNotification("error", "Failed to load subscription packages");
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
        subscriptionName: initialData.subscriptionName || "",
        subscriptionType: initialData.subscriptionType || "",
        customer: {
          firstName: initialData.customer?.firstName || "",
          lastName: initialData.customer?.lastName || "",
          email: initialData.customer?.email || "",
          phone: initialData.customer?.phone || "",
        },
        dates: {
          startDate: initialData.dates?.startDate
            ? parseISO(initialData.dates.startDate)
            : new Date(),
          expiryDate: initialData.dates?.expiryDate
            ? parseISO(initialData.dates.expiryDate)
            : null,
        },
        package: initialData.package || "",
        amount: initialData.amount || 0,
        currency: initialData.currency || "USD",
        cycle: initialData.cycle || "",
        domain: initialData.domain || "",
        paymentMethod: initialData.paymentMethod || "",
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, type: "", message: "" });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const validateName = (name) => {
    const pattern = /^[a-zA-Z0-9-]{3,}$/;
    return pattern.test(name);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "subscriptionName") {
      if (!validateName(value) && value !== "") {
        setNameError("Please enter a valid subscription name (alphanumeric, at least 3 characters)");
      } else {
        setNameError("");
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

    const pkg = packages.find((p) => p.value === selectedPackageId);
    if (!pkg) return null;

    const { value, unit } = pkg.duration;

    switch (unit) {
      case "day":
        return addDays(startDate, value);
      case "week":
        return addWeeks(startDate, value);
      case "month":
        return addMonths(startDate, value);
      case "year":
        return addYears(startDate, value);
      default:
        return addMonths(startDate, value);
    }
  };

  const handlePackageChange = (e) => {
    const selectedPackageId = e.target.value;
    const pkg = packages.find((p) => p.value === selectedPackageId);

    if (!pkg) return;

    const expiryDate = calculateExpiryDate(formData.dates.startDate, selectedPackageId);

    setFormData((prev) => ({
      ...prev,
      package: selectedPackageId,
      subscriptionType: pkg.subscriptionType,
      amount: pkg.price,
      currency: pkg.currency,
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

    if (nameError) {
      showNotification("error", "Please fix subscription name errors before submitting");
      return;
    }

    if (!validateName(formData.subscriptionName)) {
      showNotification("error", "Please enter a valid subscription name");
      return;
    }

    if (!formData.dates.expiryDate) {
      showNotification("error", "Please select a package to set an expiry date");
      return;
    }

    const submissionData = {
      
      subscriptionName: formData.subscriptionName,
      subscriptionType: formData.subscriptionType,
      customer: {
        firstName: formData.customer.firstName,
        lastName: formData.customer.lastName,
        email: formData.customer.email,
        phone: formData.customer.phone || "", // Optional
      },
      dates: {
        startDate: format(formData.dates.startDate, "yyyy-MM-dd"),
        expiryDate: format(formData.dates.expiryDate, "yyyy-MM-dd"),
      },
      package: formData.package,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      billingCycle: formData.cycle,
      domain: formData.domain || "", // Optional
      paymentMethod: formData.paymentMethod || "", // Optional
    };
    console.log("Final submission data:", submissionData);

    try {
      const response = await fetch(
        "https://goldenrod-cattle-809116.hostingersite.com/addsubscription.php",
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
        showNotification("success", result.message || "Subscription added successfully!");
        setFormData({
          subscriptionName: "",
          subscriptionType: "",
          customer: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
          },
          dates: {
            startDate: new Date(),
            expiryDate: null,
          },
          package: "",
          amount: 0,
          currency: "USD",
          cycle: "",
          domain: "",
          paymentMethod: "",
        });
        navigate("/subscriptions");
      } else if (result.message === "Subscription already exists or is duplicated") {
        showNotification("error", "Subscription already exists!");
      } else {
        showNotification("error", result.message || "Failed to add subscription");
      }
    } catch (error) {
      showNotification("error", "Network or server error");
      console.error("Error submitting subscription:", error);
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

  const packageOptions = packages.map((pkg) => {
    const durationText = `${pkg.duration.value} ${pkg.duration.unit}${pkg.duration.value !== 1 ? "s" : ""}`;
    return {
      value: pkg.value,
      label: `${pkg.label} (${pkg.subscriptionType} - ${pkg.currency} ${pkg.price} - ${durationText})`,
    };
  });

  const currencyOptions = [
    { value: "USD", label: "US Dollar", symbol: "$" },
    { value: "EUR", label: "Euro", symbol: "€" },
    { value: "GBP", label: "British Pound Sterling", symbol: "£" },
    { value: "UGX", label: "Ugandan Shilling", symbol: "USh" },
  ];

  const subscriptionTypeOptions = [
    { value: "basic", label: "Basic Subscription" },
    { value: "standard", label: "Standard Subscription" },
    { value: "premium", label: "Premium Subscription" },
    { value: "enterprise", label: "Enterprise Subscription" },
  ];

  const billingCycleOptions = [
  { value: "Monthly", label: "Monthly" },
  { value: "Quarterly", label: "Quarterly" },
  { value: "Yearly", label: "Yearly" },
];

  const paymentMethodOptions = [
    { value: "", label: "Select payment method" },
    { value: "Credit Card", label: "Credit Card" },
    { value: "PayPal", label: "PayPal" },
    { value: "Bank Transfer", label: "Bank Transfer" },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mx-auto text-xs max-w-4xl">
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
        {initialData ? "Edit Subscription" : "Add New Subscription"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subscription Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Subscription Information
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription Name
              </label>
              <input
                type="text"
                name="subscriptionName"
                value={formData.subscriptionName}
                onChange={handleChange}
                required
                placeholder="e.g., client-subscription-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
            </div>
            <Input
              label="Domain (optional)"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              placeholder="e.g., example.com"
            />
            <Select
              label="Subscription Type"
              name="subscriptionType"
              value={formData.subscriptionType}
              onChange={handleChange}
              options={subscriptionTypeOptions}
              required
              placeholder="Select subscription type"
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
            />
            <Input
              label="Last Name"
              name="customer.lastName"
              value={formData.customer.lastName}
              onChange={handleChange}
              required
            />
            <Input
              label="Email"
              name="customer.email"
              type="email"
              value={formData.customer.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Phone (optional)"
              name="customer.phone"
              type="tel"
              value={formData.customer.phone}
              onChange={handleChange}
            />
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
            <Select
              label="Billing Cycle"
              name="cycle"
              value={formData.cycle}
              onChange={handleChange}
              options={billingCycleOptions}
              required
              placeholder="Select billing cycle"
            />
            <Select
              label="Payment Method (optional)"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              options={paymentMethodOptions}
              placeholder="Select payment method"
            />
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
            disabled={nameError || isLoadingPackages}
          >
            {initialData ? "Update Subscription" : "+ Add Subscription"}
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

export default SubscriptionForm;