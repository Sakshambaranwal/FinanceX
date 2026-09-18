package com.sakshambaranwal.creditcard_service.service;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sakshambaranwal.creditcard_service.dto.CardRecommendationDTO;
import com.sakshambaranwal.creditcard_service.dto.CardRecommendationDTO.CardEvaluationDTO;
import com.sakshambaranwal.creditcard_service.dto.CardSummaryDTO;
import com.sakshambaranwal.creditcard_service.dto.CreditCardOverallSummaryDTO;
import com.sakshambaranwal.creditcard_service.entity.CreditCard;
import com.sakshambaranwal.creditcard_service.entity.CreditCardSpend;
import com.sakshambaranwal.creditcard_service.repository.CreditCardRepository;
import com.sakshambaranwal.creditcard_service.repository.CreditCardSpendRepository;

@Service
public class CreditCardService {

    @Autowired
    private CreditCardRepository cardRepository;

    @Autowired
    private CreditCardSpendRepository spendRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ==========================================
    // Bank & Card Catalog
    // ==========================================

    public List<Map<String, Object>> getCatalog() {
        try {
            ClassPathResource resource = new ClassPathResource("cards-catalog.json");
            try (InputStream is = resource.getInputStream()) {
                return objectMapper.readValue(is, new TypeReference<List<Map<String, Object>>>() {});
            }
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    // ==========================================
    // Card Management
    // ==========================================

    public CreditCard addCard(CreditCard card) {
        if (card.getCardName() == null || card.getCardName().trim().isEmpty()) {
            throw new IllegalArgumentException("Card name is required");
        }
        if (card.getUsername() == null || card.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (card.getCappingCycle() == null || card.getCappingCycle().isBlank()) {
            card.setCappingCycle("STATEMENT_CYCLE");
        }
        return cardRepository.save(card);
    }

    public Optional<CreditCard> getCard(String id) {
        return cardRepository.findById(id);
    }

    public CreditCard updateCard(String id, CreditCard updated) {
        return cardRepository.findById(id).map(existing -> {
            existing.setCardName(updated.getCardName());
            existing.setBank(updated.getBank());
            existing.setCardLast4(updated.getCardLast4());
            existing.setNetwork(updated.getNetwork());
            existing.setIsLtf(updated.getIsLtf() != null ? updated.getIsLtf() : false);
            existing.setAnnualFee(updated.getAnnualFee() != null ? updated.getAnnualFee() : 0.0);
            existing.setFeeWaiverSpend(updated.getFeeWaiverSpend() != null ? updated.getFeeWaiverSpend() : 0.0);
            existing.setMilestoneSpend(updated.getMilestoneSpend());
            existing.setMilestoneReward(updated.getMilestoneReward());
            existing.setBaseRewardRate(updated.getBaseRewardRate() != null ? updated.getBaseRewardRate() : 1.0);
            existing.setBaseRewardCap(updated.getBaseRewardCap());
            existing.setAcceleratedRewardCap(updated.getAcceleratedRewardCap());
            existing.setCappingCycle(updated.getCappingCycle() != null ? updated.getCappingCycle() : "STATEMENT_CYCLE");
            existing.setCatalogCardId(updated.getCatalogCardId());
            existing.setMerchantRewardRates(updated.getMerchantRewardRates());
            existing.setBillingCycleDay(updated.getBillingCycleDay() != null ? updated.getBillingCycleDay() : 15);
            existing.setPaymentDueDays(updated.getPaymentDueDays() != null ? updated.getPaymentDueDays() : 20);
            existing.setAnnualSpendStartDate(updated.getAnnualSpendStartDate());
            existing.setCreditLimit(updated.getCreditLimit());
            existing.setCurrency(updated.getCurrency() != null ? updated.getCurrency() : "INR");
            return cardRepository.save(existing);
        }).orElseThrow(() -> new IllegalArgumentException("Card not found with ID: " + id));
    }

    @Transactional
    public boolean deleteCard(String id) {
        if (cardRepository.existsById(id)) {
            spendRepository.deleteByCardId(id);
            cardRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<CardSummaryDTO> getCardsWithSummary(String username) {
        List<CreditCard> cards = cardRepository.findByUsername(username);
        List<CardSummaryDTO> summaries = new ArrayList<>();

        for (CreditCard card : cards) {
            summaries.add(buildCardSummary(card));
        }
        return summaries;
    }

    public CardSummaryDTO getCardSummaryById(String id) {
        CreditCard card = cardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Card not found: " + id));
        return buildCardSummary(card);
    }

    public CreditCardOverallSummaryDTO getOverallSummary(String username) {
        List<CardSummaryDTO> cardSummaries = getCardsWithSummary(username);

        int totalCards = cardSummaries.size();
        int ltfCards = 0;
        int feeCards = 0;
        int feeWaivedCards = 0;
        double totalCreditLimit = 0.0;
        double totalAnnualSpends = 0.0;
        double totalRewardsEarned = 0.0;

        for (CardSummaryDTO s : cardSummaries) {
            CreditCard c = s.getCard();
            if (Boolean.TRUE.equals(c.getIsLtf())) {
                ltfCards++;
            } else {
                feeCards++;
                if (s.isFeeWaiverAchieved()) {
                    feeWaivedCards++;
                }
            }
            if (c.getCreditLimit() != null && c.getCreditLimit() > 0) {
                totalCreditLimit += c.getCreditLimit();
            }
            totalAnnualSpends += s.getCurrentAnnualSpend();
            totalRewardsEarned += s.getTotalRewardsEarned();
        }

        return CreditCardOverallSummaryDTO.builder()
                .totalCards(totalCards)
                .ltfCards(ltfCards)
                .feeCards(feeCards)
                .feeWaivedCards(feeWaivedCards)
                .totalCreditLimit(totalCreditLimit)
                .totalAnnualSpends(totalAnnualSpends)
                .totalRewardsEarned(totalRewardsEarned)
                .cards(cardSummaries)
                .build();
    }

    // ==========================================
    // Spend Management & Reward Calculation
    // ==========================================

    public CreditCardSpend addSpend(CreditCardSpend spend) {
        if (spend.getCardId() == null || spend.getCardId().trim().isEmpty()) {
            throw new IllegalArgumentException("Card ID is required");
        }
        if (spend.getAmount() == null || spend.getAmount() <= 0) {
            throw new IllegalArgumentException("Valid spend amount is required");
        }

        CreditCard card = cardRepository.findById(spend.getCardId())
                .orElseThrow(() -> new IllegalArgumentException("Credit card not found: " + spend.getCardId()));

        spend.setUsername(card.getUsername());
        if (spend.getCurrency() == null || spend.getCurrency().isBlank()) {
            spend.setCurrency(card.getCurrency());
        }

        LocalDate spendDate = LocalDate.now();
        if (spend.getDate() != null && !spend.getDate().isBlank()) {
            try {
                spendDate = LocalDate.parse(spend.getDate());
            } catch (Exception ignored) {}
        }

        // Calculate rewards taking capping and cycle into account
        SpendRewardCalculation calc = calculateSpendReward(card, spend.getAmount(), spend.getMerchant(), spend.getCategory(), spendDate);

        spend.setRewardRateApplied(calc.effectiveRewardRate);
        spend.setRewardsEarned(Math.round(calc.effectiveReward * 100.0) / 100.0);
        spend.setIsAccelerated(calc.isAccelerated);
        spend.setWasCapped(calc.wasCapped);
        spend.setPotentialRewardsUncapped(Math.round(calc.theoreticalUncappedReward * 100.0) / 100.0);

        return spendRepository.save(spend);
    }

    public List<CreditCardSpend> getSpendsForCard(String cardId) {
        return spendRepository.findByCardIdOrderByDateDesc(cardId);
    }

    public List<CreditCardSpend> getAllSpendsForUser(String username) {
        return spendRepository.findByUsernameOrderByDateDesc(username);
    }

    public boolean deleteSpend(String spendId) {
        if (spendRepository.existsById(spendId)) {
            spendRepository.deleteById(spendId);
            return true;
        }
        return false;
    }

    // ==========================================
    // Smart Card Recommendation Engine
    // ==========================================

    public CardRecommendationDTO recommendCard(String username, double amount, String merchant, String category) {
        List<CreditCard> cards = cardRepository.findByUsername(username);
        if (cards.isEmpty()) {
            return CardRecommendationDTO.builder()
                    .reason("No credit cards found in your portfolio. Add a card to get suggestions!")
                    .allEvaluations(Collections.emptyList())
                    .build();
        }

        List<CardEvaluationInternal> evaluations = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (CreditCard card : cards) {
            CardSummaryDTO summary = buildCardSummary(card);
            SpendRewardCalculation calc = calculateSpendReward(card, amount, merchant, category, today);

            double effectiveReward = calc.effectiveReward;
            double theoreticalReward = calc.theoreticalUncappedReward;
            boolean wasCapped = calc.wasCapped;

            boolean isLtf = Boolean.TRUE.equals(card.getIsLtf());
            double feeWaiverSpend = card.getFeeWaiverSpend() != null ? card.getFeeWaiverSpend() : 0.0;
            double annualSpend = summary.getCurrentAnnualSpend();
            double feeWaiverRemaining = Math.max(0.0, feeWaiverSpend - annualSpend);
            boolean alreadyWaived = summary.isFeeWaiverAchieved();

            boolean unlocksWaiver = false;
            boolean helpsWaiver = false;
            double waiverRemainingAfter = feeWaiverRemaining;

            if (!isLtf && !alreadyWaived && feeWaiverSpend > 0) {
                helpsWaiver = true;
                waiverRemainingAfter = Math.max(0.0, feeWaiverRemaining - amount);
                if (waiverRemainingAfter <= 0.0) {
                    unlocksWaiver = true;
                }
            }

            boolean unlocksMilestone = false;
            if (card.getMilestoneSpend() != null && card.getMilestoneSpend() > 0 && !summary.isMilestoneAchieved()) {
                if (annualSpend + amount >= card.getMilestoneSpend()) {
                    unlocksMilestone = true;
                }
            }

            // Scoring formula:
            // Score = effective reward cashback amount
            // + Boost if unlocks fee waiver
            // + Proximity boost if within reach of fee waiver
            // + Milestone unlock boost
            double score = effectiveReward;
            if (unlocksWaiver) {
                score += (card.getAnnualFee() != null ? card.getAnnualFee() : 500.0);
            } else if (helpsWaiver && feeWaiverRemaining <= 30000.0) {
                score += (effectiveReward * 0.4);
            }

            if (unlocksMilestone) {
                score += 300.0;
            }

            String benefitNote = buildBenefitNote(card, calc, unlocksWaiver, helpsWaiver, waiverRemainingAfter, unlocksMilestone);

            String cappingRuleSummary = buildCappingRuleSummary(card);

            evaluations.add(new CardEvaluationInternal(
                    card,
                    calc.effectiveRewardRate,
                    effectiveReward,
                    theoreticalReward,
                    wasCapped,
                    calc.cappingNote,
                    calc.availableHeadroom,
                    cappingRuleSummary,
                    score,
                    unlocksWaiver,
                    helpsWaiver,
                    waiverRemainingAfter,
                    unlocksMilestone,
                    benefitNote,
                    feeWaiverRemaining,
                    alreadyWaived
            ));
        }

        // Sort descending by calculated score
        evaluations.sort(Comparator.comparingDouble(CardEvaluationInternal::getScore).reversed());

        CardEvaluationInternal topPick = evaluations.get(0);

        List<CardEvaluationDTO> evaluationDTOs = new ArrayList<>();
        for (int i = 0; i < evaluations.size(); i++) {
            CardEvaluationInternal ev = evaluations.get(i);
            evaluationDTOs.add(CardEvaluationDTO.builder()
                    .cardId(ev.card.getId())
                    .cardName(ev.card.getCardName())
                    .bank(ev.card.getBank())
                    .cardLast4(ev.card.getCardLast4())
                    .rewardRate(ev.rewardRate)
                    .rewardAmount(Math.round(ev.rewardAmount * 100.0) / 100.0)
                    .isRecommended(i == 0)
                    .benefitNote(ev.benefitNote)
                    .feeWaiverRemaining(ev.feeWaiverRemaining)
                    .feeWaiverAchieved(ev.alreadyWaived)
                    .isCapped(ev.wasCapped)
                    .uncappedReward(Math.round(ev.theoreticalReward * 100.0) / 100.0)
                    .availableHeadroom(ev.availableHeadroom)
                    .cappingRuleSummary(ev.cappingRuleSummary)
                    .build());
        }

        String reason = buildRecommendationReason(topPick, evaluations, amount, merchant);

        return CardRecommendationDTO.builder()
                .recommendedCardId(topPick.card.getId())
                .recommendedCardName(topPick.card.getCardName())
                .recommendedCardBank(topPick.card.getBank())
                .recommendedCardLast4(topPick.card.getCardLast4())
                .rewardRate(topPick.rewardRate)
                .rewardAmount(Math.round(topPick.rewardAmount * 100.0) / 100.0)
                .reason(reason)
                .helpsFeeWaiver(topPick.helpsWaiver)
                .feeWaiverRemainingAfterSpend(topPick.waiverRemainingAfter)
                .unlocksFeeWaiver(topPick.unlocksWaiver)
                .unlocksMilestone(topPick.unlocksMilestone)
                .isCapped(topPick.wasCapped)
                .uncappedPotentialReward(Math.round(topPick.theoreticalReward * 100.0) / 100.0)
                .cappingNote(topPick.cappingNote)
                .allEvaluations(evaluationDTOs)
                .build();
    }

    // ==========================================
    // Cycle Resolution & Headroom Logic
    // ==========================================

    public static class CycleWindow {
        public final LocalDate startDate;
        public final LocalDate endDate;
        public final long daysUntilReset;

        public CycleWindow(LocalDate startDate, LocalDate endDate, long daysUntilReset) {
            this.startDate = startDate;
            this.endDate = endDate;
            this.daysUntilReset = daysUntilReset;
        }
    }

    public CycleWindow resolveCycleWindow(CreditCard card, LocalDate refDate) {
        String cycleType = card.getCappingCycle() != null ? card.getCappingCycle() : "STATEMENT_CYCLE";

        if ("CALENDAR_MONTH".equalsIgnoreCase(cycleType)) {
            LocalDate start = refDate.withDayOfMonth(1);
            LocalDate end = refDate.withDayOfMonth(refDate.lengthOfMonth());
            long daysUntilReset = Math.max(0, ChronoUnit.DAYS.between(refDate, end) + 1);
            return new CycleWindow(start, end, daysUntilReset);
        } else {
            // STATEMENT_CYCLE
            int cycleDay = card.getBillingCycleDay() != null ? Math.max(1, Math.min(31, card.getBillingCycleDay())) : 15;
            LocalDate start;
            LocalDate end;

            if (refDate.getDayOfMonth() >= cycleDay) {
                start = refDate.withDayOfMonth(Math.min(cycleDay, refDate.lengthOfMonth()));
                LocalDate nextMonth = refDate.plusMonths(1);
                end = nextMonth.withDayOfMonth(Math.min(cycleDay, nextMonth.lengthOfMonth())).minusDays(1);
            } else {
                LocalDate prevMonth = refDate.minusMonths(1);
                start = prevMonth.withDayOfMonth(Math.min(cycleDay, prevMonth.lengthOfMonth()));
                end = refDate.withDayOfMonth(Math.min(cycleDay, refDate.lengthOfMonth())).minusDays(1);
            }

            long daysUntilReset = Math.max(0, ChronoUnit.DAYS.between(refDate, end) + 1);
            return new CycleWindow(start, end, daysUntilReset);
        }
    }

    public static class CycleAccrual {
        public double acceleratedEarned = 0.0;
        public double baseEarned = 0.0;
    }

    public CycleAccrual getCycleAccruals(String cardId, CycleWindow cycle) {
        List<CreditCardSpend> spends = spendRepository.findByCardId(cardId);
        CycleAccrual accrual = new CycleAccrual();

        for (CreditCardSpend s : spends) {
            if (s.getDate() == null) continue;
            try {
                LocalDate d = LocalDate.parse(s.getDate());
                if (!d.isBefore(cycle.startDate) && !d.isAfter(cycle.endDate)) {
                    double r = s.getRewardsEarned() != null ? s.getRewardsEarned() : 0.0;
                    if (Boolean.TRUE.equals(s.getIsAccelerated())) {
                        accrual.acceleratedEarned += r;
                    } else {
                        accrual.baseEarned += r;
                    }
                }
            } catch (Exception ignored) {}
        }
        return accrual;
    }

    public static class SpendRewardCalculation {
        public double nominalRate;
        public double effectiveRewardRate;
        public double theoreticalUncappedReward;
        public double effectiveReward;
        public boolean isAccelerated;
        public boolean wasCapped;
        public Double availableHeadroom;
        public String cappingNote;
    }

    public SpendRewardCalculation calculateSpendReward(CreditCard card, double amount, String merchant, String category, LocalDate spendDate) {
        SpendRewardCalculation res = new SpendRewardCalculation();

        // 1. Rate matching
        RateMatch match = matchRewardRate(card, merchant, category);
        res.nominalRate = match.rate;
        res.isAccelerated = match.isAccelerated;

        double baseRate = card.getBaseRewardRate() != null ? card.getBaseRewardRate() : 1.0;

        // 2. Cycle headroom
        CycleWindow cycle = resolveCycleWindow(card, spendDate);
        CycleAccrual accrual = getCycleAccruals(card.getId(), cycle);

        Double accelCap = card.getAcceleratedRewardCap();
        Double baseCap = card.getBaseRewardCap();

        Double accelHeadroom = (accelCap != null) ? Math.max(0.0, accelCap - accrual.acceleratedEarned) : null;
        Double baseHeadroom = (baseCap != null) ? Math.max(0.0, baseCap - accrual.baseEarned) : null;

        res.availableHeadroom = res.isAccelerated ? accelHeadroom : baseHeadroom;

        double theoretical = amount * (match.rate / 100.0);
        res.theoreticalUncappedReward = theoretical;

        if (res.isAccelerated) {
            if (accelHeadroom != null) {
                if (theoretical > accelHeadroom) {
                    // Capped on accelerated tier - spends are NOT split into other categories
                    res.effectiveReward = accelHeadroom;
                    res.wasCapped = true;
                    res.effectiveRewardRate = amount > 0 ? (res.effectiveReward / amount) * 100.0 : match.rate;

                    String cycleLabel = "CALENDAR_MONTH".equalsIgnoreCase(card.getCappingCycle()) ? "calendar month" : "statement cycle";
                    res.cappingNote = String.format(
                            "Hit %s accelerated cap! Earns ₹%.0f max (excess spend is not rewarded at base rate).",
                            cycleLabel, accelHeadroom
                    );
                } else {
                    res.effectiveReward = theoretical;
                    res.effectiveRewardRate = match.rate;
                    res.wasCapped = false;
                }
            } else {
                // Unlimited accelerated
                res.effectiveReward = theoretical;
                res.effectiveRewardRate = match.rate;
                res.wasCapped = false;
            }
        } else {
            // Base spend tier
            if (baseHeadroom != null) {
                if (theoretical > baseHeadroom) {
                    res.effectiveReward = baseHeadroom;
                    res.wasCapped = true;
                    res.effectiveRewardRate = amount > 0 ? (res.effectiveReward / amount) * 100.0 : baseRate;
                    res.cappingNote = String.format("Hit base spend reward cap of ₹%.0f this cycle.", baseCap);
                } else {
                    res.effectiveReward = theoretical;
                    res.effectiveRewardRate = baseRate;
                    res.wasCapped = false;
                }
            } else {
                res.effectiveReward = theoretical;
                res.effectiveRewardRate = baseRate;
                res.wasCapped = false;
            }
        }

        return res;
    }

    private static class RateMatch {
        double rate;
        boolean isAccelerated;

        RateMatch(double rate, boolean isAccelerated) {
            this.rate = rate;
            this.isAccelerated = isAccelerated;
        }
    }

    private RateMatch matchRewardRate(CreditCard card, String merchant, String category) {
        if (card == null) return new RateMatch(1.0, false);
        double defaultRate = card.getBaseRewardRate() != null ? card.getBaseRewardRate() : 1.0;

        String ratesJson = card.getMerchantRewardRates();
        if (ratesJson == null || ratesJson.isBlank()) {
            return new RateMatch(defaultRate, false);
        }

        try {
            Map<String, Object> ratesMap = objectMapper.readValue(ratesJson, new TypeReference<Map<String, Object>>() {});

            if (merchant != null && !merchant.isBlank()) {
                String cleanMerchant = merchant.trim().toLowerCase();
                for (Map.Entry<String, Object> entry : ratesMap.entrySet()) {
                    String key = entry.getKey().trim().toLowerCase();
                    if (cleanMerchant.contains(key) || key.contains(cleanMerchant)) {
                        return new RateMatch(toDouble(entry.getValue()), true);
                    }
                }
            }

            if (category != null && !category.isBlank()) {
                String cleanCat = category.trim().toLowerCase();
                for (Map.Entry<String, Object> entry : ratesMap.entrySet()) {
                    String key = entry.getKey().trim().toLowerCase();
                    if (cleanCat.contains(key) || key.contains(cleanCat)) {
                        return new RateMatch(toDouble(entry.getValue()), true);
                    }
                }
            }
        } catch (Exception ignored) {}

        return new RateMatch(defaultRate, false);
    }

    private double toDouble(Object val) {
        if (val instanceof Number) {
            return ((Number) val).doubleValue();
        }
        try {
            return Double.parseDouble(val.toString());
        } catch (Exception e) {
            return 1.0;
        }
    }

    private CardSummaryDTO buildCardSummary(CreditCard card) {
        List<CreditCardSpend> allSpends = spendRepository.findByCardId(card.getId());

        LocalDate startDate = LocalDate.now().minusYears(1);
        if (card.getAnnualSpendStartDate() != null && !card.getAnnualSpendStartDate().isBlank()) {
            try {
                startDate = LocalDate.parse(card.getAnnualSpendStartDate());
            } catch (Exception ignored) {}
        }

        double annualSpend = 0.0;
        double totalSpend = 0.0;
        double totalRewards = 0.0;

        for (CreditCardSpend s : allSpends) {
            double amt = s.getAmount() != null ? s.getAmount() : 0.0;
            totalSpend += amt;
            totalRewards += s.getRewardsEarned() != null ? s.getRewardsEarned() : 0.0;

            if (s.getDate() != null) {
                try {
                    LocalDate spendDate = LocalDate.parse(s.getDate());
                    if (!spendDate.isBefore(startDate)) {
                        annualSpend += amt;
                    }
                } catch (Exception e) {
                    annualSpend += amt;
                }
            } else {
                annualSpend += amt;
            }
        }

        boolean isLtf = Boolean.TRUE.equals(card.getIsLtf());
        double waiverTarget = card.getFeeWaiverSpend() != null ? card.getFeeWaiverSpend() : 0.0;
        double remainingWaiver = Math.max(0.0, waiverTarget - annualSpend);
        boolean feeWaiverAchieved = isLtf || (waiverTarget > 0 && annualSpend >= waiverTarget);
        double feeWaiverProgressPct = isLtf ? 100.0 : (waiverTarget > 0 ? Math.min(100.0, (annualSpend / waiverTarget) * 100.0) : 0.0);

        boolean milestoneAchieved = false;
        double milestoneRemaining = 0.0;
        if (card.getMilestoneSpend() != null && card.getMilestoneSpend() > 0) {
            milestoneRemaining = Math.max(0.0, card.getMilestoneSpend() - annualSpend);
            milestoneAchieved = annualSpend >= card.getMilestoneSpend();
        }

        // Calculate billing dates
        LocalDate today = LocalDate.now();
        int cycleDay = card.getBillingCycleDay() != null ? Math.max(1, Math.min(31, card.getBillingCycleDay())) : 15;
        int dueDays = card.getPaymentDueDays() != null ? card.getPaymentDueDays() : 20;

        LocalDate nextStatementDate;
        if (today.getDayOfMonth() <= cycleDay) {
            nextStatementDate = today.withDayOfMonth(Math.min(cycleDay, today.lengthOfMonth()));
        } else {
            LocalDate nextMonth = today.plusMonths(1);
            nextStatementDate = nextMonth.withDayOfMonth(Math.min(cycleDay, nextMonth.lengthOfMonth()));
        }

        LocalDate nextDueDate = nextStatementDate.plusDays(dueDays);
        long daysUntilDue = ChronoUnit.DAYS.between(today, nextDueDate);

        // Cycle window & Headroom
        CycleWindow cycle = resolveCycleWindow(card, today);
        CycleAccrual accrual = getCycleAccruals(card.getId(), cycle);

        Double accelCap = card.getAcceleratedRewardCap();
        Double baseCap = card.getBaseRewardCap();

        Double accelHeadroom = (accelCap != null) ? Math.max(0.0, Math.round((accelCap - accrual.acceleratedEarned) * 100.0) / 100.0) : null;
        Double baseHeadroom = (baseCap != null) ? Math.max(0.0, Math.round((baseCap - accrual.baseEarned) * 100.0) / 100.0) : null;

        return CardSummaryDTO.builder()
                .card(card)
                .currentAnnualSpend(Math.round(annualSpend * 100.0) / 100.0)
                .totalAllTimeSpend(Math.round(totalSpend * 100.0) / 100.0)
                .spendRemainingForFeeWaiver(Math.round(remainingWaiver * 100.0) / 100.0)
                .feeWaiverAchieved(feeWaiverAchieved)
                .feeWaiverProgressPct(Math.round(feeWaiverProgressPct * 10.0) / 10.0)
                .totalRewardsEarned(Math.round(totalRewards * 100.0) / 100.0)
                .nextStatementDate(nextStatementDate.toString())
                .nextDueDate(nextDueDate.toString())
                .daysUntilDue(Math.max(0, daysUntilDue))
                .milestoneAchieved(milestoneAchieved)
                .milestoneSpendRemaining(Math.round(milestoneRemaining * 100.0) / 100.0)
                .totalTransactionsCount(allSpends.size())
                // Cycle & Capping fields
                .cappingCycle(card.getCappingCycle() != null ? card.getCappingCycle() : "STATEMENT_CYCLE")
                .currentCycleStartDate(cycle.startDate.toString())
                .currentCycleEndDate(cycle.endDate.toString())
                .daysUntilCycleReset(cycle.daysUntilReset)
                .acceleratedRewardsEarnedInCycle(Math.round(accrual.acceleratedEarned * 100.0) / 100.0)
                .acceleratedRewardCap(accelCap)
                .acceleratedRewardRemainingInCycle(accelHeadroom)
                .baseRewardsEarnedInCycle(Math.round(accrual.baseEarned * 100.0) / 100.0)
                .baseRewardCap(baseCap)
                .baseRewardRemainingInCycle(baseHeadroom)
                .build();
    }

    private String buildCappingRuleSummary(CreditCard card) {
        String cycleName = "CALENDAR_MONTH".equalsIgnoreCase(card.getCappingCycle()) ? "Calendar Month" : "Statement Cycle";
        StringBuilder sb = new StringBuilder();
        if (card.getAcceleratedRewardCap() != null) {
            sb.append(String.format("5%% cap: ₹%.0f / %s", card.getAcceleratedRewardCap(), cycleName));
        } else {
            sb.append("Accelerated rewards: Unlimited");
        }

        if (card.getBaseRewardCap() != null) {
            sb.append(String.format(" • Base cap: ₹%.0f / %s", card.getBaseRewardCap(), cycleName));
        }
        return sb.toString();
    }

    private String buildBenefitNote(CreditCard card, SpendRewardCalculation calc, boolean unlocksWaiver, boolean helpsWaiver, double remainingAfter, boolean unlocksMilestone) {
        StringBuilder sb = new StringBuilder();
        if (calc.wasCapped) {
            sb.append(String.format("⚠️ Capped at ₹%.0f (effective %.1f%%)", calc.effectiveReward, calc.effectiveRewardRate));
        } else {
            sb.append(String.format("%.1f%% reward rate", calc.effectiveRewardRate));
        }

        if (unlocksWaiver) {
            sb.append(" • 🔥 Unlocks annual fee waiver!");
        } else if (helpsWaiver && remainingAfter > 0) {
            sb.append(String.format(" • Only ₹%.0f left for free fee waiver", remainingAfter));
        } else if (Boolean.TRUE.equals(card.getIsLtf())) {
            sb.append(" • Lifetime Free (LTF)");
        }
        if (unlocksMilestone) {
            sb.append(" • 🎁 Unlocks milestone reward!");
        }
        return sb.toString();
    }

    private String buildRecommendationReason(CardEvaluationInternal top, List<CardEvaluationInternal> all, double amount, String merchant) {
        String cardTitle = top.card.getCardName();
        String mTitle = (merchant != null && !merchant.isBlank()) ? merchant : "this purchase";

        // Check if there's a runner-up that was capped
        Optional<CardEvaluationInternal> cappedRunnerUp = all.stream()
                .filter(ev -> !ev.card.getId().equals(top.card.getId()) && ev.wasCapped && ev.theoreticalReward > top.rewardAmount)
                .findFirst();

        if (cappedRunnerUp.isPresent()) {
            CardEvaluationInternal rival = cappedRunnerUp.get();
            return String.format(
                    "Use %s! Earns ₹%.2f (%s). While %s offers a higher nominal rate, its %s rewards are capped at ₹%.0f (yielding only ₹%.2f this cycle), making %s yield ₹%.2f more!",
                    cardTitle, top.rewardAmount, (top.card.getAcceleratedRewardCap() == null ? "unlimited" : String.format("%.1f%% rate", top.rewardRate)),
                    rival.card.getCardName(), mTitle, rival.card.getAcceleratedRewardCap() != null ? rival.card.getAcceleratedRewardCap() : 1000.0,
                    rival.rewardAmount, cardTitle, (top.rewardAmount - rival.rewardAmount)
            );
        }

        if (top.unlocksWaiver) {
            return String.format("Use %s! It yields ₹%.2f rewards AND this purchase fully WAIVES your ₹%.0f Annual Fee!",
                    cardTitle, top.rewardAmount, top.card.getAnnualFee());
        }
        if (top.unlocksMilestone) {
            return String.format("Use %s! It yields ₹%.2f rewards AND unlocks your milestone bonus (%s)!",
                    cardTitle, top.rewardAmount, top.card.getMilestoneReward() != null ? top.card.getMilestoneReward() : "Bonus Voucher");
        }
        if (top.helpsWaiver && top.feeWaiverRemaining <= 35000) {
            return String.format("Use %s! Highest reward of ₹%.2f for %s, plus brings you within ₹%.0f of your annual fee waiver!",
                    cardTitle, top.rewardAmount, mTitle, top.waiverRemainingAfter);
        }

        return String.format("Use %s! Offers your highest reward of ₹%.2f on %s (%s).",
                cardTitle, top.rewardAmount, mTitle, (top.card.getAcceleratedRewardCap() == null ? "unlimited" : String.format("%.1f%% reward", top.rewardRate)));
    }

    private static class CardEvaluationInternal {
        CreditCard card;
        double rewardRate;
        double rewardAmount;
        double theoreticalReward;
        boolean wasCapped;
        String cappingNote;
        Double availableHeadroom;
        String cappingRuleSummary;
        double score;
        boolean unlocksWaiver;
        boolean helpsWaiver;
        double waiverRemainingAfter;
        boolean unlocksMilestone;
        String benefitNote;
        double feeWaiverRemaining;
        boolean alreadyWaived;

        public CardEvaluationInternal(CreditCard card, double rewardRate, double rewardAmount, double theoreticalReward,
                                      boolean wasCapped, String cappingNote, Double availableHeadroom, String cappingRuleSummary,
                                      double score, boolean unlocksWaiver, boolean helpsWaiver, double waiverRemainingAfter,
                                      boolean unlocksMilestone, String benefitNote, double feeWaiverRemaining, boolean alreadyWaived) {
            this.card = card;
            this.rewardRate = rewardRate;
            this.rewardAmount = rewardAmount;
            this.theoreticalReward = theoreticalReward;
            this.wasCapped = wasCapped;
            this.cappingNote = cappingNote;
            this.availableHeadroom = availableHeadroom;
            this.cappingRuleSummary = cappingRuleSummary;
            this.score = score;
            this.unlocksWaiver = unlocksWaiver;
            this.helpsWaiver = helpsWaiver;
            this.waiverRemainingAfter = waiverRemainingAfter;
            this.unlocksMilestone = unlocksMilestone;
            this.benefitNote = benefitNote;
            this.feeWaiverRemaining = feeWaiverRemaining;
            this.alreadyWaived = alreadyWaived;
        }

        public double getScore() {
            return score;
        }
    }
}
