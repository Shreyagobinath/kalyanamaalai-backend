const pool = require("../../config/db");
const sendEmail = require("../../utils/email"); // optional, for email notifications

const AdminService = {
  // ==============================
  // Get all pending forms
  // ==============================
  async getPendingForms() {
    const [rows] = await pool.query(
      "SELECT * FROM forms WHERE status = 'Pending' ORDER BY created_at DESC"
    );
    return rows;
  },

  // ==============================
  // Update form status
  // ==============================
  async updateFormStatus(id, status) {
    const [result] = await pool.execute(
      "UPDATE forms SET status = ? WHERE id = ?",
      [status, id]
    );
    return result.affectedRows > 0;
  },

  // ==============================
  // Get all users
  // ==============================
  async getAllUsers() {
    const [rows] = await pool.query(
      "SELECT id, name, email, gender FROM users"
    );
    return rows;
  },

  // ==============================
  // Delete user
  // ==============================
  async deleteUser(id) {
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  // ==============================
  // Pending connections
  // ==============================
  async getPendingConnections() {
    const [rows] = await pool.query(`
      SELECT 
        c.id, 
        c.status,
        c.receiver_id,
        c.sender_id,
        u1.name AS sender_name,
        u1.email AS sender_email,
        u1.gender AS sender_gender,
        u2.name AS receiver_name,
        u2.email AS receiver_email,
        u2.gender AS receiver_gender
      FROM connections c
      JOIN users u1 ON c.sender_id = u1.id
      JOIN users u2 ON c.receiver_id = u2.id
      WHERE c.status = 'Pending'
    `);
    return rows;
  },

  async updateConnectionStatus(connectionId, status) {
    const [result] = await pool.query(
      "UPDATE connections SET status = ? WHERE id = ?",
      [status, connectionId]
    );
    return result.affectedRows > 0;
  },

 async approveConnection(connectionId) {
    // 1️⃣ Get the connection details
    const [rows] = await pool.query(
      "SELECT sender_id, receiver_id, status FROM connections WHERE id = ?",
      [connectionId]
    );

    if (!rows.length) return null; // Connection not found

    const connection = rows[0];

    if (connection.status === "approved") {
      return connection; // Already approved
    }

    // 2️⃣ Update the status to 'approved'
    await pool.query(
      "UPDATE connections SET status = 'approved', approved_at = NOW() WHERE id = ?",
      [connectionId]
    );

    // 3️⃣ Notify both users
    const message = "💌 Your connection request has been approved by the admin!";

    await AdminService.addNotification(connection.sender_id, message);
    await AdminService.addNotification(connection.receiver_id, message);

    return connection; // Return connection details for controller
  },


  async rejectConnection(id) {
    const [result] = await pool.execute(
      "UPDATE connections SET status = 'rejected' WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  async getUserById(id) {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  },

  // ==============================
  // Get notifications for admin
  // ==============================
  async getNotifications(adminId) {
    try {
      // 🔹 Fetch recent notifications from `notifications` table
      const [rows] = await pool.query(
        "SELECT id, user_id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
        [adminId]
      );

      // Optional: you can also fetch pending forms/connections separately
      // and merge into `rows` array if needed

      return rows;
    } catch (err) {
      console.error("❌ Get notifications error:", err);
      throw new Error("Error fetching notifications");
    }
  },

  // ==============================
  // Add notification
  // ==============================
  async addNotification(userId, message) {
    try {
      const query =
        "INSERT INTO notifications (user_id, message, is_read, created_at) VALUES (?, ?, FALSE, NOW())";
      await pool.query(query, [userId, message]);

      // Optional: Send email to user
      const [user] = await pool.query(
        "SELECT email FROM users WHERE id = ?",
        [userId]
      );
      if (user.length > 0 && user[0].email) {
        await sendEmail({
          to: user[0].email,
          subject: "New Notification",
          text: message,
        });
      }
    } catch (err) {
      console.error("❌ Error adding notification:", err);
    }
  },

  async getRecentUserActivities(){
    const[rows] = await pool.query(
      `SELECT 
      f.id AS form_id,
      f.full_name_en,
      f.status,
      f.created_at,
      u.email AS user_email
      FROM forms f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.id DESC
      LIMIT 20`
    );

     return rows.map((row) => {
      const dateValue = row.created_at || row.updated_at || new Date();
      const formattedDate = new Date(dateValue).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",

    });

    
      return {
        title: `Form submitted by ${row.full_name_en}`,
        message: `Status: ${row.status}`,
        email: row.user_email,
        date: formattedDate,
  };
});
  },
};

module.exports = AdminService;
