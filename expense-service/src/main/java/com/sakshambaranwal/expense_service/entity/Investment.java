package com.sakshambaranwal.expense_service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "investments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String username;
    private String category;
    private String investmentName;
    private String quantity;
    private String unitPrice;
    private String currentPrice;
    private double principalAmount;
    private double currentAmount;
    private double totalReturns;
    private String riskLevel;
    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String description;
    private String investmentDate;
    private String maturityDate;
    private Double maturityAmount;
    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String tags;
    private String paymentMethod;
    private String currency = "USD";
}
