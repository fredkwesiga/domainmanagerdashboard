import React from 'react';
import PackageCard from './PackageCard';

const PackagesList = ({ packages, onEdit, onDelete }) => {
  return (
    <div className="space-y-4">
      {packages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No packages found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PackagesList;