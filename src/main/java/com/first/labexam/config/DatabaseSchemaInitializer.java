package com.first.labexam.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Component
public class DatabaseSchemaInitializer implements ApplicationRunner {

    private final DataSource dataSource;

    public DatabaseSchemaInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {

            // Drop legacy constraints if present and update to support HOD, ADMIN, PENDING, REJECTED
            try {
                statement.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role");
                statement.execute("ALTER TABLE users ADD CONSTRAINT check_user_role CHECK (role IN ('STUDENT', 'PROFESSOR', 'HOD', 'ADMIN'))");
            } catch (Exception e) {
                System.err.println("Role constraint update warning: " + e.getMessage());
            }

            try {
                statement.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_status");
                statement.execute("ALTER TABLE users ADD CONSTRAINT check_user_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED'))");
            } catch (Exception e) {
                System.err.println("Status constraint update warning: " + e.getMessage());
            }

            // Create unique index to enforce maximum 1 ACTIVE HOD per department in PostgreSQL
            try {
                statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_one_hod_per_department ON users (department) WHERE role = 'HOD' AND status = 'ACTIVE'");
            } catch (Exception e) {
                // Partial index warning for non-PostgreSQL DBs during tests - business logic in AdminService enforces 1 HOD per dept
            }

        } catch (Exception ex) {
            System.err.println("Database schema migration error: " + ex.getMessage());
        }
    }
}
