package com.payvault.controller;

import com.payvault.dto.ApiResponse;
import com.payvault.dto.PaymentRequest;
import com.payvault.model.Transaction;
import com.payvault.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Transaction>> sendPayment(
            @Valid @RequestBody PaymentRequest request) {
        Transaction tx = paymentService.sendPayment(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Payment sent successfully", tx));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<Transaction>>> getAllTransactions() {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getAllTransactions()));
    }

    @GetMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<Transaction>> getTransaction(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getTransactionById(id)));
    }
}
