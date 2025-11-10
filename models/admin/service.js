const pool = require("../../config/db");

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
    const [rows] = await pool.query("SELECT id, name, email, role FROM users");
    return rows;
  },

  async deleteUser(id) {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
  },

   async getPendingConnections() {
    const [rows] = await pool.query(
      `SELECT c.id, c.sender_id, c.receiver_id, u.name AS sender_name, r.name AS receiver_name
       FROM connections c
       JOIN users u ON c.sender_id = u.id
       JOIN users r ON c.receiver_id = r.id
       WHERE c.status = 'pending'`
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
  async createConnectionRequest(senderId, receiverId) {
    const [result] = await pool.query(
      "INSERT INTO connections (sender_id, receiver_id, status, created_at) VALUES (?, ?, 'pending', NOW())",
      [senderId, receiverId]
    );
    return result;
  },
};

module.exports = AdminService;
