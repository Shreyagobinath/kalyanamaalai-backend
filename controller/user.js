const UserService = require("../services/user");
const fs = require("fs").promises;
const path = require("path");

const UserController = {
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await UserService.getProfile(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ message: "Error fetching user profile" });
    }
  },

  // Update profile (with optional photo)
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name = "" } = req.body;
      let photoUrl = null;

      if (req.file) {
        photoUrl = `/uploads/${req.file.filename}`;
      }

      const updateData = { name };
      if (photoUrl) updateData.photoUrl = photoUrl;

      const updateUser = await UserService.updateProfile(userId, updateData);

      if (!updateUser) {
        return res.status(404).json({ message: "User not found or nothing to update" });
      }

      res.status(200).json(updateUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Error updating user profile" });
    }
  },

  // Optional helper to delete old photo
  async deleteOldProfilePhoto(oldPhotoUrl) {
    if (oldPhotoUrl && oldPhotoUrl.startsWith("/uploads/")) {
      const filename = oldPhotoUrl.replace("/uploads/", "");
      const fullPath = path.join(__dirname, "..", "uploads", filename);
      try {
        await fs.access(fullPath);
        await fs.unlink(fullPath);
        console.log(`Deleted old photo: ${fullPath}`);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error(`Error deleting file ${fullPath}:`, error);
        }
      }
    }
  },

  // Submit user form
  async submitForm(req, res) {
  try {
    // Ensure userId is available
    const userId = req.user?.id || req.user;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Ensure formData exists
    const formData = req.body || {};

    console.log("User ID:", userId);
    console.log("Form Data:", formData);

    // Mandatory fields
    const mandatoryFields = ["full_name_en", "gender", "dob"];

    // Check if any mandatory field is missing or empty
    const missingFields = mandatoryFields.filter(
      (field) => !formData[field] || formData[field].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Please fill all mandatory fields: ${missingFields.join(", ")}`
      });
    }

    // Submit form
    const result = await UserService.submitForm(userId, formData);
    return res.status(201).json(result);

  } catch (error) {
    console.error("Form submission error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
},
  // Get form data
  async getForm(req, res) {
    try {
      const result = await UserService.getForms(req.user.id);
      res.status(200).json(result);
    } catch (err) {
      console.error("Get form error:", err);
      res.status(400).json({ message: err.message });
    }
  },
};

module.exports = UserController;
