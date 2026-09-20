package com.sakshambaranwal.p2p_service.controller;

import java.util.List;
import java.util.Map;

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

import com.sakshambaranwal.p2p_service.dto.ContactSummaryDTO;
import com.sakshambaranwal.p2p_service.dto.P2POverallSummaryDTO;
import com.sakshambaranwal.p2p_service.entity.P2PContact;
import com.sakshambaranwal.p2p_service.entity.P2PTransaction;
import com.sakshambaranwal.p2p_service.service.P2PService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/p2p")
public class P2PController {

    @Autowired
    private P2PService p2pService;

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

    @GetMapping("/summary/user/{username}")
    public ResponseEntity<P2POverallSummaryDTO> getOverallSummary(@PathVariable String username) {
        return ResponseEntity.ok(p2pService.getOverallSummary(username));
    }

    @GetMapping("/contacts/user/{username}")
    public ResponseEntity<List<ContactSummaryDTO>> getContactsWithSummary(@PathVariable String username) {
        return ResponseEntity.ok(p2pService.getContactsWithSummary(username));
    }

    @PostMapping("/contacts")
    public ResponseEntity<Object> addContact(@RequestBody P2PContact contact) {
        try {
            P2PContact created = p2pService.addContact(contact);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/contacts/{id}")
    public ResponseEntity<P2PContact> getContactById(@PathVariable String id) {
        return p2pService.getContact(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/contacts/{id}")
    public ResponseEntity<Object> updateContact(@PathVariable String id, @RequestBody P2PContact contact) {
        try {
            P2PContact updated = p2pService.updateContact(id, contact);
            if (updated != null) {
                return ResponseEntity.ok(updated);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Contact not found");
        } catch (Exception e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/contacts/{id}")
    public ResponseEntity<Object> deleteContact(@PathVariable String id) {
        boolean deleted = p2pService.deleteContact(id);
        if (deleted) {
            return ResponseEntity.ok("Contact and its transactions deleted successfully");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Contact not found");
    }

    @GetMapping("/transactions/contact/{contactId}")
    public ResponseEntity<List<P2PTransaction>> getTransactionsForContact(@PathVariable String contactId) {
        return ResponseEntity.ok(p2pService.getTransactionsForContact(contactId));
    }

    @PostMapping("/transactions")
    public ResponseEntity<Object> addTransaction(@RequestBody P2PTransaction transaction) {
        try {
            P2PTransaction created = p2pService.addTransaction(transaction);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Object> deleteTransaction(@PathVariable String id) {
        boolean deleted = p2pService.deleteTransaction(id);
        if (deleted) {
            return ResponseEntity.ok("Transaction deleted successfully");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Transaction not found");
    }

    @PostMapping("/settle/{contactId}")
    public ResponseEntity<Object> settleUp(@PathVariable String contactId, @RequestBody(required = false) Map<String, String> payload) {
        try {
            String username = payload != null ? payload.get("username") : null;
            String paymentMode = payload != null ? payload.get("paymentMode") : "Cash";
            P2PTransaction settlingTx = p2pService.settleUp(contactId, username, paymentMode);
            return ResponseEntity.ok(settlingTx);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error settling balance: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

