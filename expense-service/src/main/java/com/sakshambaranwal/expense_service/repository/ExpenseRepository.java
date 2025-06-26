package com.sakshambaranwal.expense_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

import com.sakshambaranwal.expense_service.entity.Expense;

@Component
public interface ExpenseRepository extends JpaRepository<Expense, String> {

    List<Optional<Expense>> findAllByUsername(String username);

    // This interface will automatically provide CRUD operations for the Expense entity.
    // No additional methods are needed unless custom queries are required.
    
}
