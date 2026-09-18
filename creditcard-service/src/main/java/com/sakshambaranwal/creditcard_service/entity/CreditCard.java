package com.sakshambaranwal.creditcard_service.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "credit_cards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreditCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String cardName;

    private String bank;
    private String cardLast4;
    private String network; // Visa, Mastercard, RuPay, Amex, Diners

    private Boolean isLtf = false; // Lifetime Free
    private Double annualFee = 0.0;
    private Double feeWaiverSpend = 0.0; // Min spends required to waive annual fee

    private Double milestoneSpend; // Optional milestone target
    private String milestoneReward; // e.g., "₹1,000 Voucher on ₹1 Lakh spend"

    private Double baseRewardRate = 1.0; // Default reward %
    private Double baseRewardCap;        // Cap on base 1% rewards per cycle (null = unlimited)
    private Double acceleratedRewardCap; // Cap on accelerated 5% rewards per cycle (null = unlimited)
    private String cappingCycle = "STATEMENT_CYCLE"; // "CALENDAR_MONTH" or "STATEMENT_CYCLE"
    private String catalogCardId;        // Reference to cards-catalog.json

    @Column(columnDefinition = "TEXT")
    private String merchantRewardRates; // JSON: {"Amazon": 5.0, "Flipkart": 5.0, "Dining": 4.0, ...}

    private Integer billingCycleDay = 15; // Day of month when statement generates (1-31)
    private Integer paymentDueDays = 20;   // Days after statement date when payment is due

    private String annualSpendStartDate; // YYYY-MM-DD: Card anniversary date or issue date
    private Double creditLimit;
    private String currency = "INR";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (annualSpendStartDate == null || annualSpendStartDate.isBlank()) {
            annualSpendStartDate = java.time.LocalDate.now().toString();
        }
        if (currency == null || currency.isBlank()) {
            currency = "INR";
        }
        if (isLtf == null) {
            isLtf = false;
        }
        if (annualFee == null) {
            annualFee = 0.0;
        }
        if (feeWaiverSpend == null) {
            feeWaiverSpend = 0.0;
        }
        if (baseRewardRate == null) {
            baseRewardRate = 1.0;
        }
        if (cappingCycle == null || cappingCycle.isBlank()) {
            cappingCycle = "STATEMENT_CYCLE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

