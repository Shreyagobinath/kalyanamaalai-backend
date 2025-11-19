const UserService = require("./service");
const pool = require("../../config/db"); 
const sendEmail = require("../../utils/email");
const multer = require("multer");

// ==========================
// Multer Setup
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/profile_photos"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });


// ==========================
// User Controller Object
// ==========================
const UserController = {

  // ==========================
  // Submit a new form
  // ==========================
  async submitForm(req, res) {
    try {
      upload.single("profile_photo")(req, res, async (err) => {
        if (err) {
          console.error("File upload error:", err);
          return res.status(400).json({ message: "Error uploading file" });
        }

        const userId = req.user.id;
        const formData = req.body;
        const profilePhoto = req.file ? req.file.filename : null;

        // Validate required fields
        const { full_name_en, gender, dob } = formData;
        if (!full_name_en || !gender || !dob) {
          return res.status(400).json({ message: "Please fill all mandatory fields" });
        }

        const formToSave = {
          ...formData,
          profile_photo: profilePhoto,
          status: "Pending",
        };

        const result = await UserService.submitForm(userId, formToSave);

        return res.status(201).json({
          message: "Form submitted successfully. Waiting for admin approval.",
          data: result,
        });
      });
    } catch (err) {
      console.error("Submit form error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },


  // ==========================
  // Get all forms for user
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
  // Get form by ID
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
      console.error("Get form error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },


  // ==========================
  // Get approved users
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

      const result = await UserService.sendConnectionRequest(senderId, receiverId);
      return res.json(result);
    } catch (error) {
      console.error("Error sending connection request:", error);
      return res.status(500).json({ message: "Error sending request" });
    }
  },


  // ==========================
  // Notifications
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


  async addNotification(userId, message, email) {
    try {
      await UserService.addNotification(userId, message);

      if (email) {
        await sendEmail({
          to: email,
          subject: "New Notification",
          text: message,
        });
      }

      return true;
    } catch (error) {
      console.error("Error adding notification:", error);
      return false;
    }
  },


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


  // ==========================
  // Account - Get Details
  // ==========================
  async getAccountDetails(req, res) {
    try {
      const userId = req.user.id;
      const user = await UserService.getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        name: user.full_name_en,
        email: user.email,
        profile_photo: user.profile_photo,
      });
    } catch (err) {
      console.error("Error fetching account details:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },


  // ==========================
  // Account - Update Details
  // ==========================
  async updateAccountDetails(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      const updated = await UserService.updateUser(userId, updateData);

      if (!updated) {
        return res.status(404).json({ message: "No changes were made" });
      }

      res.json({ message: "Account details updated successfully" });
    } catch (err) {
      console.error("Error updating account details:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },


  // ==========================
  // Get approved connections
  // ==========================
  async getApprovedConnections(req, res) {
    try {
      const userId = req.user.id;

      const [rows] = await pool.query(
        `
        SELECT 
          c.id,
          c.sender_id,
          c.receiver_id,
          c.status,
          c.created_at,
          u.full_name_en AS connected_user_name,
          u.email AS connected_user_email,
          u.profile_photo AS connected_user_photo
        FROM connections c
        JOIN users u 
          ON u.id = (CASE 
                      WHEN c.sender_id = ? THEN c.receiver_id
                      ELSE c.sender_id
                    END)
        WHERE 
          (c.sender_id = ? OR c.receiver_id = ?)
          AND c.status = 'approved'
        `,
        [userId, userId, userId]
      );

      return res.status(200).json(rows);
    } catch (error) {
      console.error("Error fetching approved connections:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },


  // ==========================
  // Check if user already submitted form
  // ==========================
  async checkFormStatus(req, res) {
    try {
      const userId = req.user.id;

      const [rows] = await pool.query(
        "SELECT id FROM forms WHERE user_id = ? LIMIT 1",
        [userId]
      );

      return res.status(200).json({ hasForm: rows.length > 0 });
    } catch (err) {
      console.error("Error checking form status:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

};

module.exports = UserController;

