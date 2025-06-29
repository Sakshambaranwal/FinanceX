package com.sakshambaranwal.expense_service.entity;

import lombok.Data;

@Data
public class Investment {

    private String id;
    private String username;
    private String category; // e.g., stocks, mutual funds, etc.
    private String InvestmentName; // Name of the investment
    private String quantity;
    private String unitPrice; // Price per unit of the investment
    private String currentPrice;
    private double principalAmount; // Initial investment amount
    private double currentAmount; // Current value of the investment
    private double totalReturns; // Returns on the investment
    private double riskLevel; // e.g., low, medium, high
    private String description;
    private String investmentDate;
    private String tags; // e.g., long-term, high-risk, etc.
    private String paymentMethod; // e.g., bank transfer, credit card, etc.
}
