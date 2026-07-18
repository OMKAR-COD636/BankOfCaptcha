import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X, AlertTriangle, Activity, Database } from 'lucide-react';
import './AlertReviewModal.css';

const AlertReviewModal = ({ alert, onClose, token }) => {
  const [activityData, setActivityData] = useState({ logs: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!alert) return;

    setLoading(true);
    fetch(`http://localhost:8080/api/admin/users/${alert.flaggedUsername}/activity`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch activity');
        return res.json();
      })
      .then(data => {
        setActivityData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [alert, token]);

  if (!alert) return null;

  // Prepare Action Sequence Data
  // Mapping actions to rough risk weights for visualization
  const getActionRisk = (action) => {
    const act = action.toLowerCase();
    if (act.includes('admin') || act.includes('config') || act.includes('staff')) return 90;
    if (act.includes('transfer')) return 70;
    if (act.includes('login') || act.includes('logout')) return 10;
    return 30; // default
  };

  const actionSequence = activityData.logs.slice().reverse().map((log) => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    action: log.action,
    risk: getActionRisk(log.action),
    id: log.id
  }));

  // Prepare Transaction History Data
  const txHistory = activityData.transactions.slice().reverse().map((tx) => ({
    time: new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    amount: parseFloat(tx.amount),
    type: tx.type,
    id: tx.id
  }));

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title">
            <AlertTriangle size={24} className="icon-yellow" />
            <h2>Review Alert: {alert.flaggedUsername}</h2>
          </div>
          <button className="modal-close" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="modal-body">
          <div className="alert-reason-card">
            <h3>Reason for Alert</h3>
            <p><strong>Severity:</strong> <span className={`severity-badge ${alert.severity.toLowerCase()}`}>{alert.severity}</span></p>
            <p><strong>Fused Score:</strong> {((alert.riskScore || 0) / 100).toFixed(2)}</p>
            <p><strong>Description:</strong> {alert.description}</p>
          </div>

          {loading ? (
            <div className="modal-loading">Loading forensic data...</div>
          ) : error ? (
            <div className="modal-error">Error: {error}</div>
          ) : (
            <div className="graphs-container">
              <div className="graph-card">
                <div className="graph-header">
                  <Activity size={20} className="icon-blue" />
                  <h3>Action Sequence & Risk Profile</h3>
                </div>
                <div className="graph-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={actionSequence} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} label={{ value: 'Risk %', angle: -90, position: 'insideLeft' }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="custom-tooltip">
                                <p className="time">{data.time}</p>
                                <p className="action"><strong>{data.action}</strong></p>
                                <p className="risk">Risk Weight: {data.risk}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="graph-hint">Shows the sequence of recent requests and their inherent risk.</p>
              </div>

              <div className="graph-card">
                <div className="graph-header">
                  <Database size={20} className="icon-blue" />
                  <h3>Recent Transaction Amounts</h3>
                </div>
                <div className="graph-wrapper">
                  {txHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={txHistory} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`₹${value}`, 'Amount']}
                          labelFormatter={(label) => `Time: ${label}`}
                        />
                        <Line type="stepAfter" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-msg">No recent transactions found for this user.</div>
                  )}
                </div>
                <p className="graph-hint">Visualizes spikes in transaction amounts.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertReviewModal;
