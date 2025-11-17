const pool = require("../../config/db");
const sendEmail = require("../../utils/email");

const UserService = {
  // Submit a new form
  async submitForm(userId, formData) {
    try {
      const fields = Object.keys(formData).join(", ");
      const placeholders = Object.keys(formData).map(() => "?").join(", ");
      const values = Object.values(formData);

      const query = `INSERT INTO forms (user_id, ${fields}) VALUES (?, ${placeholders})`;
      const [result] = await pool.query(query, [userId, ...values]);

      return { id: result.insertId, user_id: userId, ...formData };
    } catch (err) {
      console.error("Error submitting form:", err);
      throw new Error("Failed to submit form");
    }
  },

  async getForms(userId) {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM forms WHERE user_id = ? ORDER BY id DESC",
        [userId]
      );
      return rows;
    } catch (err) {
      console.error("Error fetching user forms:", err);
      throw new Error("Failed to fetch forms");
    }
  },

  async getFormById(id) {
    try {
      const [rows] = await pool.query("SELECT * FROM forms WHERE id = ?", [id]);
      return rows[0];
    } catch (err) {
      console.error("Error fetching form by ID:", err);
      throw new Error("Failed to fetch form");
    }
  },

  async getApprovedUsers(userId) {
    const [rows] = await pool.query(
      `SELECT users.id, users.name,
              TIMESTAMPDIFF(YEAR, forms.dob, CURDATE()) AS age,
              forms.city
       FROM users
       JOIN forms ON users.id = forms.user_id
       WHERE forms.status = 'approved'`,
      [userId]
    );
    return rows;
  },

  async sendConnectionRequest(senderId, receiverId) {
    await pool.query(
      "INSERT INTO connections (sender_id, receiver_id, status) VALUES (?, ?, 'pending')",
      [senderId, receiverId]
    );
    return {message:"Connection request sent.waiting for admin approval."};
  },

  async addNotification(userId, message, email = null) {
    try {
      const [result] = await pool.execute(
        "INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)",
        [userId, message, false]
      );

      if (email) {
        await sendEmail({
          to: email,
          subject: "New Notification",
          text: message,
        });
      }

      return result;
    } catch (err) {
      console.error("Error adding notification:", err);
      throw new Error("Failed to add notification");
    }
  },

  async getNotifications(userId) {
    const [rows] = await pool.query(
      "SELECT id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  },

  async markReadNotifications(userId) {
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
      [userId]
    );
    return { message: "All notifications marked as read." };
  },

  async getUserById(userId) {
    const [rows] = await pool.query(
      "SELECT id, name, email, gender, city, profile_photo FROM users WHERE id = ?",
      [userId]
    );
    return rows[0];
  },

  async updateUser(id, data) {
    const fields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(data);
    const query = `UPDATE users SET ${fields} WHERE id = ?`;

    const [result] = await pool.query(query, [...values, id]);
    return result.affectedRows > 0;
  },

  async getApprovedConnections(userId){
    const [rows] = await pool.query(
       `SELECT 
        u.id,
        u.name,
        TIMESTAMPDIFF(YEAR, f.dob, CURDATE()) AS age,
        f.city
     FROM connections c
     JOIN users u ON 
        u.id = CASE 
                 WHEN c.sender_id = ? THEN c.receiver_id 
                 ELSE c.sender_id 
               END
     JOIN forms f ON f.user_id = u.id
     WHERE 
        (c.sender_id = ? OR c.receiver_id = ?)
        AND c.status = 'approved'`,
        [userId, userId, userId]
    );
    return rows;
  },
  
};

module.exports = UserService;
