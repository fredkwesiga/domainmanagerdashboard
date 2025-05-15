import React, { useState, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import DomainTable from './DomainTable';
import { categorizeDomains, checkDomainStatus } from '../../utils/helpers';

const DomainTabs = ({ domains = [], onDelete, refreshDomains }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusChecks, setStatusChecks] = useState({});

  const categories = useMemo(() => {
    try {
      const categorized = categorizeDomains(domains);
      
      // Combine active domains with expiring domains (removing duplicates)
      const allActiveDomains = [
        ...categorized.active,
        ...categorized.expiring7Days,
        ...categorized.expiring30Days
      ].filter((domain, index, self) => 
        index === self.findIndex(d => d.id === domain.id)
      );

      return {
        ...categorized,
        active: allActiveDomains
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
  }, [domains]);

  // Tabs ordered as requested: All, Active, 7 Days, 30 Days, Expired, Redemption
  const tabs = [
    { id: 'all', label: 'All Domains', domains: domains },
    { id: 'active', label: 'Active', domains: categories.active },
    { id: '7days', label: 'Expiring in 7 Days', domains: categories.expiring7Days },
    { id: '30days', label: 'Expiring in 30 Days', domains: categories.expiring30Days },
    { id: 'expired', label: 'Expired', domains: categories.expired },
    { id: 'redemption', label: 'Redemption', domains: categories.redemption },
  ];

  const verifyDomainStatus = async (domainName) => {
    if (!domainName || isLoading) return;

    setIsLoading(true);
    try {
      const status = await checkDomainStatus(domainName);
      setStatusChecks(prev => ({
        ...prev,
        [domainName]: {
          status,
          lastChecked: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error checking domain status:', error);
      setStatusChecks(prev => ({
        ...prev,
        [domainName]: {
          status: 'Error checking status',
          lastChecked: new Date().toISOString()
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <Tab.Group>
        <Tab.List className="flex overflow-x-auto border-b border-gray-200 px-6">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              className={({ selected }) =>
                `px-4 py-3 text-xs font-medium whitespace-nowrap focus:outline-none ${
                  selected
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              {tab.label} ({tab.domains.length})
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="p-6">
          {tabs.map((tab) => (
            <Tab.Panel key={tab.id}>
              <DomainTable
                domains={tab.domains}
                onDelete={onDelete}
                statusChecks={statusChecks}
                onVerifyStatus={verifyDomainStatus}
                isLoading={isLoading}
                refreshDomains={refreshDomains}
                showDaysUntilExpiry={tab.id === '7days' || tab.id === '30days'}
              />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default DomainTabs;