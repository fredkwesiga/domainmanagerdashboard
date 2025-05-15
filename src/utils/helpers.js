/**
 * Formats a date string into a localized date format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date or 'N/A' if invalid
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

/**
 * Calculates days until expiry
 * @param {string} expiryDate - The expiry date string
 * @returns {number} Days until expiry (negative if expired)
 */
export const calculateDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return 0;
  try {
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

/**
 * Formats days remaining display
 * @param {string} expiryDate - The expiry date string
 * @returns {string} Formatted days remaining text
 */
export const formatDaysRemaining = (expiryDate) => {
  const days = calculateDaysUntilExpiry(expiryDate);
  if (days === 0) return "Expires today";
  if (days === 1) return "1 day left";
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `${days} days left`;
};

/**
 * Categorizes domains based on their expiry status
 * @param {Array} domains - Array of domain objects
 * @returns {Object} Categorized domains
 */
export const categorizeDomains = (domains = []) => {
  const now = new Date();
  const in7Days = new Date(now);
  in7Days.setDate(now.getDate() + 7);
  
  const in30Days = new Date(now);
  in30Days.setDate(now.getDate() + 30);
  
  try {
    return {
      active: domains.filter(domain => {
        const expiryDate = getExpiryDate(domain);
        return expiryDate && expiryDate > now;
      }),
      expiring7Days: domains.filter(domain => {
        const expiryDate = getExpiryDate(domain);
        return expiryDate && expiryDate > now && expiryDate <= in7Days;
      }),
      expiring30Days: domains.filter(domain => {
        const expiryDate = getExpiryDate(domain);
        return expiryDate && expiryDate > in7Days && expiryDate <= in30Days;
      }),
      expired: domains.filter(domain => {
        const expiryDate = getExpiryDate(domain);
        if (!expiryDate) return false;
        const redemptionStart = new Date(expiryDate);
        redemptionStart.setDate(expiryDate.getDate() + 30);
        return expiryDate < now && now < redemptionStart;
      }),
      redemption: domains.filter(domain => {
        const expiryDate = getExpiryDate(domain);
        if (!expiryDate) return false;
        const redemptionStart = new Date(expiryDate);
        redemptionStart.setDate(expiryDate.getDate() + 30);
        return now >= redemptionStart;
      })
    };
  } catch (error) {
    console.error('Error categorizing domains:', error);
    return {
      active: [],
      expiring7Days: [],
      expiring30Days: [],
      expired: [],
      redemption: []
    };
  }
};

/**
 * Safely gets expiry date from domain object
 * @param {Object} domain - Domain object
 * @returns {Date|null} Expiry date or null if invalid
 */
const getExpiryDate = (domain) => {
  try {
    if (!domain?.dates?.expiryDate) return null;
    const date = new Date(domain.dates.expiryDate);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

/**
 * Checks domain status (mock implementation)
 * @param {string} domainName - Domain name to check
 * @returns {Promise<string>} Domain status
 */
export const checkDomainStatus = async (domainName) => {
  if (!domainName) return 'Invalid domain';
  
  try {
    // Simulate API call delay (1-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Mock responses based on domain characteristics
    if (domainName.endsWith('.test')) return 'Active (test domain)';
    if (domainName.includes('expired')) return 'Expired';
    if (domainName.includes('redemption')) return 'Redemption Period';
    
    // Fallback to random status for demo
    const statuses = [
      'Active',
      'Expired',
      'Redemption Period',
      'Pending Delete',
      'Transfer Prohibited'
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  } catch (error) {
    console.error('Error checking domain status:', error);
    return 'Error checking status';
  }
};

/**
 * Determines if a domain is currently active
 * @param {Object} domain - Domain object
 * @returns {boolean} True if domain is active
 */
export const isDomainActive = (domain) => {
  try {
    const expiryDate = getExpiryDate(domain);
    return expiryDate ? expiryDate > new Date() : false;
  } catch {
    return false;
  }
};

/**
 * Gets the domain status text and color class
 * @param {Object} domain - Domain object
 * @param {Object} statusChecks - Status check results
 * @returns {Object} { text: string, class: string }
 */
export const getDomainStatus = (domain, statusChecks = {}) => {
  // Use verified status if available
  if (statusChecks[domain.domainName]?.status) {
    const status = statusChecks[domain.domainName].status;
    return {
      text: status,
      class: status.includes('Expired') || status.includes('Redemption') 
        ? 'bg-red-100 text-red-800' 
        : 'bg-green-100 text-green-800'
    };
  }
  
  // Fallback to expiry date check
  return isDomainActive(domain)
    ? { text: 'Active', class: 'bg-green-100 text-green-800' }
    : { text: 'Expired', class: 'bg-red-100 text-red-800' };
};