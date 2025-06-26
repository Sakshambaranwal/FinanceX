package com.sakshambaranwal.expense_service.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.sakshambaranwal.expense_service.entity.Expense;
import com.sakshambaranwal.expense_service.repository.ExpenseRepository;


@Component
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    public boolean addExpense(Expense expense) {
        try {
            expenseRepository.save(expense);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    public boolean deleteExpense(String id) {
        try {
            expenseRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    public boolean updateExpense(Expense expense) {
        try {
            if (expenseRepository.existsById(expense.getId())) {
                expenseRepository.save(expense);
                return true;
            } else {
                return false;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    public Expense getExpenseById(String id) {
        return expenseRepository.findById(id).orElse(null);
    }
    public List<Expense> getAllExpensesByUsername(String username) {
        return expenseRepository.findAllByUsername(username)
                .stream()
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());
    }
}
