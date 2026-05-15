package com.payvault.repository;

import com.payvault.model.Transaction;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class TransactionRepository {

    private final JdbcTemplate jdbc;

    public TransactionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Transaction> txRowMapper = (rs, rowNum) -> {
        Transaction tx = new Transaction();
        tx.setId(rs.getLong("id"));
        tx.setSenderId(rs.getLong("sender_id"));
        tx.setReceiverId(rs.getLong("receiver_id"));
        tx.setAmount(rs.getBigDecimal("amount"));
        tx.setNote(rs.getString("note"));
        tx.setStatus(rs.getString("status"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) tx.setCreatedAt(ts.toLocalDateTime());
        tx.setSenderName(rs.getString("sender_name"));
        tx.setReceiverName(rs.getString("receiver_name"));
        return tx;
    };

    private static final String BASE_SELECT = """
            SELECT
                t.id,
                t.sender_id,
                t.receiver_id,
                t.amount,
                t.note,
                t.status,
                t.created_at,
                s.name AS sender_name,
                r.name AS receiver_name
            FROM transactions t
            JOIN users s ON t.sender_id   = s.id
            JOIN users r ON t.receiver_id = r.id
            """;

    public List<Transaction> findAll() {
        String sql = BASE_SELECT + "ORDER BY t.created_at DESC";
        return jdbc.query(sql, txRowMapper);
    }

    public Optional<Transaction> findById(Long id) {
        String sql = BASE_SELECT + "WHERE t.id = ?";
        List<Transaction> results = jdbc.query(sql, txRowMapper, id);
        return results.stream().findFirst();
    }

    public List<Transaction> findByUserId(Long userId) {
        String sql = BASE_SELECT
                + "WHERE t.sender_id = ? OR t.receiver_id = ? "
                + "ORDER BY t.created_at DESC";
        return jdbc.query(sql, txRowMapper, userId, userId);
    }

    public Transaction save(Transaction tx) {
        String sql = """
                INSERT INTO transactions (sender_id, receiver_id, amount, note, status)
                VALUES (?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, tx.getSenderId());
            ps.setLong(2, tx.getReceiverId());
            ps.setBigDecimal(3, tx.getAmount());
            ps.setString(4, tx.getNote());
            ps.setString(5, tx.getStatus() != null ? tx.getStatus() : "COMPLETED");
            return ps;
        }, keyHolder);

        // H2 returns generated keys as uppercase column names in a map
        Map<String, Object> keys = keyHolder.getKeys();
        if (keys != null) {
            Object idVal = keys.get("ID");
            if (idVal == null) idVal = keys.get("id");
            if (idVal != null) tx.setId(((Number) idVal).longValue());
        }

        return tx;
    }

    public long countByUserId(Long userId) {
        String sql = "SELECT COUNT(*) FROM transactions WHERE sender_id = ? OR receiver_id = ?";
        Long count = jdbc.queryForObject(sql, Long.class, userId, userId);
        return count != null ? count : 0;
    }
}
