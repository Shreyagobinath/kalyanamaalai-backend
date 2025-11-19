// models/auth/controller.js

const AuthService = require("./service");
const sendEmail = require("../../utils/email");   // email helper

const AuthController = {
  // ======================
  // LOGIN
  // ======================
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Call login() from service
      const result = await AuthService.login({ email, password });

      // result.user should include: name, email, form_completed, status, role
      const user = {
        name: result.user.name,
        email: result.user.email,
        form_completed: result.user.form_completed, // 0 or 1
        status: result.user.status,                 // 'pending', 'approved', 'rejected'
      };

      res.json({
        message: "Login successful",
        token: result.token,
        role: result.role, // 'user' or 'admin'
        user,
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(400).json({ message: err.message || "Login failed" });
    }
  },

  // ======================
  // REGISTER
  // ======================
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields required" });
      }

      const user = await AuthService.register({
        name,
        email,
        password,
        role,
      });

      // ✅ Send welcome email
      await sendEmail({
        to: email,
        subject: "Welcome to Kalyanamaalai",
        text: `Hi ${name}, Welcome to Kalyanamaalai`,
        html: `<p>Hi ${name},</p>
               <p>Welcome to <b>Kalyanamaalai</b>! Your account has been created successfully.</p>`,
      });

      res.status(201).json({
        message: "Registration successful",
        user,
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(400).json({ message: err.message || "Registration failed" });
    }
  },
};

module.exports = AuthController;
