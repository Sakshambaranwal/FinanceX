package com.sakshambaranwal.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sakshambaranwal.userservice.entity.Address;

public interface AddressRepository extends JpaRepository<Address, Long> {
    // // Define custom query methods if needed
    Address findByCity(String city);
    Address findByState(String state);
    Address findByPincode(String pincode);
}