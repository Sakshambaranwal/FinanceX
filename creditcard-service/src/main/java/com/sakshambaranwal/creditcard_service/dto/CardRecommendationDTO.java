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
public class CardRecommendationDTO {
    private String recommendedCardId;
    private String recommendedCardName;
    private String recommendedCardBank;
    private String recommendedCardLast4;
    private double rewardRate;
    private double rewardAmount;
    private String reason;
    private boolean helpsFeeWaiver;
    private double feeWaiverRemainingAfterSpend;
    private boolean unlocksFeeWaiver;
    private boolean unlocksMilestone;
    private boolean isCapped;
    private double uncappedPotentialReward;
    private String cappingNote;
    private List<CardEvaluationDTO> allEvaluations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CardEvaluationDTO {
        private String cardId;
        private String cardName;
        private String bank;
        private String cardLast4;
        private double rewardRate;
        private double rewardAmount;
        private boolean isRecommended;
        private String benefitNote;
        private double feeWaiverRemaining;
        private boolean feeWaiverAchieved;
        private boolean isCapped;
        private double uncappedReward;
        private Double availableHeadroom;
        private String cappingRuleSummary;
    }
}

