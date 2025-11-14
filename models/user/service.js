const pool = require("../../config/db");
const { markReadNotifications } = require("./controller");
const nodemailer = require("nodemailer");
const sendEmail = require("../../utils/email");
const { get } = require("mongoose");

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
    const [rows] = await pool.query(
        "SELECT email FROM users WHERE id = ?", [receiverId]
    );
    const receiverEmail = rows[0].email;
    if(receiverEmail){
      const message = "💌 You have a new connection request!";
      await this.addNotification(receiverId,message,);

      sendEmail(
        receiverEmail,
        "New Connection Request",
        message
      );

      return{message:"Request sent to admin for approval"};
    }
    /*await pool.query(
        "INSERT INTO notifications(user_id,message) VALUES (?,?)",
        [receiverId,"💌 You have a new connection request!"]
    );
    return {message:"connection request sent"};
  },*/
  },
  async addNotification(userId, message) {
    try {
    const query = "INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)";
    const [result] = await pool.execute(query, [userId, message, false]);

    const [userRows]= await pool.query(
      "SELECT email, name FROM users WHERE id = ?", [userId]);
      if(userRows.length > 0){
        const user = userRows[0];
       
        const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: `"KalyanaMalai" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "New Notification from KalyanaMalai",
         text: `Hi ${user.name},\n\n${message}\n\n- My App`,
          html: `<p>Hi ${user.name},</p><p>${message}</p><p>- My App</p>`,        
    });
  }
    return result;
  }catch (err) {
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
    const [rows] = await pool.query("SELECT id, name, email, gender, city, profile_photo FROM users WHERE id = ?", [userId]);
    return rows[0];
  },
  async updateUser(id, data){
    const fields = Object.keys(data).map(key => `${key} = ?`).join(", ");
    const values = Object.values(data);
    const query = `UPDATE users SET ${fields} WHERE id = ?`;
    const [result] = await pool.query(query, [...values, id]);
    return result.affectedRows > 0;
  }
};

module.exports = UserService;
