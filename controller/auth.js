const AuthService = require("../services/auth");

const AuthController = {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password)
        return res.status(400).json({ message: "All fields required" });

      const result = await AuthService.registerUser(name, email, password);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.loginUser(email, password);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async loginAdmin(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.loginAdmin(email, password);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
    
};

module.exports = AuthController;
