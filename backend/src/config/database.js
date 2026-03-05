const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'resq_ke',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const initDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS resq_ke`);
    console.log('Database created or already exists');
  } finally {
    await connection.end();
  }

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20),
      role ENUM('user', 'admin') DEFAULT 'user',
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_email (email),
      KEY idx_role (role)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description LONGTEXT NOT NULL,
      category VARCHAR(50),
      severity VARCHAR(20),
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      location_text VARCHAR(500),
      status VARCHAR(50) DEFAULT 'submitted',
      anonymous BOOLEAN DEFAULT FALSE,
      contact_phone VARCHAR(20),
      reported_by VARCHAR(36),
      reporter_name VARCHAR(255) DEFAULT 'Anonymous',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (reported_by) REFERENCES users(id),
      KEY idx_status (status),
      KEY idx_category (category),
      KEY idx_location (latitude, longitude),
      KEY idx_created_at (created_at)
    );

    CREATE TABLE IF NOT EXISTS report_images (
      id VARCHAR(36) PRIMARY KEY,
      report_id VARCHAR(36) NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(36) PRIMARY KEY,
      report_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      user_name VARCHAR(255),
      text LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      KEY idx_report_id (report_id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id VARCHAR(36) PRIMARY KEY,
      report_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_like (report_id, user_id),
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS admin_updates (
      id VARCHAR(36) PRIMARY KEY,
      report_id VARCHAR(36) NOT NULL,
      admin_id VARCHAR(36) NOT NULL,
      admin_name VARCHAR(255),
      status VARCHAR(50),
      message LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
      FOREIGN KEY (admin_id) REFERENCES users(id),
      KEY idx_report_id (report_id)
    );

    CREATE TABLE IF NOT EXISTS site_logs (
      id VARCHAR(36) PRIMARY KEY,
      actor_id VARCHAR(36),
      actor_name VARCHAR(255),
      actor_role VARCHAR(20),
      action VARCHAR(120) NOT NULL,
      entity_type VARCHAR(80),
      entity_id VARCHAR(36),
      details LONGTEXT,
      ip_address VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_created_at (created_at),
      KEY idx_action (action)
    );

    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      description VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const conn = await pool.getConnection();
  try {
    const statements = schema.split(';').filter((s) => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        await conn.query(stmt);
      }
    }
    console.log('Database schema initialized');
  } finally {
    conn.release();
  }
};

module.exports = {
  pool,
  initDatabase,
};
