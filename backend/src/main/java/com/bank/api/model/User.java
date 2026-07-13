package com.bank.api.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private boolean accessSuspended = false;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;

    public User() {}

    public User(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    public User(String username, String password, String role, Branch branch) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.branch = branch;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public boolean isAccessSuspended() { return accessSuspended; }
    public void setAccessSuspended(boolean accessSuspended) { this.accessSuspended = accessSuspended; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
}
