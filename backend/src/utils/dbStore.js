const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const store = {
  async createUser(user) {
    const id = uuidv4();
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'INSERT INTO users (id, name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
        [id, user.name, user.email, user.phone || '', user.role || 'user', user.passwordHash]
      );
      return { id, ...user };
    } finally {
      conn.release();
    }
  },

  async getUserByEmail(email) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      return rows[0] || null;
    } finally {
      conn.release();
    }
  },

  async getUserById(id) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id, name, email, role, phone FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    } finally {
      conn.release();
    }
  },

  async getAllUsers() {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id, name, email, role, phone, created_at FROM users');
      return rows;
    } finally {
      conn.release();
    }
  },

  async createReport(report) {
    const id = uuidv4();
    const conn = await pool.getConnection();
    try {
      await conn.query(
        `INSERT INTO reports 
        (id, title, description, category, severity, latitude, longitude, location_text, 
         anonymous, contact_phone, reported_by, reporter_name, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          report.title,
          report.description,
          report.category,
          report.severity,
          report.location?.latitude || null,
          report.location?.longitude || null,
          report.location?.locationText || '',
          report.anonymous ? 1 : 0,
          report.contactPhone || '',
          report.reportedBy || null,
          report.reporterName,
          report.status,
        ]
      );
      return { id, ...report };
    } finally {
      conn.release();
    }
  },

  async getReports(filters = {}) {
    const conn = await pool.getConnection();
    try {
      let query = 'SELECT * FROM reports WHERE 1=1';
      const params = [];

      if (filters.nearLat !== undefined && filters.nearLng !== undefined && filters.radiusKm !== undefined) {
        const earthRadiusKm = 6371;
        query += `
          AND (
            3959 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + 
                  sin(radians(?)) * sin(radians(latitude))) <= ?
          )
        `;
        params.push(filters.nearLat, filters.nearLng, filters.nearLat, filters.radiusKm);
      }

      query += ' ORDER BY created_at DESC LIMIT 500';

      const [rows] = await conn.query(query, params);

      const reports = await Promise.all(
        rows.map(async (row) => ({
          ...row,
          location: {
            latitude: row.latitude,
            longitude: row.longitude,
            locationText: row.location_text,
          },
          images: await this.getReportImages(row.id),
          comments: await this.getReportComments(row.id),
          likes: await this.getReportLikes(row.id),
          adminUpdates: await this.getAdminUpdates(row.id),
        }))
      );

      return reports;
    } finally {
      conn.release();
    }
  },

  async getReportById(id) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT * FROM reports WHERE id = ?', [id]);
      if (!rows[0]) return null;

      const report = rows[0];
      return {
        ...report,
        location: {
          latitude: report.latitude,
          longitude: report.longitude,
          locationText: report.location_text,
        },
        images: await this.getReportImages(id),
        comments: await this.getReportComments(id),
        likes: await this.getReportLikes(id),
        adminUpdates: await this.getAdminUpdates(id),
      };
    } finally {
      conn.release();
    }
  },

  async getReportsByUserId(userId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT * FROM reports WHERE reported_by = ? ORDER BY created_at DESC', [userId]);

      const reports = await Promise.all(
        rows.map(async (row) => ({
          ...row,
          location: {
            latitude: row.latitude,
            longitude: row.longitude,
            locationText: row.location_text,
          },
          images: await this.getReportImages(row.id),
          comments: await this.getReportComments(row.id),
          likes: await this.getReportLikes(row.id),
          adminUpdates: await this.getAdminUpdates(row.id),
        }))
      );

      return reports;
    } finally {
      conn.release();
    }
  },

  async addReportImage(reportId, imageUrl) {
    const id = uuidv4();
    const conn = await pool.getConnection();
    try {
      await conn.query('INSERT INTO report_images (id, report_id, image_url) VALUES (?, ?, ?)', [
        id,
        reportId,
        imageUrl,
      ]);
      return { id, imageUrl };
    } finally {
      conn.release();
    }
  },

  async getReportImages(reportId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT image_url FROM report_images WHERE report_id = ? ORDER BY created_at', [
        reportId,
      ]);
      return rows.map((r) => r.image_url);
    } finally {
      conn.release();
    }
  },

  async addComment(reportId, userId, userName, text) {
    const id = uuidv4();
    const conn = await pool.getConnection();
    try {
      await conn.query('INSERT INTO comments (id, report_id, user_id, user_name, text) VALUES (?, ?, ?, ?, ?)', [
        id,
        reportId,
        userId,
        userName,
        text,
      ]);
      return { id, text, userId, userName };
    } finally {
      conn.release();
    }
  },

  async getReportComments(reportId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT * FROM comments WHERE report_id = ? ORDER BY created_at', [reportId]);
      return rows.map((r) => ({
        id: r.id,
        text: r.text,
        userId: r.user_id,
        userName: r.user_name,
        createdAt: r.created_at,
      }));
    } finally {
      conn.release();
    }
  },

  async toggleLike(reportId, userId) {
    const conn = await pool.getConnection();
    try {
      const [existing] = await conn.query('SELECT id FROM likes WHERE report_id = ? AND user_id = ?', [reportId, userId]);

      if (existing.length > 0) {
        await conn.query('DELETE FROM likes WHERE report_id = ? AND user_id = ?', [reportId, userId]);
        return { liked: false };
      } else {
        const id = uuidv4();
        await conn.query('INSERT INTO likes (id, report_id, user_id) VALUES (?, ?, ?)', [id, reportId, userId]);
        return { liked: true };
      }
    } finally {
      conn.release();
    }
  },

  async getReportLikes(reportId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT user_id FROM likes WHERE report_id = ?', [reportId]);
      return rows.map((r) => r.user_id);
    } finally {
      conn.release();
    }
  },

  async addAdminUpdate(reportId, adminId, adminName, status, message) {
    const id = uuidv4();
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'INSERT INTO admin_updates (id, report_id, admin_id, admin_name, status, message) VALUES (?, ?, ?, ?, ?, ?)',
        [id, reportId, adminId, adminName, status, message]
      );

      await conn.query('UPDATE reports SET status = ? WHERE id = ?', [status, reportId]);

      return { id, status, message, adminId, adminName };
    } finally {
      conn.release();
    }
  },

  async getAdminUpdates(reportId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT * FROM admin_updates WHERE report_id = ? ORDER BY created_at', [reportId]);
      return rows.map((r) => ({
        id: r.id,
        status: r.status,
        message: r.message,
        adminId: r.admin_id,
        adminName: r.admin_name,
        createdAt: r.created_at,
      }));
    } finally {
      conn.release();
    }
  },

  async getContacts() {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT * FROM emergency_contacts ORDER BY name');
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        description: r.description,
      }));
    } finally {
      conn.release();
    }
  },

  async seedContacts() {
    const conn = await pool.getConnection();
    try {
      const [existing] = await conn.query('SELECT COUNT(*) as count FROM emergency_contacts');
      if (existing[0].count > 0) return;

      const contacts = [
        ['c1', 'Kenya Police Emergency', '999', 'National police emergency line'],
        ['c2', 'Kenya National Ambulance', '1199', 'Ambulance and medical support'],
        ['c3', 'Kenya Red Cross', '1199', 'Disaster response and first aid'],
        ['c4', 'Kenya Fire and Rescue', '112', 'Fire incidents and rescue services'],
        ['c5', 'Gender-Based Violence Hotline', '1195', 'Support for GBV cases'],
      ];

      for (const [id, name, phone, desc] of contacts) {
        await conn.query('INSERT INTO emergency_contacts (id, name, phone, description) VALUES (?, ?, ?, ?)', [
          id,
          name,
          phone,
          desc,
        ]);
      }
      console.log('Emergency contacts seeded');
    } finally {
      conn.release();
    }
  },

  async seedAdmin(adminEmail, adminPassword) {
    const conn = await pool.getConnection();
    try {
      const [exists] = await conn.query('SELECT id FROM users WHERE role = ?', ['admin']);
      if (exists.length > 0) return;

      const id = uuidv4();
      await conn.query('INSERT INTO users (id, name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)', [
        id,
        'System Admin',
        adminEmail,
        '+254700000000',
        'admin',
        adminPassword,
      ]);
      console.log('Admin user seeded');
    } finally {
      conn.release();
    }
  },

  async updateUserRole(userId, newRole) {
    const conn = await pool.getConnection();
    try {
      await conn.query('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);
      const user = await this.getUserById(userId);
      return user;
    } finally {
      conn.release();
    }
  },

  async revokeUser(userId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        "UPDATE reports SET reported_by = NULL, reporter_name = 'Anonymous' WHERE reported_by = ?",
        [userId]
      );
      await conn.query('DELETE FROM comments WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM likes WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM admin_updates WHERE admin_id = ?', [userId]);
      await conn.query('DELETE FROM users WHERE id = ?', [userId]);

      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getUserAuthById(id) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id, name, email, role, password_hash FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    } finally {
      conn.release();
    }
  },

  async deleteReport(reportId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM report_images WHERE report_id = ?', [reportId]);
      await conn.query('DELETE FROM comments WHERE report_id = ?', [reportId]);
      await conn.query('DELETE FROM likes WHERE report_id = ?', [reportId]);
      await conn.query('DELETE FROM admin_updates WHERE report_id = ?', [reportId]);
      await conn.query('DELETE FROM reports WHERE id = ?', [reportId]);
      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async resetAllDataExceptAdmin(adminId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM report_images');
      await conn.query('DELETE FROM comments');
      await conn.query('DELETE FROM likes');
      await conn.query('DELETE FROM admin_updates');
      await conn.query('DELETE FROM reports');
      await conn.query('DELETE FROM users WHERE id <> ?', [adminId]);
      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async addSiteLog({ actorId = null, actorName = 'System', actorRole = 'system', action, entityType = null, entityId = null, details = null, ipAddress = null }) {
    const id = uuidv4();
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'INSERT INTO site_logs (id, actor_id, actor_name, actor_role, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, actorId, actorName, actorRole, action, entityType, entityId, details, ipAddress]
      );
      return { id };
    } finally {
      conn.release();
    }
  },

  async getSiteLogs(limit = 200) {
    const conn = await pool.getConnection();
    try {
      const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 10), 1000) : 200;
      const [rows] = await conn.query(
        'SELECT id, actor_id, actor_name, actor_role, action, entity_type, entity_id, details, ip_address, created_at FROM site_logs ORDER BY created_at DESC LIMIT ?',
        [safeLimit]
      );
      return rows;
    } finally {
      conn.release();
    }
  },
};

module.exports = store;
