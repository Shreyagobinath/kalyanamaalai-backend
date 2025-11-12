const pool = require("../../config/db");
const { getUserById } = require("./controller");

const AdminService = {
  async getPendingForms() {
    const [rows] = await pool.query("SELECT * FROM forms WHERE status = 'Pending'");
    return rows;
  },

  async updateFormStatus(id, status) {
    const[result]=await pool.execute("UPDATE forms SET status = ? WHERE id = ?", [status, id]);
    return result;
  },

  async getAllUsers() {
    const [rows] = await pool.query("SELECT id, name, email,gender FROM users");
    return rows;
  },

  async deleteUser(id) {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
  },

   async getPendingConnections() {
    const [rows] = await pool.query(
       `SELECT 
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
      WHERE c.status = 'Pending'`
    );
    return rows;
  },
   async updateConnectionStatus(connectionId, status) {
    const [result] = await pool.query(
      "UPDATE connections SET status = ? WHERE id = ?",
      [status, connectionId]
    );
    return result;
  },
   async approveConnection(id) {
    const [result] = await pool.execute(
      "UPDATE connections SET status = 'approved' WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },
    async rejectConnection(id) {
    const [result] = await pool.execute(
      "UPDATE connections SET status = 'rejected' WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },
  async getUserById(id){
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  },

  async getNotifications(req, res) {
  try {
    // 🔹 Fetch pending connection requests
    const [pendingConnections] = await pool.query(
      "SELECT id, user_id, status, created_at FROM notifications WHERE status='pending' ORDER BY created_at DESC LIMIT 5"
    );

    // 🔹 Fetch recent form updates (approved or rejected)
    const [recentForms] = await pool.query(
      "SELECT id, user_id, status, created_at FROM forms WHERE status IN ('approved', 'rejected') ORDER BY created_at DESC LIMIT 5"
    );

    const notifications = [];

    // 🔹 Add connection notifications
    pendingConnections.forEach((conn) => {
      notifications.push({
        type: "connection_request",
        message: `New connection request from User ID ${conn.user_id}`,
        created_at: conn.created_at,
      });
    });
    recentForms.forEach((form) => {
      notifications.push({
        type: "form_update",
        message: `Form ${form.status} for User ID ${form.user_id}`,
        created_at: form.created_at,
      });
    });
    notifications.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.status(200).json(notifications);
  } catch (err) {
    console.error("❌ Get notifications error:", err);
    res.status(500).json({ message: "Error fetching notifications" });
  }
},
};

module.exports = AdminService;
