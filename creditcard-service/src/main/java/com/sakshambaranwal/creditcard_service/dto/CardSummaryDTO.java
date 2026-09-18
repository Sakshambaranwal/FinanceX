package com.sakshambaranwal.creditcard_service.dto;

import com.sakshambaranwal.creditcard_service.entity.CreditCard;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardSummaryDTO {
    private CreditCard card;
    private double currentAnnualSpend;
    private double totalAllTimeSpend;
    private double spendRemainingForFeeWaiver;
    private boolean feeWaiverAchieved;
    private double feeWaiverProgressPct;
    private double totalRewardsEarned;
    private String nextStatementDate;
    private String nextDueDate;
    private long daysUntilDue;
    private boolean milestoneAchieved;
    private double milestoneSpendRemaining;
    private int totalTransactionsCount;

    // Cycle & Capping fields
    private String cappingCycle; // "CALENDAR_MONTH" or "STATEMENT_CYCLE"
    private String currentCycleStartDate;
    private String currentCycleEndDate;
    private long daysUntilCycleReset;
    private double acceleratedRewardsEarnedInCycle;
    private Double acceleratedRewardCap;
    private Double acceleratedRewardRemainingInCycle;
    private double baseRewardsEarnedInCycle;
    private Double baseRewardCap;
    private Double baseRewardRemainingInCycle;
}

