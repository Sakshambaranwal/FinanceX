package com.sakshambaranwal.expense_service.entity;

import lombok.Data;

@Data
public class Income {
    
    private String id;
    private String username;
    private String source; // e.g., salary, business, etc.
    private double amount;
    private String description;
    private String date; // Date of income
    private String tags; // Tags for categorization
    private String paymentMethod; // e.g., bank transfer, cash, etc.
}

