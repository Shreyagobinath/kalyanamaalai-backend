// backend/models/admin/controller.js

const pool = require("../../config/db");
const sendEmail = require("../../utils/email");

const AdminController = {

  // ==============================
  // GET ALL PENDING FORMS
  // ==============================
  async getPendingForms(req, res) {
    try {
      const [forms] = await pool.query(`
        SELECT 
          uf.id AS form_id,
          uf.user_id,
          uf.full_name_en,
          uf.gender,
          uf.dob,
          uf.email,
          uf.phone,
          uf.address_en,
          uf.profile_photo,
          uf.status AS form_status,
          uf.created_at,
          u.isApproved
        FROM user_forms uf
        JOIN users u ON uf.user_id = u.id
        WHERE uf.status = 'Pending'
        ORDER BY uf.created_at DESC
      `);

      return res.status(200).json(forms);
    } catch (err) {
      console.error("Get pending forms error:", err);
      return res.status(500).json({ message: "Error fetching pending forms" });
    }
  },

  // ==============================
  // GET SINGLE FORM BY ID
  // ==============================
  async getFormById(req, res) {
    try {
      const { id } = req.params;

      const [rows] = await pool.query(`
        SELECT 
          uf.*,
          u.full_name_en AS user_name,
          u.email AS user_email,
          u.gender AS user_gender
        FROM user_forms uf
        JOIN users u ON uf.user_id = u.id
        WHERE uf.id = ?
      `, [id]);

      if (!rows.length)
        return res.status(404).json({ message: "Form not found" });

      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error("Get form by ID error:", err);
      return res.status(500).json({ message: "Error fetching form details" });
    }
  },

  // ==============================
  // APPROVE FORM
  // ==============================
  async approveForm(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const formId = req.params.id;

      // Get user ID from form
      const [[form]] = await conn.query(
        "SELECT user_id FROM user_forms WHERE id=? LIMIT 1",
        [formId]
      );

      if (!form) {
        await conn.rollback();
        return res.status(404).json({ message: "Form not found" });
      }

      const userId = form.user_id;

      // Approve the form
      await conn.query(
        "UPDATE user_forms SET status='Approved' WHERE id=?",
        [formId]
      );

      // Update user table also
      await conn.query(
        "UPDATE users SET isApproved=1 WHERE id=?",
        [userId]
      );

      await conn.commit();
      return res.status(200).json({ message: "Form approved successfully" });

    } catch (err) {
      await conn.rollback();
      console.error("approveForm error:", err);
      return res.status(500).json({ message: "Server error approving form" });
    } finally {
      conn.release();
    }
  },

  // ==============================
  // REJECT FORM
  // ==============================
  async rejectForm(req, res) {
    try {
      const formId = req.params.id;

      const [[form]] = await pool.query(
        "SELECT user_id FROM user_forms WHERE id=?",
        [formId]
      );

      if (!form)
        return res.status(404).json({ message: "Form not found" });

      const userId = form.user_id;

      await pool.query(
        "UPDATE user_forms SET status='Rejected' WHERE id=?",
        [formId]
      );

      const [[user]] = await pool.query(
        "SELECT full_name_en AS name, email FROM users WHERE id=?",
        [userId]
      );

      await sendEmail({
        to: user.email,
        subject: "Your Form Has Been Rejected",
        text: `Hi ${user.name}, your form has been rejected.`,
        html: `<p>Hi <b>${user.name}</b>, your form has been <span style="color:red">Rejected</span>.</p>`
      });

      await AdminController.addNotification(userId, "Rejected");

      return res.status(200).json({ message: "Form rejected & notification sent" });

    } catch (err) {
      console.error("Reject form error:", err);
      return res.status(500).json({ message: "Error rejecting form" });
    }
  },

  // ==============================
  // NOTIFICATIONS
  // ==============================
  async addNotification(userId, status) {
    try {
      await pool.query(
        "INSERT INTO notifications (user_id, status, created_at) VALUES (?, ?, NOW())",
        [userId, status]
      );
    } catch (err) {
      console.error("Add notification error:", err);
    }
  },

  async getNotifications(req, res) {
    try {
      const [notes] = await pool.query(`
        SELECT 
          u.full_name_en AS user_name,
          u.email AS user_email,
          f.created_at AS form_submitted_at,
          f.status AS form_status
        FROM user_forms f
        JOIN users u ON f.user_id = u.id
        ORDER BY f.created_at DESC
      `);

      return res.status(200).json(notes);
    } catch (err) {
      console.error("Get notifications error:", err);
      return res.status(500).json({ message: "Error fetching notifications" });
    }
  },

  // ==============================
  // USERS
  // ==============================
  async getAllUsers(req, res) {
    try {
      const [rows] = await pool.query(`SELECT * FROM users`);
      return res.status(200).json(rows);
    } catch (err) {
      console.error("Get all users error:", err);
      return res.status(500).json({ message: "Error fetching users" });
    }
  },

  // ==============================
  // FIXED: GET USER BY ID WITH FULL FORM DETAILS
  // ==============================
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const connection = await pool.getConnection();

    const query = `
  SELECT 
    u.id, u.name, u.email, u.gender, u.phone, u.address_en, u.dob,
    u.father_name_en, u.mother_name_en, u.siblings, u.location, u.marital_status,
    f.full_name_en, f.religion_en, f.caste_en, f.gothram_en,
    f.star_en, f.raasi_en, f.height, f.weight, f.complexion_en,
    f.education_en, f.occupation_en, f.income_en,
    f.preferred_age_range, f.preferred_religion, f.preferred_occupation, f.preferred_location
  FROM users u
  LEFT JOIN user_forms f ON u.id = f.user_id
  WHERE u.id = ?
  LIMIT 1`;

const [rows] = await connection.query(query, [id]);
connection.release();



      if (rows.length === 0) return res.status(404).json({ message: "User not found" });

      res.status(200).json(rows[0]);

    } catch (err) {
      console.error("Get user details error:", err);
      return res.status(500).json({ message: "Error fetching user details" });
    }
  },

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      await pool.query("DELETE FROM users WHERE id=?", [userId]);
      await pool.query("DELETE FROM user_forms WHERE user_id=?", [userId]);

      return res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
      console.error("Delete user error:", err);
      return res.status(500).json({ message: "Error deleting user" });
    }
  },

  // ==============================
  // CONNECTION REQUESTS
  // ==============================
  async getPendingConnections(req, res) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          c.id,
          c.status,
          c.sender_id,
          c.receiver_id,
          s.name AS sender_name,
          s.email AS sender_email,
          r.name AS receiver_name,
          r.email AS receiver_email,
          c.created_at
        FROM connections c
        JOIN users s ON c.sender_id = s.id
        JOIN users r ON c.receiver_id = r.id
        WHERE c.status = 'Pending'
      `);

      return res.status(200).json(rows);

    } catch (err) {
      console.error("Get pending connections error:", err);
      return res.status(500).json({ message: "Error fetching pending connections" });
    }
  },

  async approveConnection(req, res) {
    try {
      const connId = req.params.id;

      await pool.query(
        "UPDATE connections SET status='approved' WHERE id=?",
        [connId]
      );

      return res.status(200).json({ message: "Connection approved" });

    } catch (err) {
      console.error("Approve connection error:", err);
      return res.status(500).json({ message: "Error approving connection" });
    }
  },

  async rejectConnection(req, res) {
    try {
      const connId = req.params.id;

      await pool.query(
        "UPDATE connections SET status='rejected' WHERE id=?",
        [connId]
      );

      return res.status(200).json({ message: "Connection rejected" });
    } catch (err) {
      console.error("Reject connection error:", err);
      return res.status(500).json({ message: "Error rejecting connection" });
    }
  }

};

module.exports = AdminController;
