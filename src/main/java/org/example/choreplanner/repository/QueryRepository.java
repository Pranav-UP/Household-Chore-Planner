package org.example.choreplanner.repository;

import org.example.choreplanner.entity.QueryMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface QueryRepository extends JpaRepository<QueryMessage, Long> {

    List<QueryMessage> findByChoreIdAndDeletedFalseOrderByTimestampAsc(Long choreId);

    @Modifying
    @Transactional
    @Query("UPDATE QueryMessage q SET q.deleted = true WHERE q.choreId = :choreId")
    void softDeleteByChoreId(@Param("choreId") Long choreId);

    @Query("SELECT q FROM QueryMessage q WHERE q.choreId = :choreId AND q.deleted = false ORDER BY q.timestamp ASC")
    List<QueryMessage> findActiveMessagesByChoreId(@Param("choreId") Long choreId);
}
