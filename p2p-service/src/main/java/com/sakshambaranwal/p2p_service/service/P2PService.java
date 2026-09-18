package com.sakshambaranwal.p2p_service.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    public P2PContact addContact(P2PContact contact) {
        if (contact.getName() == null || contact.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Contact name cannot be empty");
        }
        contact.setName(contact.getName().trim());
        if (contact.getPhone() != null) {
            contact.setPhone(contact.getPhone().trim());
        }
        contact.setCreatedAt(LocalDateTime.now());
        contact.setUpdatedAt(LocalDateTime.now());
        return contactRepository.save(contact);
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
        transaction.setCreatedAt(LocalDateTime.now());

        // update contact updatedAt
        contactRepository.findById(transaction.getContactId()).ifPresent(c -> {
            c.setUpdatedAt(LocalDateTime.now());
            contactRepository.save(c);
        });

        return transactionRepository.save(transaction);
    }

    public List<P2PTransaction> getTransactionsForContact(String contactId) {
        return transactionRepository.findAllByContactIdOrderByDateAscCreatedAtAsc(contactId);
    }

    public boolean deleteTransaction(String id) {
        if (transactionRepository.existsById(id)) {
            transactionRepository.deleteById(id);
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
            if (s.getNetBalance() > 0.001) {
                totalWillGet += s.getNetBalance();
            } else if (s.getNetBalance() < -0.001) {
                totalWillGive += Math.abs(s.getNetBalance());
            } else {
                settled++;
            }
        }

        double net = totalWillGet - totalWillGive;
        return new P2POverallSummaryDTO(totalWillGet, totalWillGive, net, summaries.size(), settled);
    }

    @Transactional
    public P2PTransaction settleUp(String contactId, String username, String paymentMode) {
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
        settlingTx.setPaymentMode(paymentMode != null ? paymentMode : "Cash");
        settlingTx.setCreatedAt(LocalDateTime.now());

        if (net > 0) {
            // Party owed user money -> user receives payment (YOU_GOT)
            settlingTx.setType("YOU_GOT");
            settlingTx.setAmount(net);
            settlingTx.setDescription("Full settlement received");
        } else {
            // User owed party money -> user pays them (YOU_GAVE)
            settlingTx.setType("YOU_GAVE");
            settlingTx.setAmount(Math.abs(net));
            settlingTx.setDescription("Full settlement paid");
        }

        return transactionRepository.save(settlingTx);
    }
}

