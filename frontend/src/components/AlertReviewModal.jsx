import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { X, AlertTriangle, Activity, Database, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import './AlertReviewModal.css';
import * as api from '../api/client';

const RiskGauge = ({ value }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  let color = '#22c55e'; // green
  if (value >= 70) color = '#ef4444'; // red
  else if (value >= 50) color = '#f97316'; // orange
  else if (value >= 30) color = '#eab308'; // yellow

  return (
    <div style={{ position: 'relative', width: '50px', height: '50px', margin: '0 auto', marginBottom: '8px' }}>
      <svg width="50" height="50">
        <circle cx="25" cy="25" r={radius} stroke="#e5e7eb" strokeWidth="4" fill="none" />
        <circle 
          cx="25" cy="25" r={radius} 
          stroke={color} 
          strokeWidth="4" 
          fill="none" 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 25 25)"
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: color }}>
        {value}%
      </div>
    </div>
  );
};

const AlertReviewModal = ({ alert, onClose, token }) => {
  const [activityData, setActivityData] = useState({ logs: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!alert) return;

    setLoading(true);
    api.fetchUserActivity(token, alert.flaggedUsername)
      .then(data => {
        setActivityData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Failed to fetch activity');
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
    time: new Date(log.timestamp + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    action: log.action,
    risk: getActionRisk(log.action),
    id: log.id
  }));

  // Prepare Transaction History Data
  const txHistory = activityData.transactions.slice().reverse().map((tx) => ({
    time: new Date(tx.timestamp + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    amount: parseFloat(tx.amount),
    type: tx.type,
    id: tx.id
  }));

  // Parse description for secondary graph logic
  const description = alert.description || '';
  const isBurst = description.toLowerCase().includes('burst');
  const hasTransactions = txHistory.length > 0;
  const isTransactionAnomaly = description.toLowerCase().includes('transfer') || description.toLowerCase().includes('transaction') || hasTransactions;

  // Prepare Action Frequency Data (for Burst)
  const getFrequencyData = () => {
    const freqMap = {};
    activityData.logs.forEach(log => {
      const time = new Date(log.timestamp + 'Z');
      // Group by Minute for a nice bar chart
      const key = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      freqMap[key] = (freqMap[key] || 0) + 1;
    });
    return Object.keys(freqMap).sort().map(k => ({ time: k, count: freqMap[k] }));
  };

  // Prepare Action Distribution Data (Fallback)
  const getDistributionData = () => {
    const distMap = {};
    activityData.logs.forEach(log => {
      // Parse prefix, e.g. "POST /api/auth/login" -> "Auth"
      let cat = 'Other';
      const action = log.action.toLowerCase();
      if (action.includes('/auth') || action.includes('login')) cat = 'Auth';
      else if (action.includes('/transactions') || action.includes('transfer')) cat = 'Transactions';
      else if (action.includes('/admin')) cat = 'Admin';
      else if (action.includes('/staff')) cat = 'Staff';
      else if (action.includes('/config')) cat = 'Config';
      distMap[cat] = (distMap[cat] || 0) + 1;
    });
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return Object.keys(distMap).map((key, index) => ({
      name: key,
      value: distMap[key],
      color: colors[index % colors.length]
    }));
  };

  const freqData = isBurst ? getFrequencyData() : [];
  const distData = (!isTransactionAnomaly && !isBurst) ? getDistributionData() : [];

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
                              <div className="custom-tooltip" style={{ textAlign: 'center' }}>
                                <RiskGauge value={data.risk} />
                                <p className="time">{data.time}</p>
                                <p className="action"><strong>{data.action}</strong></p>
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

              {isBurst ? (
                <div className="graph-card">
                  <div className="graph-header">
                    <BarChart2 size={20} className="icon-blue" />
                    <h3>Action Frequency (Burst Analysis)</h3>
                  </div>
                  <div className="graph-wrapper">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={freqData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="graph-hint">Visualizes the volume of actions over time leading to the burst alert.</p>
                </div>
              ) : isTransactionAnomaly ? (
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
              ) : (
                <div className="graph-card">
                  <div className="graph-header">
                    <PieChartIcon size={20} className="icon-blue" />
                    <h3>Action Type Distribution</h3>
                  </div>
                  <div className="graph-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={distData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                          {distData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="graph-hint">Shows the breakdown of API routes accessed by the user.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertReviewModal;
