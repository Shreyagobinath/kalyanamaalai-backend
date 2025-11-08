const db = require("../config/db");
const fs = require("fs").promises;
const path = require("path");

// ✅ helper function to delete old profile photo
async function deleteOldProfilePhoto(oldPhotoUrl) {
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
}

const UserService = {
  // ✅ Fetch user profile
  async getProfile(userId) {
    const [rows] = await db
      .promise()
      .query("SELECT id, name, email, role, photoUrl FROM users WHERE id = ?", [userId]);
    return rows[0];
  },

  // ✅ Update profile
  async updateProfile(userId, updateData) {
    const currentUser = await UserService.getProfile(userId);
    if (!currentUser) return null;

    const newPhotoUrl = updateData.photoUrl;
    if (newPhotoUrl && currentUser.photoUrl) {
      await deleteOldProfilePhoto(currentUser.photoUrl);
    }

    const fields = [];
    const values = [];

    if (updateData.name !== undefined) {
      fields.push("name = ?");
      values.push(updateData.name);
    }

    if (updateData.photoUrl !== undefined) {
      fields.push("photoUrl = ?");
      values.push(updateData.photoUrl);
    }

    if (fields.length === 0) {
      return currentUser;
    }

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    values.push(userId);
    await db.promise().query(query, values);

    const updatedUser = await UserService.getProfile(userId);
    return updatedUser;
  },

  // ✅ Submit user form
  async submitForm(userId, formData) {
    const query = `
      INSERT INTO forms (
        user_id,
        name,
        full_name_en, full_name_ta,
        gender, dob,
        religion_en, religion_ta,
        caste_en, caste_ta,
        gothram_en, gothram_ta,
        star_en, star_ta,
        raasi_en, raasi_ta,
        height, weight,
        complexion_en, complexion_ta,
        education_en, education_ta,
        occupation_en, occupation_ta,
        income_en, income_ta,
        address_en, address_ta,
        phone, email,
        father_name_en, father_name_ta,
        mother_name_en, mother_name_ta,
        siblings, marital_status,
        preferred_age_range, preferred_religion, preferred_occupation, preferred_location,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userId,
      formData.full_name_en, formData.full_name_ta,
      formData.gender, formData.dob,
      formData.religion_en, formData.religion_ta,
      formData.caste_en, formData.caste_ta,
      formData.gothram_en, formData.gothram_ta,
      formData.star_en, formData.star_ta,
      formData.raasi_en, formData.raasi_ta,
      formData.height, formData.weight,
      formData.complexion_en, formData.complexion_ta,
      formData.education_en, formData.education_ta,
      formData.occupation_en, formData.occupation_ta,
      formData.income_en, formData.income_ta,
      formData.address_en, formData.address_ta,
      formData.phone, formData.email,
      formData.father_name_en, formData.father_name_ta,
      formData.mother_name_en, formData.mother_name_ta,
      formData.siblings, formData.marital_status,
      formData.preferred_age_range, formData.preferred_religion,
      formData.preferred_occupation, formData.preferred_location,
      "pending"
    ];

    const [result] = await db.promise().query(query, values);
    return { message: "Form submitted successfully", formId: result.insertId };
  }
};

module.exports = UserService;
