const AdminService = require("../services/admin");

const AdminController = {
  async getAllUsers(req, res) {
    try {
      const users = await AdminService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  },

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await AdminService.deleteUser(id);
      res.json(result);
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  },
  async getPendingForms(req,res){
    try {
      const {id}=req.params;
      const result = await AdminService.getPendingForms(id);
      res.json(result);
    }catch(error){
      console.error("Error fetching forms:",error);
      res.status(500).json({message:"Error fetching forms:",error})
    }
  },
  async approveForms(req,res){
    try {
      const {id}=req.params;
      const result = await AdminService.approveForms(id);
      res.json(result);
    }catch(error){
      console.error("Error approving forms:",error);
      res.status(500).json({message:"Error approving forms:",error})
    }
},
async rejectForms(req,res){
    try {
      const {id}=req.params;
      const result = await AdminService.rejectForms(id);
      res.json(result);
    }catch(error){
      console.error("Error rejecting forms:",error);
      res.status(500).json({message:"Error rejecting forms:",error})
    }
},
 async updateProfile(req, res) {
    try {
      const adminId = req.admin.id; 
      const updateData = { ...req.body };
      if (req.file) {
        updateData.profilePhoto = req.file.filename;
      }
      const updatedAdmin = await AdminService.updateProfile(adminId, updateData);
      if (!updatedAdmin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      res.json(updatedAdmin);
    } catch (error) {
      console.error("Error updating admin profile:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
};

module.exports = AdminController;
