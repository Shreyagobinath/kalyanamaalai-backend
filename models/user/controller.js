const UserService = require("./service");
const pool = require("../../config/db"); // ✅ using connection pool

const UserController = {
  // ==========================
  // Submit a new form (user)
  // ==========================
  async submitForm(req, res) {
    try {
      const userId = req.user.id;
      const formData = req.body;

      // Mandatory fields validation
      const { full_name_en, gender, dob } = formData;
      if (!full_name_en || !gender || !dob) {
        return res
          .status(400)
          .json({ message: "Please fill all mandatory fields" });
      }

      // Add status = Pending
      const result = await UserService.submitForm(userId, {
        ...formData,
        status: "Pending",
      });

      return res.status(201).json({
        message: "Form submitted successfully. Waiting for admin approval.",
        data: result,
      });
    } catch (err) {
      console.error("Submit form error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // ==========================
  // Get all forms for logged-in user
  // ==========================
  async getForms(req, res) {
    try {
      const userId = req.user.id;
      const forms = await UserService.getForms(userId);
      return res.status(200).json(forms);
    } catch (err) {
      console.error("Get forms error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // ==========================
  // Get single form by ID
  // ==========================
  async getFormById(req, res) {
    try {
      const formId = req.params.id;
      const form = await UserService.getFormById(formId);

      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      return res.status(200).json(form);
    } catch (err) {
      console.error("Get form by ID error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // ==========================
  // Get approved users (for matching)
  // ==========================
  async getApprovedUsers(req, res) {
    try {
      const userId = req.user.id;
      const users = await UserService.getApprovedUsers(userId);
      return res.json(users);
    } catch (error) {
      console.error("Error fetching approved users:", error);
      return res.status(500).json({ message: "Error fetching approved users" });
    }
  },

  // ==========================
  // Send connection request
  // ==========================
  async sendConnectionRequest(req, res) {
    try {
      const senderId = req.user.id;
      const { receiverId } = req.body;

      const result = await UserService.sendConnectionRequest(
        senderId,
        receiverId
      );

      // Add notification for receiver
      await UserController.addNotification(
        receiverId,
        "💌 You have a new connection request!"
      );

      return res.json(result);
    } catch (error) {
      console.error("Error sending connection request:", error);
      return res.status(500).json({ message: "Error sending request" });
    }
  },

  // ==========================
  // Get notifications
  // ==========================
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const notifications = await UserService.getNotifications(userId);
      res.status(200).json(notifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
  // ==========================
  // Add notification helper
  // ==========================
  async addNotification(userId, message) {
    try {
      await UserService.addNotification(userId, message);
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  },
  // ==========================
  // Mark notifications as read
  // ==========================
 // controller/user.js

async markReadNotifications(req, res) {
    try {
      const userId = req.user.id;
      const result = await UserService.markReadNotifications(userId);
      res.status(200).json(result);
    } catch (err) {
      console.error("Error marking notifications as read:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = UserController;
