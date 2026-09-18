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

import com.sakshambaranwal.expense_service.entity.Investment;
import com.sakshambaranwal.expense_service.service.InvestmentService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/investment")
public class InvestmentController {

    @Autowired
    private InvestmentService investmentService;

    @PostMapping
    public ResponseEntity<Investment> addInvestment(@RequestBody Investment investment) {
        Investment created = investmentService.addInvestment(investment);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Investment> getInvestmentById(@PathVariable String id) {
        Investment investment = investmentService.getInvestmentById(id);
        if (investment != null) {
            return ResponseEntity.ok(investment);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Investment>> getInvestmentsByUsername(@PathVariable String username) {
        List<Investment> list = investmentService.getInvestmentsByUsername(username);
        return ResponseEntity.ok(list);
    }

    @PutMapping
    public ResponseEntity<Investment> updateInvestment(@RequestBody Investment investment) {
        Investment updated = investmentService.updateInvestment(investment);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteInvestment(@PathVariable String id) {
        boolean deleted = investmentService.deleteInvestment(id);
        if (deleted) {
            return ResponseEntity.ok("Investment deleted successfully");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Investment not found");
    }
}

