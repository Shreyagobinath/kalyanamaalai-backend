const db = require("../config/db");

const AdminService = {
  async getAllUsers() {
    const [rows] = await db.promise().query("SELECT id, name, email, role FROM users");
    return rows;
  },
  async deleteUser(id) {
    await db.promise().query("DELETE FROM users WHERE id = ?", [id]);
    return { message: "User deleted successfully" };
  },
  async getPendingForms(){
    await db.promise().query("SELECT * FROM forms WHERE status = 'pending'");
    return rows;
  },
  async approveForm(id){
    await db.promise().query("UPDATE forms SET status = 'approved' WHERE id = ?",[id]);
    return {message: "Form approved successfully"};
  },
  async rejectForm(id){
    await db.promise().query("UPDATE forms SET status = 'rejected' WHERE id = ?",[id]);
    return {message: "Form rejected siccessfully"};
  },
  async updateProfile(adminId, updateData) {
    const fields = [];
    const values = [];
    for (let key in updateData) {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    }
    if (fields.length === 0) {
      return null; 
    }
    values.push(adminId); 
    const sql = `UPDATE admins SET ${fields.join(
      ", "
    )} WHERE id = ?`; 
    const [result] = await db.promise().query(sql, values);
    const [updatedRows] = await db
      .promise()
      .query("SELECT * FROM admins WHERE id = ?", [adminId]);

    return updatedRows[0];
  },
};

module.exports = AdminService;
