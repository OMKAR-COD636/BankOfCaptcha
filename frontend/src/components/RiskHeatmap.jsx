import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import './RiskHeatmap.css';

const RiskHeatmap = ({ token }) => {
    const [stats, setStats] = useState([]);
    
    useEffect(() => {
        if (!token) return;
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/ai/alerts/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch risk stats", err);
            }
        };
        fetchStats();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [token]);

    // Helper to determine frequency bucket
    const getFrequencyBucket = (count) => {
        if (count === 0) return 'None';
        if (count < 5) return 'Low';
        if (count <= 20) return 'Medium';
        return 'High';
    };

    // Matrix definition
    const severities = ['HIGH', 'MEDIUM', 'LOW'];
    const frequencies = ['Low', 'Medium', 'High'];

    // Map stats to buckets
    const bucketedData = {};
    severities.forEach(s => {
        const stat = stats.find(st => st.severity === s) || { count: 0 };
        const freqBucket = getFrequencyBucket(stat.count);
        bucketedData[s] = { count: stat.count, bucket: freqBucket };
    });

    const getBaseColorClass = (sev, freq) => {
        if (sev === 'HIGH' && (freq === 'Medium' || freq === 'High')) return 'risk-high';
        if (sev === 'HIGH' && freq === 'Low') return 'risk-med';
        
        if (sev === 'MEDIUM' && freq === 'High') return 'risk-high';
        if (sev === 'MEDIUM' && freq === 'Medium') return 'risk-med';
        if (sev === 'MEDIUM' && freq === 'Low') return 'risk-low';
        
        if (sev === 'LOW' && freq === 'High') return 'risk-med';
        return 'risk-low';
    };

    return (
        <div className="risk-heatmap-container">
            <div className="risk-heatmap-header">
                <Activity size={24} color="#ef4444" />
                <h3>Risk Analysis Matrix</h3>
            </div>
            
            <div className="heatmap-matrix">
                {/* Header Row (X-axis) */}
                <div></div>
                <div className="matrix-label">Low Frequency<br/>(1-4 alerts)</div>
                <div className="matrix-label">Medium Frequency<br/>(5-20 alerts)</div>
                <div className="matrix-label">High Frequency<br/>(20+ alerts)</div>

                {/* Grid Rows (Y-axis) */}
                {severities.map(sev => (
                    <React.Fragment key={sev}>
                        <div className="matrix-label y-axis">{sev} Severity</div>
                        {frequencies.map(freq => {
                            const statData = bucketedData[sev];
                            const isActive = statData && statData.bucket === freq && statData.count > 0;
                            const count = isActive ? statData.count : 0;
                            const baseClass = getBaseColorClass(sev, freq);
                            
                            return (
                                <div 
                                    key={`${sev}-${freq}`} 
                                    className={`matrix-cell ${baseClass} ${isActive ? 'active' : ''}`}
                                >
                                    {isActive ? (
                                        <>
                                            <span className="cell-count">{count}</span>
                                            <span className="cell-desc">Alerts</span>
                                            <div className="cell-tooltip">
                                                {count} {sev.toLowerCase()} severity alerts detected.
                                            </div>
                                        </>
                                    ) : (
                                        <span style={{opacity: 0.2}}>-</span>
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default RiskHeatmap;
