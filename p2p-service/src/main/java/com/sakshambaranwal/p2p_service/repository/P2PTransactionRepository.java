package com.sakshambaranwal.p2p_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sakshambaranwal.p2p_service.entity.P2PTransaction;

@Repository
public interface P2PTransactionRepository extends JpaRepository<P2PTransaction, String> {
    List<P2PTransaction> findAllByContactIdOrderByDateAscCreatedAtAsc(String contactId);
    List<P2PTransaction> findAllByUsername(String username);
    void deleteAllByContactId(String contactId);
}

