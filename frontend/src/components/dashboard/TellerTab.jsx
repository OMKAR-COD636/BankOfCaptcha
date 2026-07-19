import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import Pagination from '../Pagination';

const TellerTab = ({
  kycRequests,
  itemsPerPage
}) => {
  const [kycReqPage, setKycReqPage] = useState(1);
  const paginatedKycReqs = kycRequests.slice((kycReqPage - 1) * itemsPerPage, kycReqPage * itemsPerPage);

  return (
    <div className="admin-tab-content animated-fade-in">
      <h2 className="section-title"><FileText size={24} className="icon-blue" /> Pending KYC Applications</h2>
      {kycRequests.length > 0 ? (
        <div className="logs-table-container mb-4">
          <table className="logs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Aadhaar Number</th>
                <th>Mobile Number</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedKycReqs.map(req => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td><strong>{req.fullName}</strong></td>
                  <td>{req.aadhaarNumber}</td>
                  <td>{req.mobileNumber}</td>
                  <td><span className="status-badge pending">{req.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={kycReqPage} totalItems={kycRequests.length} itemsPerPage={itemsPerPage} onPageChange={setKycReqPage} />
        </div>
      ) : (
        <div className="card mb-4" style={{ padding: '20px', background: 'white', borderRadius: '8px', color: '#64748b' }}>
          No pending KYC applications.
        </div>
      )}
    </div>
  );
};

export default TellerTab;
