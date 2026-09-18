package com.sakshambaranwal.expense_service.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sakshambaranwal.expense_service.entity.Expense;
import com.sakshambaranwal.expense_service.service.ExpenseService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/expense")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

    @PostMapping
    public ResponseEntity<Object> addExpense(@RequestBody Expense expense) {
        boolean success = expenseService.addExpense(expense);
        if (success) {
            return new ResponseEntity<>(expense, HttpStatus.CREATED);
        }
        return new ResponseEntity<>("Failed to add expense", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getExpenseById(@PathVariable String id) {
        Expense expense = expenseService.getExpenseById(id);
        if (expense != null) {
            return ResponseEntity.ok(expense);
        }
        return new ResponseEntity<>("Expense not found", HttpStatus.NOT_FOUND);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Expense>> getExpensesByUsername(@PathVariable String username) {
        List<Expense> expenses = expenseService.getAllExpensesByUsername(username);
        return ResponseEntity.ok(expenses);
    }

    @PutMapping
    public ResponseEntity<Object> updateExpense(@RequestBody Expense expense) {
        boolean success = expenseService.updateExpense(expense);
        if (success) {
            return ResponseEntity.ok(expense);
        }
        return new ResponseEntity<>("Expense not found or update failed", HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteExpense(@PathVariable String id) {
        boolean success = expenseService.deleteExpense(id);
        if (success) {
            return ResponseEntity.ok("Expense deleted successfully");
        }
        return new ResponseEntity<>("Expense not found or delete failed", HttpStatus.NOT_FOUND);
    }
}
