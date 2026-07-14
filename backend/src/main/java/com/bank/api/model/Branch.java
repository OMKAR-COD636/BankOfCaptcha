package com.bank.api.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "branches")
public class Branch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String branchId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    public Branch() {}

    public Branch(String name, String location) {
        this.name = name;
        this.location = location;
        // Generate a random, cryptographically decoupled 6-character alphanumeric sequence
        this.branchId = "BR-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    public Long getId() { return id; }
    public String getBranchId() { return branchId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}
