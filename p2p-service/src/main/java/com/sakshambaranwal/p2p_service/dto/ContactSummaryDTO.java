package com.sakshambaranwal.p2p_service.dto;

import com.sakshambaranwal.p2p_service.entity.P2PContact;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactSummaryDTO {
    private P2PContact contact;
    private double totalGave; // Total amount user gave to this contact
    private double totalGot;  // Total amount user got from this contact
    private double netBalance; // positive = You will get; negative = You will give; 0 = Settled
    private String lastTransactionDate;
    private String lastTransactionDescription;
}

