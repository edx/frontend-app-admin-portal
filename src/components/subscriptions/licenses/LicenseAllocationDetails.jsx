import React from 'react';
import LicenseAllocationNavigation from './LicenseAllocationNavigation';
import LicenseManagementTabContentTable from './LicenseManagementTabContentTable';
import LicenseAllocationHeader from './LicenseAllocationHeader';

const LicenseAllocationDetails = () => (
  <>
    <div className="row mb-3">
      <div className="col">
        <div className="mb-3">
          <LicenseAllocationHeader />
        </div>
        <div className="row my-4">
          <div className="col-12 col-lg-3 mb-2 mb-lg-0">
            <LicenseAllocationNavigation />
          </div>
          <div className="col-12 col-lg-9">
            <LicenseManagementTabContentTable />
          </div>
        </div>
      </div>
    </div>
  </>
);

export default LicenseAllocationDetails;
