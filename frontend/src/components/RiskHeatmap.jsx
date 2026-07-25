import React, { useMemo } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Activity } from 'lucide-react';
import './RiskHeatmap.css';

const RiskHeatmap = ({ alerts = [], onMatrixSelect, selectedMatrix }) => {
    const { t } = useTranslation();
    const severities = ['HIGH', 'MEDIUM', 'LOW'];
    const frequencies = ['Low', 'Medium', 'High'];

    const bucketedData = useMemo(() => {
        const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
        alerts.forEach(a => { if (counts[a.severity] !== undefined) counts[a.severity]++; });

        const getFreqBucket = (c) => {
            if (c === 0) return 'None';
            if (c < 5) return 'Low';
            if (c <= 20) return 'Medium';
            return 'High';
        };

        const res = {};
        severities.forEach(s => {
            res[s] = { count: counts[s], bucket: getFreqBucket(counts[s]) };
        });
        return res;
    }, [alerts]);

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
        <div className="risk-visualizer-card">
            <div className="risk-visualizer-header">
                <Activity size={20} className="icon-red" />
                <h3>{t('dashboard.riskSeverityMatrix')}</h3>
                {selectedMatrix && (
                    <button className="clear-filter-btn" onClick={() => onMatrixSelect(null)}>
                        Clear Matrix Filter
                    </button>
                )}
            </div>
            
            <div className="risk-visualizer-body">
                <div className="heatmap-matrix">
                    {/* Header Row (X-axis) */}
                    <div></div>
                    <div className="matrix-label">Low Freq<br/>(1-4 alerts)</div>
                    <div className="matrix-label">Med Freq<br/>(5-20 alerts)</div>
                    <div className="matrix-label">High Freq<br/>(20+ alerts)</div>

                    {/* Grid Rows (Y-axis) */}
                    {severities.map(sev => (
                        <React.Fragment key={sev}>
                            <div className="matrix-label y-axis">{sev}</div>
                            {frequencies.map(freq => {
                                const statData = bucketedData[sev];
                                const isActive = statData && statData.bucket === freq && statData.count > 0;
                                const count = isActive ? statData.count : 0;
                                const baseClass = getBaseColorClass(sev, freq);
                                const isSelected = selectedMatrix && selectedMatrix.severity === sev && selectedMatrix.frequency === freq;
                                const dimClass = (selectedMatrix && !isSelected) ? 'dimmed' : '';
                                
                                return (
                                    <div 
                                        key={`${sev}-${freq}`} 
                                        className={`matrix-cell ${baseClass} ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${dimClass}`}
                                        onClick={() => {
                                            if (isActive) {
                                                onMatrixSelect(isSelected ? null : { severity: sev, frequency: freq });
                                            }
                                        }}
                                    >
                                        {isActive ? (
                                            <>
                                                <span className="cell-count">{count}</span>
                                                <span className="cell-desc">Alerts</span>
                                                <div className="cell-tooltip">
                                                    {count} {sev.toLowerCase()} severity alerts detected. Click to filter.
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
        </div>
    );
};

export default RiskHeatmap;
