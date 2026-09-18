package com.sakshambaranwal.creditcard_service.controller;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sakshambaranwal.creditcard_service.dto.CardRecommendationDTO;
import com.sakshambaranwal.creditcard_service.dto.CardSummaryDTO;
import com.sakshambaranwal.creditcard_service.dto.CreditCardOverallSummaryDTO;
import com.sakshambaranwal.creditcard_service.entity.CreditCard;
import com.sakshambaranwal.creditcard_service.entity.CreditCardSpend;
import com.sakshambaranwal.creditcard_service.service.CreditCardService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/creditcard")
public class CreditCardController {

    @Autowired
    private CreditCardService creditCardService;

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

    @GetMapping("/catalog")
    public ResponseEntity<Object> getCatalog() {
        return ResponseEntity.ok(creditCardService.getCatalog());
    }

    // ==========================================
    // Cards Endpoints
    // ==========================================

    @GetMapping("/cards/user/{username}")
    public ResponseEntity<List<CardSummaryDTO>> getCardsByUser(@PathVariable String username) {
        return ResponseEntity.ok(creditCardService.getCardsWithSummary(username));
    }

    @GetMapping("/cards/{id}")
    public ResponseEntity<CardSummaryDTO> getCardById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(creditCardService.getCardSummaryById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/cards")
    public ResponseEntity<Object> addCard(@RequestBody CreditCard card) {
        try {
            CreditCard created = creditCardService.addCard(card);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/cards/{id}")
    public ResponseEntity<Object> updateCard(@PathVariable String id, @RequestBody CreditCard card) {
        try {
            CreditCard updated = creditCardService.updateCard(id, card);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/cards/{id}")
    public ResponseEntity<Object> deleteCard(@PathVariable String id) {
        boolean deleted = creditCardService.deleteCard(id);
        if (deleted) {
            return ResponseEntity.ok("Card and its spends deleted successfully");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Card not found");
    }

    @GetMapping("/summary/user/{username}")
    public ResponseEntity<CreditCardOverallSummaryDTO> getOverallSummary(@PathVariable String username) {
        return ResponseEntity.ok(creditCardService.getOverallSummary(username));
    }

    // ==========================================
    // Spends Endpoints
    // ==========================================

    @PostMapping("/spends")
    public ResponseEntity<Object> addSpend(@RequestBody CreditCardSpend spend) {
        try {
            CreditCardSpend created = creditCardService.addSpend(spend);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/spends/card/{cardId}")
    public ResponseEntity<List<CreditCardSpend>> getSpendsForCard(@PathVariable String cardId) {
        return ResponseEntity.ok(creditCardService.getSpendsForCard(cardId));
    }

    @GetMapping("/spends/user/{username}")
    public ResponseEntity<List<CreditCardSpend>> getSpendsForUser(@PathVariable String username) {
        return ResponseEntity.ok(creditCardService.getAllSpendsForUser(username));
    }

    @DeleteMapping("/spends/{id}")
    public ResponseEntity<Object> deleteSpend(@PathVariable String id) {
        boolean deleted = creditCardService.deleteSpend(id);
        if (deleted) {
            return ResponseEntity.ok("Spend record deleted successfully");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Spend not found");
    }

    // ==========================================
    // Smart Card Recommender Endpoint
    // ==========================================

    @GetMapping("/recommend")
    public ResponseEntity<CardRecommendationDTO> recommendCard(
            @RequestParam String username,
            @RequestParam double amount,
            @RequestParam(required = false) String merchant,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(creditCardService.recommendCard(username, amount, merchant, category));
    }
}

