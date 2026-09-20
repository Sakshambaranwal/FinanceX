package com.sakshambaranwal.p2p_service.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sakshambaranwal.p2p_service.dto.ContactSummaryDTO;
import com.sakshambaranwal.p2p_service.dto.P2POverallSummaryDTO;
import com.sakshambaranwal.p2p_service.entity.P2PContact;
import com.sakshambaranwal.p2p_service.entity.P2PTransaction;
import com.sakshambaranwal.p2p_service.repository.P2PContactRepository;
import com.sakshambaranwal.p2p_service.repository.P2PTransactionRepository;

@Service
public class P2PService {

    @Autowired
    private P2PContactRepository contactRepository;

    @Autowired
    private P2PTransactionRepository transactionRepository;

    @Transactional
    public P2PContact addContact(P2PContact contact) {
        if (contact.getName() == null || contact.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Contact name cannot be empty");
        }
        contact.setName(contact.getName().trim());
        if (contact.getPhone() != null) {
            contact.setPhone(contact.getPhone().trim());
        }
        if (contact.getEmail() != null) {
            contact.setEmail(contact.getEmail().trim().toLowerCase());
        }
        if (contact.getUpiId() != null) {
            contact.setUpiId(contact.getUpiId().trim());
        }
        if (contact.getLinkedUsername() != null) {
            contact.setLinkedUsername(contact.getLinkedUsername().trim());
        }
        if (contact.getIsSynced() == null) {
            contact.setIsSynced(false);
        }

        // If a contact already exists with this linked user, update it instead of creating duplicates
        if (Boolean.TRUE.equals(contact.getIsSynced()) && contact.getLinkedUsername() != null) {
            Optional<P2PContact> existing = contactRepository
                .findByUsernameIgnoreCaseAndLinkedUsernameIgnoreCase(contact.getUsername(), contact.getLinkedUsername());
            if (existing.isPresent()) {
                P2PContact toUpdate = existing.get();
                toUpdate.setName(contact.getName());
                if (contact.getPhone() != null) toUpdate.setPhone(contact.getPhone());
                if (contact.getEmail() != null) toUpdate.setEmail(contact.getEmail());
                if (contact.getUpiId() != null) toUpdate.setUpiId(contact.getUpiId());
                if (contact.getNotes() != null) toUpdate.setNotes(contact.getNotes());
                toUpdate.setIsSynced(true);
                toUpdate.setLinkedUsername(contact.getLinkedUsername());
                toUpdate.setUpdatedAt(LocalDateTime.now());
                contact = toUpdate;
            }
        }

        if (contact.getCreatedAt() == null) {
            contact.setCreatedAt(LocalDateTime.now());
        }
        contact.setUpdatedAt(LocalDateTime.now());
        P2PContact saved = contactRepository.save(contact);

        // If synced with another FinanceX user, ensure reciprocal contact exists for the other user
        if (Boolean.TRUE.equals(saved.getIsSynced()) && saved.getLinkedUsername() != null 
            && !saved.getLinkedUsername().equalsIgnoreCase(saved.getUsername())) {
            Optional<P2PContact> existingReciprocal = contactRepository
                .findByUsernameIgnoreCaseAndLinkedUsernameIgnoreCase(saved.getLinkedUsername(), saved.getUsername());
            if (existingReciprocal.isPresent()) {
                P2PContact reciprocal = existingReciprocal.get();
                reciprocal.setIsSynced(true);
                reciprocal.setLinkedUsername(saved.getUsername());
                reciprocal.setUpdatedAt(LocalDateTime.now());
                contactRepository.save(reciprocal);
            } else {
                P2PContact reciprocal = new P2PContact();
                reciprocal.setUsername(saved.getLinkedUsername());
                reciprocal.setName(saved.getUsername());
                reciprocal.setLinkedUsername(saved.getUsername());
                reciprocal.setIsSynced(true);
                reciprocal.setCurrency(saved.getCurrency());
                reciprocal.setCreatedAt(LocalDateTime.now());
                reciprocal.setUpdatedAt(LocalDateTime.now());
                contactRepository.save(reciprocal);
            }
        }

        return saved;
    }

    public List<ContactSummaryDTO> getContactsWithSummary(String username) {
        List<P2PContact> contacts = contactRepository.findAllByUsernameOrderByNameAsc(username);
        List<ContactSummaryDTO> result = new ArrayList<>();

        for (P2PContact c : contacts) {
            List<P2PTransaction> txList = transactionRepository.findAllByContactIdOrderByDateAscCreatedAtAsc(c.getId());
            double gave = 0;
            double got = 0;
            String lastDate = null;
            String lastDesc = null;

            for (P2PTransaction tx : txList) {
                if ("YOU_GAVE".equalsIgnoreCase(tx.getType())) {
                    gave += tx.getAmount();
                } else if ("YOU_GOT".equalsIgnoreCase(tx.getType())) {
                    got += tx.getAmount();
                }
                lastDate = tx.getDate();
                lastDesc = tx.getDescription();
            }

            double net = gave - got;
            result.add(new ContactSummaryDTO(c, gave, got, net, lastDate, lastDesc));
        }

        return result;
    }

    public Optional<P2PContact> getContact(String id) {
        return contactRepository.findById(id);
    }

    @Transactional
    public boolean deleteContact(String id) {
        if (contactRepository.existsById(id)) {
            transactionRepository.deleteAllByContactId(id);
            contactRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public P2PTransaction addTransaction(P2PTransaction transaction) {
        if (transaction.getAmount() <= 0) {
            throw new IllegalArgumentException("Transaction amount must be greater than 0");
        }
        if (!"YOU_GAVE".equalsIgnoreCase(transaction.getType()) && !"YOU_GOT".equalsIgnoreCase(transaction.getType())) {
            throw new IllegalArgumentException("Transaction type must be YOU_GAVE or YOU_GOT");
        }
        transaction.setType(transaction.getType().toUpperCase());
        if (transaction.getDate() == null || transaction.getDate().trim().isEmpty()) {
            transaction.setDate(LocalDate.now().toString());
        }
        if (transaction.getSyncPairId() == null || transaction.getSyncPairId().isBlank()) {
            transaction.setSyncPairId(UUID.randomUUID().toString());
        }
        transaction.setCreatedAt(LocalDateTime.now());

        // Update contact updatedAt
        P2PContact contact = contactRepository.findById(transaction.getContactId()).orElse(null);
        if (contact != null) {
            contact.setUpdatedAt(LocalDateTime.now());
            contactRepository.save(contact);
        }

        P2PTransaction saved = transactionRepository.save(transaction);

        // Check if contact is synced with another FinanceX user
        if (contact != null && Boolean.TRUE.equals(contact.getIsSynced()) 
            && contact.getLinkedUsername() != null 
            && !contact.getLinkedUsername().equalsIgnoreCase(contact.getUsername())) {
            
            // Look up or create reciprocal contact for the other user
            P2PContact reciprocalContact = contactRepository
                .findByUsernameIgnoreCaseAndLinkedUsernameIgnoreCase(contact.getLinkedUsername(), contact.getUsername())
                .orElseGet(() -> {
                    P2PContact rc = new P2PContact();
                    rc.setUsername(contact.getLinkedUsername());
                    rc.setName(contact.getUsername());
                    rc.setLinkedUsername(contact.getUsername());
                    rc.setIsSynced(true);
                    rc.setCurrency(contact.getCurrency());
                    rc.setCreatedAt(LocalDateTime.now());
                    rc.setUpdatedAt(LocalDateTime.now());
                    return contactRepository.save(rc);
                });

            // Ensure reciprocal contact is marked as synced
            if (!Boolean.TRUE.equals(reciprocalContact.getIsSynced())) {
                reciprocalContact.setIsSynced(true);
                reciprocalContact.setLinkedUsername(contact.getUsername());
                reciprocalContact.setUpdatedAt(LocalDateTime.now());
                contactRepository.save(reciprocalContact);
            }

            // Mirror transaction for reciprocal contact (only if reciprocal doesn't already have it)
            List<P2PTransaction> existingPairs = transactionRepository.findAllBySyncPairId(saved.getSyncPairId());
            boolean hasReciprocal = existingPairs.stream().anyMatch(t -> !t.getId().equals(saved.getId()));
            if (!hasReciprocal) {
                P2PTransaction reciprocalTx = new P2PTransaction();
                reciprocalTx.setContactId(reciprocalContact.getId());
                reciprocalTx.setUsername(contact.getLinkedUsername());
                reciprocalTx.setType("YOU_GAVE".equalsIgnoreCase(saved.getType()) ? "YOU_GOT" : "YOU_GAVE");
                reciprocalTx.setAmount(saved.getAmount());
                reciprocalTx.setDate(saved.getDate());
                reciprocalTx.setDescription(saved.getDescription());
                reciprocalTx.setPaymentMode(saved.getPaymentMode());
                reciprocalTx.setCurrency(saved.getCurrency());
                reciprocalTx.setSyncPairId(saved.getSyncPairId());
                reciprocalTx.setCreatedAt(LocalDateTime.now());
                transactionRepository.save(reciprocalTx);

                reciprocalContact.setUpdatedAt(LocalDateTime.now());
                contactRepository.save(reciprocalContact);
            }
        }

        return saved;
    }

    @Transactional
    public P2PContact updateContact(String id, P2PContact updated) {
        return contactRepository.findById(id).map(existing -> {
            if (updated.getName() != null && !updated.getName().isBlank()) {
                existing.setName(updated.getName().trim());
            }
            if (updated.getPhone() != null) existing.setPhone(updated.getPhone().trim());
            if (updated.getEmail() != null) existing.setEmail(updated.getEmail().trim().toLowerCase());
            if (updated.getUpiId() != null) existing.setUpiId(updated.getUpiId().trim());
            if (updated.getIsSynced() != null) existing.setIsSynced(updated.getIsSynced());
            if (updated.getLinkedUsername() != null) existing.setLinkedUsername(updated.getLinkedUsername().trim());
            if (updated.getNotes() != null) existing.setNotes(updated.getNotes().trim());
            if (updated.getCurrency() != null) existing.setCurrency(updated.getCurrency());
            existing.setUpdatedAt(LocalDateTime.now());

            // If synced, also sync reciprocal contact
            if (Boolean.TRUE.equals(existing.getIsSynced()) && existing.getLinkedUsername() != null) {
                contactRepository.findByUsernameIgnoreCaseAndLinkedUsernameIgnoreCase(
                    existing.getLinkedUsername(), existing.getUsername()
                ).ifPresent(rc -> {
                    rc.setIsSynced(true);
                    rc.setLinkedUsername(existing.getUsername());
                    rc.setUpdatedAt(LocalDateTime.now());
                    contactRepository.save(rc);
                });
            }

            return contactRepository.save(existing);
        }).orElse(null);
    }

    public List<P2PTransaction> getTransactionsForContact(String contactId) {
        return transactionRepository.findAllByContactIdOrderByDateAscCreatedAtAsc(contactId);
    }

    @Transactional
    public boolean deleteTransaction(String id) {
        Optional<P2PTransaction> txOpt = transactionRepository.findById(id);
        if (txOpt.isPresent()) {
            P2PTransaction tx = txOpt.get();
            if (tx.getSyncPairId() != null && !tx.getSyncPairId().isBlank()) {
                transactionRepository.deleteAllBySyncPairId(tx.getSyncPairId());
            } else {
                transactionRepository.deleteById(id);
            }
            return true;
        }
        return false;
    }

    public P2POverallSummaryDTO getOverallSummary(String username) {
        List<ContactSummaryDTO> summaries = getContactsWithSummary(username);
        double totalWillGet = 0;
        double totalWillGive = 0;
        int settled = 0;

        for (ContactSummaryDTO s : summaries) {
            double net = s.getNetBalance();
            if (net > 0.001) {
                totalWillGet += net;
            } else if (net < -0.001) {
                totalWillGive += Math.abs(net);
            } else {
                settled++;
            }
        }

        double netBalance = totalWillGet - totalWillGive;
        return new P2POverallSummaryDTO(totalWillGet, totalWillGive, netBalance, summaries.size(), settled);
    }

    @Transactional
    public P2PTransaction settleUp(String contactId, String username, String paymentMode) {
        P2PContact contact = contactRepository.findById(contactId)
            .orElseThrow(() -> new IllegalArgumentException("Contact not found: " + contactId));

        List<P2PTransaction> txList = transactionRepository.findAllByContactIdOrderByDateAscCreatedAtAsc(contactId);
        double gave = 0;
        double got = 0;
        for (P2PTransaction tx : txList) {
            if ("YOU_GAVE".equalsIgnoreCase(tx.getType())) {
                gave += tx.getAmount();
            } else if ("YOU_GOT".equalsIgnoreCase(tx.getType())) {
                got += tx.getAmount();
            }
        }

        double net = gave - got;
        if (Math.abs(net) < 0.001) {
            throw new IllegalStateException("Account is already settled (balance is 0)");
        }

        P2PTransaction settlingTx = new P2PTransaction();
        settlingTx.setContactId(contactId);
        settlingTx.setUsername(username);
        settlingTx.setDate(LocalDate.now().toString());
        settlingTx.setPaymentMode(paymentMode != null ? paymentMode : "UPI");
        settlingTx.setCurrency(contact.getCurrency() != null ? contact.getCurrency() : "USD");
        settlingTx.setCreatedAt(LocalDateTime.now());

        if (net > 0) {
            // Party owed user money -> user receives payment (YOU_GOT)
            settlingTx.setType("YOU_GOT");
            settlingTx.setAmount(net);
            settlingTx.setDescription("Full settlement received (" + settlingTx.getPaymentMode() + ")");
        } else {
            // User owed party money -> user pays them (YOU_GAVE)
            settlingTx.setType("YOU_GAVE");
            settlingTx.setAmount(Math.abs(net));
            settlingTx.setDescription("Full settlement paid (" + settlingTx.getPaymentMode() + ")");
        }

        return addTransaction(settlingTx);
    }
}

