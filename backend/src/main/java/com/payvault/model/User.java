package com.payvault.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class User {

    private Long id;
    private String name;
    private String email;
    private BigDecimal balance;
    private LocalDateTime createdAt;

    public User() {}

    public User(Long id, String name, String email, BigDecimal balance, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.balance = balance;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
