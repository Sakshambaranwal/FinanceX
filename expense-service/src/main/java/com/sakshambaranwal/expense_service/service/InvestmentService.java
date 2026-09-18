package com.sakshambaranwal.expense_service.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sakshambaranwal.expense_service.entity.Investment;
import com.sakshambaranwal.expense_service.repository.InvestmentRepository;

@Service
public class InvestmentService {

    @Autowired
    private InvestmentRepository investmentRepository;

    public Investment addInvestment(Investment investment) {
        if (investment.getCurrentAmount() == 0 && investment.getPrincipalAmount() > 0) {
            investment.setCurrentAmount(investment.getPrincipalAmount());
        }
        investment.setTotalReturns(investment.getCurrentAmount() - investment.getPrincipalAmount());
        return investmentRepository.save(investment);
    }

    public boolean deleteInvestment(String id) {
        if (investmentRepository.existsById(id)) {
            investmentRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public Investment updateInvestment(Investment investment) {
        if (investment.getId() != null && investmentRepository.existsById(investment.getId())) {
            investment.setTotalReturns(investment.getCurrentAmount() - investment.getPrincipalAmount());
            return investmentRepository.save(investment);
        }
        return null;
    }

    public Investment getInvestmentById(String id) {
        return investmentRepository.findById(id).orElse(null);
    }

    public List<Investment> getInvestmentsByUsername(String username) {
        return investmentRepository.findAllByUsername(username);
    }
}

