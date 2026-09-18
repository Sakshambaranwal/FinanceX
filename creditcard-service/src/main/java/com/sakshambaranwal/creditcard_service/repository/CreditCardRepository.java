package com.sakshambaranwal.creditcard_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sakshambaranwal.creditcard_service.entity.CreditCard;

@Repository
public interface CreditCardRepository extends JpaRepository<CreditCard, String> {
    List<CreditCard> findByUsername(String username);
    Optional<CreditCard> findByIdAndUsername(String id, String username);
}

