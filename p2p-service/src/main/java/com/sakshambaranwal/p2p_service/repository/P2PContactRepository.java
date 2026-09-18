package com.sakshambaranwal.p2p_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sakshambaranwal.p2p_service.entity.P2PContact;

@Repository
public interface P2PContactRepository extends JpaRepository<P2PContact, String> {
    List<P2PContact> findAllByUsernameOrderByNameAsc(String username);
    Optional<P2PContact> findByIdAndUsername(String id, String username);
    void deleteByIdAndUsername(String id, String username);
}

