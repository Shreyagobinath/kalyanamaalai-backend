// models/auth/controller.js
const AuthService = require("./service");

const AuthController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Call login() from service
      const result = await AuthService.login({ email, password });

      res.json({
        message: "Login successful",
        token: result.token,
        role: result.role,
        user: result.user,
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(400).json({ message: err.message || "Login failed" });
    }
  },

  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields required" });
      }

      const user = await AuthService.register({ name, email, password, role });

      res.status(201).json({ message: "Registration successful", user });
    } catch (err) {
      console.error("Register error:", err);
      res.status(400).json({ message: err.message || "Registration failed" });
    }
  },
};

module.exports = AuthController;
