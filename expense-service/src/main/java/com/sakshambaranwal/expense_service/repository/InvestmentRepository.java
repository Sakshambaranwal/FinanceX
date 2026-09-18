package com.sakshambaranwal.expense_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sakshambaranwal.expense_service.entity.Investment;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, String> {
    List<Investment> findAllByUsername(String username);
}

