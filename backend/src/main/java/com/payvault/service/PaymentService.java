package com.payvault.service;

import com.payvault.dto.PaymentRequest;
import com.payvault.exception.InsufficientFundsException;
import com.payvault.exception.ResourceNotFoundException;
import com.payvault.model.Transaction;
import com.payvault.model.User;
import com.payvault.repository.TransactionRepository;
import com.payvault.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PaymentService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public PaymentService(TransactionRepository transactionRepository,
                          UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Transaction sendPayment(PaymentRequest request) {
        if (request.getSenderId().equals(request.getReceiverId())) {
            throw new IllegalArgumentException("Sender and receiver cannot be the same user");
        }

        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Sender not found with id: " + request.getSenderId()));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Receiver not found with id: " + request.getReceiverId()));

        if (sender.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientFundsException(
                    String.format("Insufficient funds. Available: %.2f, Requested: %.2f",
                            sender.getBalance(), request.getAmount()));
        }

        // Debit sender
        userRepository.updateBalance(
                sender.getId(),
                sender.getBalance().subtract(request.getAmount())
        );

        // Credit receiver
        userRepository.updateBalance(
                receiver.getId(),
                receiver.getBalance().add(request.getAmount())
        );

        // Record the transaction
        Transaction tx = new Transaction();
        tx.setSenderId(sender.getId());
        tx.setReceiverId(receiver.getId());
        tx.setAmount(request.getAmount());
        tx.setNote(request.getNote());
        tx.setStatus("COMPLETED");
        tx.setSenderName(sender.getName());
        tx.setReceiverName(receiver.getName());

        return transactionRepository.save(tx);
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Transaction not found with id: " + id));
    }

    public List<Transaction> getTransactionsByUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + userId));
        return transactionRepository.findByUserId(userId);
    }
}
