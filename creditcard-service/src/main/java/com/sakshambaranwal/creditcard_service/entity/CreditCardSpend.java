package com.sakshambaranwal.creditcard_service.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "credit_card_spends")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreditCardSpend {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String cardId;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private Double amount;

    private String merchant;
    private String category;
    private String date; // YYYY-MM-DD
    private String description;

    private Double rewardRateApplied = 1.0; // Percentage
    private Double rewardsEarned = 0.0;     // Value in currency or reward points
    private Boolean isAccelerated = false;  // Whether this spend qualified for accelerated tier (e.g. 5%)
    private Boolean wasCapped = false;      // Whether rewards were capped due to cycle cap limits
    private Double potentialRewardsUncapped; // How much it would have earned without capping

    private String currency = "INR";
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (date == null || date.isBlank()) {
            date = java.time.LocalDate.now().toString();
        }
        if (currency == null || currency.isBlank()) {
            currency = "INR";
        }
    }
}

