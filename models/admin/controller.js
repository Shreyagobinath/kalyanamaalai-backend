// backend/models/admin/controller.js

const AdminService = require("./service");
const pool = require("../../config/db");
const sendEmail = require("../../utils/email"); // Email helper

const AdminController = {
  // ==============================
  // Get all pending forms
  // ==============================
  async getPendingForms(req, res) {
    try {
      const forms = await AdminService.getPendingForms();
      return res.status(200).json(forms);
    } catch (err) {
      console.error("❌ Get pending forms error:", err);
      return res.status(500).json({ message: "Error fetching pending users" });
    }
  },

  // ==============================
  // Approve a form by ID
  // ==============================
  async approveForm(req, res) {
    try {
      const formId = req.params.id;
      const updated = await AdminService.updateFormStatus(formId, "Approved");
      if (!updated) return res.status(404).json({ message: "Form not found" });

      // Fetch user details
      const [formRows] = await pool.query("SELECT user_id FROM forms WHERE id = ?", [formId]);
      if (formRows.length === 0) return res.status(404).json({ message: "User not found for this form" });

      const userId = formRows[0].user_id;
      const [userRows] = await pool.query("SELECT name, email FROM users WHERE id = ?", [userId]);
      if (userRows.length === 0) return res.status(404).json({ message: "User details not found" });

      const user = userRows[0];

      // Send approval email
      await sendEmail({
        to: user.email,
        subject: "Your Profile Has Been Approved",
        text: `Hi ${user.name}, your profile has been approved by the admin.`,
        html: `<p>Hi <b>${user.name}</b>,</p>
               <p>Your profile has been <b style="color:green;">approved</b> by the admin.</p>
               <p>You can now log in and start using the platform.</p>
               <br>
               <p>Regards,<br>Kalyanamaalai Team</p>`
      });

      // Add notification
      await AdminController.addNotification(userId, "🎉 Your account has been approved by admin!");

      return res.status(200).json({ message: "Form approved successfully & email sent" });
    } catch (err) {
      console.error("❌ Approve form error:", err);
      return res.status(500).json({ message: "Error approving user" });
    }
  },

  // ==============================
  // Reject form
  // ==============================
  async rejectForm(req, res) {
    try {
      const formId = req.params.id;
      const updated = await AdminService.updateFormStatus(formId, "Rejected");
      if (!updated) return res.status(404).json({ message: "Form not found" });

      // Fetch user ID
      const [formRows] = await pool.query("SELECT user_id FROM forms WHERE id = ?", [formId]);
      if (formRows.length === 0) return res.status(404).json({ message: "User not found for this form" });

      const userId = formRows[0].user_id;
      const [userRows] = await pool.query("SELECT name, email FROM users WHERE id = ?", [userId]);
      if (userRows.length === 0) return res.status(404).json({ message: "User details not found" });

      const user = userRows[0];

      // Send rejection email
      await sendEmail({
        to: user.email,
        subject: "Your Profile Has Been Rejected",
        text: `Hi ${user.name}, your profile has been rejected by the admin.`,
        html: `<p>Hi <b>${user.name}</b>,</p>
               <p>Your profile has been <b style="color:red;">rejected</b> by the admin.</p>
               <p>Please review your information and try again if applicable.</p>
               <br>
               <p>Regards,<br>Kalyanamaalai Team</p>`
      });

      // Add notification
      await AdminController.addNotification(userId, "❗ Your account has been rejected by admin.");

      return res.status(200).json({ message: "Form rejected successfully & email sent" });
    } catch (err) {
      console.error("❌ Reject form error:", err);
      return res.status(500).json({ message: "Error rejecting user" });
    }
  },

  // ==============================
  // Add notification helper
  // ==============================
  async addNotification(userId, message) {
    try {
      await pool.query(
        "INSERT INTO notifications (user_id, message, created_at) VALUES (?, ?, NOW())",
        [userId, message]
      );

      const [userRows] = await pool.query("SELECT email FROM users WHERE id = ?", [userId]);
      if (userRows.length > 0) {
        const email = userRows[0].email;
        await sendEmail({
          to: email,
          subject: "New Notification",
          text: message
        });
      }
    } catch (err) {
      console.error("❌ Add notification error:", err);
    }
  },

  // ==============================
  // Get admin notifications
  // ==============================
  async getNotifications(req, res) {
    try {
      const notifications = await AdminService.getRecentUserActivities();
      return res.status(200).json(notifications);
    } catch (error) {
      console.error("❌ Get notifications error:", error);
      return res.status(500).json({ message: "Error fetching admin notifications" });
    }
  },

  // ==============================
  // User Management
  // ==============================
  async getAllUsers(req, res) {
    try {
      const users = await AdminService.getAllUsers();
      return res.status(200).json(users);
    } catch (err) {
      console.error("❌ Get all users error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // ==============================
  // Get user full details
  // ==============================
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const [userRows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
      if (!userRows.length) return res.status(404).json({ message: "User not found" });

      const user = userRows[0];

      const [formRows] = await pool.query("SELECT * FROM forms WHERE user_id = ?", [id]);
      const form = formRows[0] || {};

      const fullDetails = { ...user, ...form };

      return res.status(200).json(fullDetails);
    } catch (err) {
      console.error("❌ Get user by ID error:", err);
      return res.status(500).json({ message: "Error fetching user details" });
    }
  },

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      const deleted = await AdminService.deleteUser(userId);
      if (!deleted) return res.status(404).json({ message: "User not found" });
      return res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
      console.error("❌ Delete user error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // ==============================
  // Connection management
  // ==============================
  async getPendingConnections(req, res) {
    try {
      const connections = await AdminService.getPendingConnections();
      return res.status(200).json(connections);
    } catch (err) {
      console.error("❌ Get pending connections error:", err);
      return res.status(500).json({ message: "Error fetching pending connections" });
    }
  },

  async updateConnectionStatus(req, res) {
    try {
      const connectionId = req.params.id;
      const { status } = req.body;
      const updated = await AdminService.updateConnectionStatus(connectionId, status);
      if (!updated) return res.status(404).json({ message: "Connection not found" });
      return res.status(200).json({ message: "Connection status updated successfully" });
    } catch (err) {
      console.error("❌ Update connection status error:", err);
      return res.status(500).json({ message: "Error updating connection status" });
    }
  },

  async approveConnection(req, res) {
    try {
      const connectionId = req.params.id;
      const success = await AdminService.approveConnection(connectionId);
      if (!success) return res.status(404).json({ message: "Connection not found" });
      return res.status(200).json({ message: "Connection approved. Notifications sent." });
    } catch (err) {
      console.error("❌ Approve connection error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  async rejectConnection(req, res) {
    try {
      const connectionId = req.params.id;
      const rejected = await AdminService.rejectConnection(connectionId);
      if (!rejected) return res.status(404).json({ message: "Connection not found" });
      return res.status(200).json({ message: "Connection rejected successfully" });
    } catch (err) {
      console.error("❌ Reject connection error:", err);
      return res.status(500).json({ message: "Error rejecting connection" });
    }
  },

  // ==============================
  // ⭐ NEW FUNCTION ADDED HERE
  // ==============================
  async getUserFormDetails(req, res) {
    try {
      const { userId } = req.params;
      const userForm = await AdminService.getUserFormById(userId);

      if (!userForm) {
        return res.status(404).json({ message: "User form not found" });
      }

      return res.status(200).json(userForm);
    } catch (err) {
      console.error("❌ Get user form details error:", err);
      return res.status(500).json({ message: "Failed to fetch user form" });
    }
  }
};

module.exports = AdminController;
