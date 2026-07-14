import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import './RiskActivityGraph.css';

const RiskActivityGraph = ({ alerts = [], onDateSelect, selectedDate }) => {
    const days = 90;
    
    const { activityMap, startDate, endDate, dateArray } = useMemo(() => {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(end.getDate() - days + 1);
        
        const map = new Map();
        const dates = [];
        
        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            map.set(dateStr, { total: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });
            dates.push(dateStr);
        }
        
        alerts.forEach(alert => {
            if (alert.timestamp && alert.severity) {
                const alertDate = new Date(alert.timestamp);
                if (!isNaN(alertDate.getTime())) {
                    const dateStr = alertDate.getFullYear() + '-' + String(alertDate.getMonth() + 1).padStart(2, '0') + '-' + String(alertDate.getDate()).padStart(2, '0');
                    if (map.has(dateStr)) {
                        const data = map.get(dateStr);
                        data.total += 1;
                        data[alert.severity] = (data[alert.severity] || 0) + 1;
                        map.set(dateStr, data);
                    }
                }
            }
        });
        
        return { activityMap: map, startDate: start, endDate: end, dateArray: dates };
    }, [alerts]);

    const weeks = [];
    let currentWeek = [];
    
    const startDayOfWeek = startDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
        currentWeek.push(null);
    }
    
    dateArray.forEach(dateStr => {
        currentWeek.push(dateStr);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeks.push(currentWeek);
    }

    const getSeverityClass = (data) => {
        if (data.total === 0) return 'color-empty';
        if (data.HIGH > 0) return 'color-high';
        if (data.MEDIUM > 0) return 'color-medium';
        return 'color-low';
    };

    const getOpacity = (total) => {
        if (total === 0) return 1;
        if (total <= 2) return 0.4;
        if (total <= 5) return 0.6;
        if (total <= 10) return 0.8;
        return 1.0;
    };

    return (
        <div className="risk-visualizer-card">
            <div className="risk-visualizer-header">
                <Calendar size={20} className="icon-blue" />
                <h3>Risk Activity Calendar</h3>
                {selectedDate && (
                    <button className="clear-filter-btn" onClick={() => onDateSelect(null)}>
                        Clear Date Filter
                    </button>
                )}
            </div>
            
            <div className="activity-graph-wrapper">
                <div className="activity-graph-y-labels">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                </div>
                
                <div className="activity-graph-grid">
                    {weeks.map((week, wIndex) => (
                        <div key={wIndex} className="activity-graph-column">
                            {week.map((dateStr, dIndex) => {
                                if (!dateStr) {
                                    return <div key={dIndex} className="activity-cell empty-cell"></div>;
                                }
                                const data = activityMap.get(dateStr);
                                const isSelected = selectedDate === dateStr;
                                const tooltip = `${dateStr}\nTotal: ${data.total}\nHigh: ${data.HIGH} | Med: ${data.MEDIUM} | Low: ${data.LOW}`;
                                
                                return (
                                    <div 
                                        key={dateStr} 
                                        className={`activity-cell ${getSeverityClass(data)} ${isSelected ? 'selected' : ''} ${(selectedDate && !isSelected) ? 'dimmed' : ''}`}
                                        style={{ opacity: selectedDate && !isSelected ? 0.2 : getOpacity(data.total) }}
                                        title={tooltip}
                                        onClick={() => onDateSelect && onDateSelect(isSelected ? null : dateStr)}
                                    ></div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="activity-legend">
                <span className="legend-text">Peak Severity:</span>
                <div className="activity-cell color-low" style={{opacity: 1}}></div> <span className="legend-label">Low</span>
                <div className="activity-cell color-medium" style={{opacity: 1}}></div> <span className="legend-label">Medium</span>
                <div className="activity-cell color-high" style={{opacity: 1}}></div> <span className="legend-label">High</span>
                <span className="legend-text" style={{marginLeft: '15px'}}>Opacity = Volume</span>
            </div>
        </div>
    );
};

export default RiskActivityGraph;
