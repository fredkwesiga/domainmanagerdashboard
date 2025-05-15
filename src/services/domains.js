// Static domain service
let domains = [
    {
      id: '1',
      domainName: 'example.com',
      owner: {
        firstName: 'John',
        lastName: 'Doe'
      },
      contact: {
        email1: 'john@example.com',
        email2: 'john.doe@example.com',
        phone1: '1234567890',
        phone2: '0987654321'
      },
      dates: {
        startDate: '2023-01-01',
        expiryDate: '2023-12-31'
      },
      package: 'standard',
      amount: 199
    },
    {
      id: '2',
      domainName: 'test.org',
      owner: {
        firstName: 'Jane',
        lastName: 'Smith'
      },
      contact: {
        email1: 'jane@test.org',
        email2: '',
        phone1: '9876543210',
        phone2: ''
      },
      dates: {
        startDate: '2023-02-15',
        expiryDate: '2024-02-15'
      },
      package: 'premium',
      amount: 299
    }
  ];
  
  export const getDomains = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...domains]);
      }, 500);
    });
  };
  
  export const addDomain = async (domainData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newDomain = {
          ...domainData,
          id: Date.now().toString()
        };
        domains.push(newDomain);
        resolve(newDomain);
      }, 500);
    });
  };
  
  export const updateDomain = async (id, domainData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = domains.findIndex(d => d.id === id);
        if (index !== -1) {
          domains[index] = { ...domainData, id };
        }
        resolve(domains[index]);
      }, 500);
    });
  };
  
  export const deleteDomain = async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        domains = domains.filter(d => d.id !== id);
        resolve({ success: true });
      }, 500);
    });
  };