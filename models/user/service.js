const pool = require("../../config/db");
const { markReadNotifications } = require("./controller");

const UserService = {
  // Submit a new form
  async submitForm(userId, formData) {
    try {
      const fields = Object.keys(formData).join(", ");
      const placeholders = Object.keys(formData).map(() => "?").join(", ");
      const values = Object.values(formData);

      const query = `INSERT INTO forms (user_id, ${fields}) VALUES (?, ${placeholders})`;
      const [result] = await pool.query(query, [userId, ...values]);

      // Return inserted form with inserted ID
      return { id: result.insertId, user_id: userId, ...formData };
    } catch (err) {
      console.error("Error submitting form:", err);
      throw new Error("Failed to submit form");
    }
  },

  // Get all forms for a user
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

  // Get a single form by ID
  async getFormById(id) {
    try {
      const [rows] = await pool.query("SELECT * FROM forms WHERE id = ?", [id]);
      return rows[0];
    } catch (err) {
      console.error("Error fetching form by ID:", err);
      throw new Error("Failed to fetch form");
    }
  },
  async getApprovedUsers(userId){
    const[rows] = await pool.query(
        `SELECT users.id, users.name, TIMESTAMPDIFF(YEAR, forms.dob, CURDATE()) AS age ,forms.city FROM users JOIN forms ON users.id = forms.user_id WHERE forms.status ='approved' `,
        [userId]
    );
    return rows;
  },
  async sendConnectionRequest(senderId, receiverId){
    await pool.query(
        "INSERT INTO connections(sender_id,receiver_id,status) VALUES (?,?,'pending')",
        [senderId,receiverId]
    );
    return{message:"Request sent to admin for approval"};
    /*await pool.query(
        "INSERT INTO notifications(user_id,message) VALUES (?,?)",
        [receiverId,"💌 You have a new connection request!"]
    );
    return {message:"connection request sent"};
  },*/
  },
 async getNotifications(userId) {
    const [rows] = await pool.query(
      "SELECT id, message, `read`, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  },
  async markReadNotifications(userId) {
    await pool.query(
      "UPDATE notifications SET `read` = TRUE WHERE user_id = ?",
      [userId]
    );
    return { message: "All notifications marked as read." };
  }
};

module.exports = UserService;
