const AdminService = require("./service");
const pool = require("../../config/db"); // ✅ Using connection pool

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
      if (!updated) {
        return res.status(404).json({ message: "Form not found" });
      }

      // ✅ Notify user
      const [form] = await pool.query(
        "SELECT user_id FROM forms WHERE id = ?",
        [formId]
      );
      if (form.length > 0) {
        const userId = form[0].user_id;
        await AdminController.addNotification(
          userId,
          "🎉 Your account has been approved by admin!"
        );
      }

      return res.status(200).json({ message: "Form approved successfully" });
    } catch (err) {
      console.error("❌ Approve form error:", err);
      return res.status(500).json({ message: "Error approving user" });
    }
  },

  async addNotification(userId, message) {
    try {
      await pool.query(
        "INSERT INTO notifications (user_id, message, created_at) VALUES (?, ?, NOW())",
        [userId, message]
      );
    } catch (err) {
      console.error("Error inserting notification:", err);
    }
  },

  // ==============================
  // Reject a form by ID
  // ==============================
  async rejectForm(req, res) {
    try {
      const formId = req.params.id;
      const updated = await AdminService.updateFormStatus(formId, "Rejected");

      if (!updated) {
        return res.status(404).json({ message: "Form not found" });
      }

      // ✅ Notify user
      const [form] = await pool.query(
        "SELECT user_id FROM forms WHERE id = ?",
        [formId]
      );
      if (form.length > 0) {
        await AdminController.addNotification(
          form[0].user_id,
          "❗ Your account has been rejected by admin."
        );
      }

      return res.status(200).json({ message: "Form rejected successfully" });
    } catch (err) {
      console.error("❌ Reject form error:", err);
      return res.status(500).json({ message: "Error rejecting user" });
    }
  },

  // ==============================
  // Get all users
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
  // Delete a user by ID
  // ==============================
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      const deleted = await AdminService.deleteUser(userId);

      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
      console.error("❌ Delete user error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // ==============================
  // Add Notification Helper
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
      if (!updated) {
        return res.status(404).json({ message: "Connection not found" });
      }
      return res.status(200).json({ message: "Connection status updated successfully" });
    } catch (err) {
      console.error("❌ Update connection status error:", err);
      return res.status(500).json({ message: "Error updating connection status" });
    }
  },
  async createConnectionRequest(req, res) {
    try {
      const { senderId, receiverId } = req.body;
      const result = await AdminService.createConnectionRequest(senderId, receiverId);
      return res.status(201).json({ message: "Connection request created", requestId: result.insertId });
    } catch (err) {
      console.error("❌ Create connection request error:", err);
      return res.status(500).json({ message: "Error creating connection request" });
    }
  },
};

module.exports = AdminController;
