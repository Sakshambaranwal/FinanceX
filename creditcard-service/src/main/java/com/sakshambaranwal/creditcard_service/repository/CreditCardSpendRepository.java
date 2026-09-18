package com.sakshambaranwal.creditcard_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sakshambaranwal.creditcard_service.entity.CreditCardSpend;

@Repository
public interface CreditCardSpendRepository extends JpaRepository<CreditCardSpend, String> {
    List<CreditCardSpend> findByCardId(String cardId);
    List<CreditCardSpend> findByCardIdOrderByDateDesc(String cardId);
    List<CreditCardSpend> findByUsername(String username);
    List<CreditCardSpend> findByUsernameOrderByDateDesc(String username);
    void deleteByCardId(String cardId);
}

