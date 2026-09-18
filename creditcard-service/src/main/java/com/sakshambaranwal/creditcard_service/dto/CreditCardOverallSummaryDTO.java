package com.sakshambaranwal.creditcard_service.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditCardOverallSummaryDTO {
    private int totalCards;
    private int ltfCards;
    private int feeCards;
    private int feeWaivedCards;
    private double totalCreditLimit;
    private double totalAnnualSpends;
    private double totalRewardsEarned;
    private List<CardSummaryDTO> cards;
}

