import React, { useState, useEffect } from "react";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const HostingForm = ({ initialData, onSubmit, onCancel, isEditMode = false }) => {
  const [formData, setFormData] = useState(
    initialData || {
      domainName: "",
      hostingType: "",
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
      currency: "USD",
      invoiceStatus: "Pending",
      serverDetails: {
        ipAddress: "",
        nameservers: ["", ""],
        diskSpace: "",
        bandwidth: "",
      },
    }
  );

  const [packages, setPackages] = useState([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [domainError, setDomainError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch(
          "https://goldenrod-cattle-809116.hostingersite.com/gethostingpackages.php"
        );
        const data = await response.json();

        if (data.status === "success") {
          const formattedPackages = data.data.map((pkg) => ({
            value: pkg.id.toString(),
            label: pkg.packageName,
            duration: pkg.duration,
            price: pkg.amount,
            currency: pkg.currency,
            hostingType: pkg.hostingType,
          }));
          setPackages(formattedPackages);
        } else {
          toast.error("Failed to load hosting packages");
          setPackages([]);
        }
      } catch (error) {
        console.error("Error fetching hosting packages:", error);
        toast.error("Failed to load hosting packages");
        setPackages([]);
      } finally {
        setIsLoadingPackages(false);
      }
    };

    fetchPackages();
  }, []);

  const validateDomain = (domain) => {
    const pattern = /^(?!:\/\/)([a-zA-Z0-9-]+\.){1,}[a-zA-Z]{2,}$/;
    return pattern.test(domain);
  };

  const validateForm = () => {
    const errors = {};
    if (!validateDomain(formData.domainName)) {
      errors.domainName = "Please enter a valid domain name (e.g., example.com)";
    }
    if (!formData.owner.firstName.trim()) {
      errors["owner.firstName"] = "First name is required";
    }
    if (!formData.owner.lastName.trim()) {
      errors["owner.lastName"] = "Last name is required";
    }
    if (!formData.contact.email1.trim()) {
      errors["contact.email1"] = "Primary email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.contact.email1)) {
      errors["contact.email1"] = "Please enter a valid email address";
    }
    if (!formData.contact.phone1.trim()) {
      errors["contact.phone1"] = "Primary phone is required";
    }
    if (!formData.package) {
      errors.package = "Please select a hosting package";
    }
    if (!formData.dates.expiryDate) {
      errors["dates.expiryDate"] = "Expiry date is required";
    }
    return errors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "domainName") {
      if (!validateDomain(value) && value !== "") {
        setDomainError("Please enter a valid domain name (e.g., example.com)");
      } else {
        setDomainError("");
      }
    }

    if (name === "invoiceStatus") {
      setFormData((prev) => ({
        ...prev,
        invoiceStatus: checked ? "Invoiced" : "Pending",
      }));
    } else if (name.includes(".")) {
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

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleNameserverChange = (index, value) => {
    const newNameservers = [...formData.serverDetails.nameservers];
    newNameservers[index] = value;
    setFormData((prev) => ({
      ...prev,
      serverDetails: {
        ...prev.serverDetails,
        nameservers: newNameservers,
      },
    }));
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
      hostingType: pkg.hostingType,
      amount: pkg.price,
      currency: pkg.currency,
      dates: {
        ...prev.dates,
        expiryDate,
      },
    }));

    setFormErrors((prev) => ({
      ...prev,
      package: "",
      "dates.expiryDate": "",
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

    setFormErrors((prev) => ({
      ...prev,
      "dates.expiryDate": "",
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

    setFormErrors((prev) => ({
      ...prev,
      "dates.expiryDate": "",
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

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill all required fields correctly");
      return;
    }

    setIsSubmitting(true);
    const submissionData = {
      domainName: formData.domainName,
      hostingType: formData.hostingType,
      owner: {
        firstName: formData.owner.firstName,
        lastName: formData.owner.lastName,
      },
      contact: {
        email1: formData.contact.email1,
        email2: formData.contact.email2,
        phone1: formData.contact.phone1,
        phone2: formData.contact.phone2,
      },
      dates: {
        startDate: format(formData.dates.startDate, "yyyy-MM-dd"),
        expiryDate: formData.dates.expiryDate
          ? format(formData.dates.expiryDate, "yyyy-MM-dd")
          : "",
      },
      package: formData.package,
      amount: formData.amount,
      currency: formData.currency,
      invoiceStatus: formData.invoiceStatus,
      serverDetails: {
        ipAddress: formData.serverDetails.ipAddress,
        nameservers: formData.serverDetails.nameservers,
        diskSpace: formData.serverDetails.diskSpace,
        bandwidth: formData.serverDetails.bandwidth,
      },
    };

    try {
      if (isEditMode) {
        await onSubmit(submissionData);
      } else {
        const response = await fetch(
          "https://goldenrod-cattle-809116.hostingersite.com/addhosting.php",
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
          toast.success(result.message || "Hosting added successfully!");
          setFormData({
            domainName: "",
            hostingType: "",
            owner: { firstName: "", lastName: "" },
            contact: { email1: "", email2: "", phone1: "", phone2: "" },
            dates: {
              startDate: new Date(),
              expiryDate: null,
            },
            package: "",
            amount: 0,
            currency: "USD",
            invoiceStatus: "Pending",
            serverDetails: {
              ipAddress: "",
              nameservers: ["", ""],
              diskSpace: "",
              bandwidth: "",
            },
          });
          setFormErrors({});
          if (!isEditMode) {
            setTimeout(() => (window.location.href = "/hosting"), 2000);
          }
        } else {
          toast.error(result.message || "Failed to add hosting");
        }
      }
    } catch (error) {
      toast.error("Network or server error");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
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
      label: `${pkg.label} (${pkg.hostingType} - ${pkg.currency} ${pkg.price} - ${durationText})`,
    };
  });

  const currencyOptions = [
    { value: "USD", label: "US Dollar", symbol: "$" },
    { value: "EUR", label: "Euro", symbol: "€" },
    { value: "GBP", label: "British Pound Sterling", symbol: "£" },
    { value: "UGX", label: "Ugandan Shilling", symbol: "USh" },
  ];

  const hostingTypeOptions = [
    { value: "shared", label: "Shared Hosting" },
    { value: "vps", label: "VPS Hosting" },
    { value: "dedicated", label: "Dedicated Server" },
    { value: "reseller", label: "Reseller Hosting" },
    { value: "cloud", label: "Cloud Hosting" },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mx-auto text-xs">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
        {isEditMode ? "Edit Hosting" : "Add New Hosting"}
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
                Hosting Name
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
              {formErrors.domainName && (
                <p className="mt-1 text-xs text-red-500">{formErrors.domainName}</p>
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
            <div>
              <Input
                label="First Name"
                name="owner.firstName"
                value={formData.owner.firstName}
                onChange={handleChange}
                required
              />
              {formErrors["owner.firstName"] && (
                <p className="mt-1 text-xs text-red-500">{formErrors["owner.firstName"]}</p>
              )}
            </div>
            <div>
              <Input
                label="Last Name"
                name="owner.lastName"
                value={formData.owner.lastName}
                onChange={handleChange}
                required
              />
              {formErrors["owner.lastName"] && (
                <p className="mt-1 text-xs text-red-500">{formErrors["owner.lastName"]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Contact Details
          </h3>
          <div className="space-y-4">
            <div>
              <Input
                label="Primary Email"
                name="contact.email1"
                type="email"
                value={formData.contact.email1}
                onChange={handleChange}
                required
              />
              {formErrors["contact.email1"] && (
                <p className="mt-1 text-xs text-red-500">{formErrors["contact.email1"]}</p>
              )}
            </div>
            <Input
              label="Secondary Email (Optional)"
              name="contact.email2"
              type="email"
              value={formData.contact.email2}
              onChange={handleChange}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Primary Phone"
                  name="contact.phone1"
                  type="tel"
                  value={formData.contact.phone1}
                  onChange={handleChange}
                  required
                />
                {formErrors["contact.phone1"] && (
                  <p className="mt-1 text-xs text-red-500">{formErrors["contact.phone1"]}</p>
                )}
              </div>
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

        {/* Server Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Server Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="IP Address"
              name="serverDetails.ipAddress"
              value={formData.serverDetails.ipAddress}
              onChange={handleChange}
              placeholder="192.168.1.1"
            />
            <Input
              label="Disk Space"
              name="serverDetails.diskSpace"
              value={formData.serverDetails.diskSpace}
              onChange={handleChange}
              placeholder="e.g., 10GB"
            />
            <Input
              label="Bandwidth"
              name="serverDetails.bandwidth"
              value={formData.serverDetails.bandwidth}
              onChange={handleChange}
              placeholder="e.g., Unlimited or 100GB"
            />
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Nameservers</label>
              {formData.serverDetails.nameservers.map((ns, index) => (
                <Input
                  key={index}
                  value={ns}
                  onChange={(e) => handleNameserverChange(index, e.target.value)}
                  placeholder={`NS${index + 1} (e.g., ns${index + 1}.example.com)`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Package & Amount */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Hosting Plan
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
              {formErrors.package && (
                <p className="mt-1 text-xs text-red-500">{formErrors.package}</p>
              )}
            </div>
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
                {formErrors["dates.expiryDate"] && (
                  <p className="mt-1 text-xs text-red-500">{formErrors["dates.expiryDate"]}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Status */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Invoice Status
          </h3>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="invoiceStatus"
              name="invoiceStatus"
              checked={formData.invoiceStatus === "Invoiced"}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="invoiceStatus" className="ml-2 block text-xs text-gray-700">
              Invoiced
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
          {isEditMode && (
            <Button
              type="button"
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition text-xs"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-6 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-xs"
            disabled={domainError || isLoadingPackages || isSubmitting}
          >
            {isEditMode ? "Update Hosting" : "+ Add Hosting"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HostingForm;