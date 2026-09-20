package com.sakshambaranwal.p2p_service.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "p2p_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class P2PTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String contactId;

    @Column(nullable = false)
    private String username;

    /**
     * YOU_GAVE = You gave money to the party (Udhaar Diya / Lent / Receivable increases)
     * YOU_GOT  = You received money from the party (Udhaar Liya / Payment Received / Receivable decreases or Payable increases)
     */
    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private double amount;

    private String date;

    private String description;

    private String paymentMode;

    private String currency = "USD";

    private String syncPairId;

    private LocalDateTime createdAt = LocalDateTime.now();
}

