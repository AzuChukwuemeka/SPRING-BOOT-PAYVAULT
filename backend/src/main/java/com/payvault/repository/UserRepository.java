package com.payvault.repository;

import com.payvault.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<User> userRowMapper = (rs, rowNum) -> {
        User user = new User();
        user.setId(rs.getLong("id"));
        user.setName(rs.getString("name"));
        user.setEmail(rs.getString("email"));
        user.setBalance(rs.getBigDecimal("balance"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) user.setCreatedAt(ts.toLocalDateTime());
        return user;
    };

    public List<User> findAll() {
        String sql = "SELECT id, name, email, balance, created_at FROM users ORDER BY created_at DESC";
        return jdbc.query(sql, userRowMapper);
    }

    public Optional<User> findById(Long id) {
        String sql = "SELECT id, name, email, balance, created_at FROM users WHERE id = ?";
        List<User> results = jdbc.query(sql, userRowMapper, id);
        return results.stream().findFirst();
    }

    public Optional<User> findByEmail(String email) {
        String sql = "SELECT id, name, email, balance, created_at FROM users WHERE email = ?";
        List<User> results = jdbc.query(sql, userRowMapper, email);
        return results.stream().findFirst();
    }

    public User save(User user) {
        String sql = "INSERT INTO users (name, email, balance) VALUES (?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, user.getName());
            ps.setString(2, user.getEmail());
            ps.setBigDecimal(3, user.getBalance());
            return ps;
        }, keyHolder);

        // H2 returns generated keys as uppercase column names in a map
        Map<String, Object> keys = keyHolder.getKeys();
        if (keys != null) {
            Object idVal = keys.get("ID");
            if (idVal == null) idVal = keys.get("id");
            if (idVal != null) user.setId(((Number) idVal).longValue());
        }

        return user;
    }

    public int updateBalance(Long userId, BigDecimal newBalance) {
        String sql = "UPDATE users SET balance = ? WHERE id = ?";
        return jdbc.update(sql, newBalance, userId);
    }

    public boolean existsByEmail(String email) {
        String sql = "SELECT COUNT(*) FROM users WHERE email = ?";
        Integer count = jdbc.queryForObject(sql, Integer.class, email);
        return count != null && count > 0;
    }
}
