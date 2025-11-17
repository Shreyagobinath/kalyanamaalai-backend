const UserService = require("./service");
const pool = require("../../config/db"); // ✅ using connection pool
const sendEmail = require("../../utils/email");
const multer = require("multer");

const storage = multer.diskStorage({
  destination:(req,file,cb)=>
    cb(null,"uploads/profile_photos"),filename:(req,file,cb)=>{
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null,uniqueName);
    },
});

const upload = multer({ storage });


/**
 * @desc  Submit new user form with optional profile photo
 * @route POST /api/v1/user/forms
 * @access Private
 */

const UserController = {
  // ==========================
  // Submit a new form (user)
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

      // Mandatory fields validation
      const { full_name_en, gender, dob } = formData;
      if (!full_name_en || !gender || !dob) {
        return res
          .status(400)
          .json({ message: "Please fill all mandatory fields" });
      }

      const formToSave = {
        ...formData,
        profile_photo: profilePhoto,
        status: "Pending"
      };

      // Add status = Pending
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
      if(email){
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

  async getAccountDetails(req, res) {
    try {
      const userId = req.user.id;
      const user = await UserService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({
        name : user.full_name_en,
        email: user.email,
        profile_photo: user.profile_photo,
      });
    } catch (err) {
      console.error("Error fetching account details:", err);
       res.status(500).json({ message: "Internal server error" });
    }
  },
  async updateAccountDetails(req, res) {
    try{
      const userId = req.user.id;
      const updateData = req.body;

      const updated = await UserService.updateUser(userId,updateData);
      if(!updated){
        return res.status(404).json({message:"No changes were made"});
      }

      res.json({message:"Account details updated successfully"});
    } catch (err) {
      console.error("Error updating account details:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  async getApprovedConnections(req, res){
    try{
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
    }catch (error){
      console.error("Error fetching approved connections:",error);
      return res.status(500).json({message: "Internal server error"});
    }

  },
  
  
};

module.exports = UserController;
