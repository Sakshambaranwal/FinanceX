package com.sakshambaranwal.p2p_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class P2POverallSummaryDTO {
    private double totalYouWillGet;  // Total receivables (Udhaar diya, wapas aana hai)
    private double totalYouWillGive; // Total payables (Udhaar liya, wapas dena hai)
    private double netBalance;        // totalYouWillGet - totalYouWillGive
    private int totalContacts;
    private int settledContacts;
}

