package com.bank.api.dto;

public class RiskStatDTO {
    private String severity;
    private long count;

    public RiskStatDTO() {}

    public RiskStatDTO(String severity, long count) {
        this.severity = severity;
        this.count = count;
    }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public long getCount() { return count; }
    public void setCount(long count) { this.count = count; }
}
