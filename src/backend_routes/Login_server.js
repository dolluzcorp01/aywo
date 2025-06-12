const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const nodemailer = require("nodemailer");
const getDBConnection = require('../../config/db');

const JWT_SECRET = 'Pavithran_form_builder_jwt_secret_key';

router.use(cookieParser());

// 🔹 Middleware to verify JWT
const verifyJWT = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(403).json({ message: 'Access Denied. No Token Provided!' });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid Token' });
    }
    req.user_id = decoded.user_id;
    next();
  });
};

//Google signup 
router.post("/google-signup", (req, res) => {
  const { email, username } = req.body;
  const db = getDBConnection("form_builder");

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  // Check if email already exists
  const checkQuery = "SELECT user_id FROM users WHERE email = ?";
  db.query(checkQuery, [email], (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (result.length > 0) {
      // Email already exists, generate a JWT token for login
      const user_id = result[0].user_id;
      const token = jwt.sign({ user_id }, JWT_SECRET, { expiresIn: "1h" });

      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "Strict" });
      return res.status(200).json({ success: true, message: "User logged in successfully", token });
    } else {
      // Insert new Google user (password will be empty)
      const insertQuery = "INSERT INTO users (user_name, email, account_password, created_time) VALUES (?, ?, '', NOW())";
      db.query(insertQuery, [username, email], (err, insertResult) => {
        if (err) {
          console.error("❌ Error inserting Google user:", err);
          return res.status(500).json({ success: false, message: "Database error" });
        }

        if (insertResult.affectedRows === 1) {
          // Fetch user ID
          const userQuery = "SELECT user_id FROM users WHERE email = ?";
          db.query(userQuery, [email], (err, userResult) => {
            if (err) {
              console.error("❌ Error fetching user ID:", err);
              return res.status(500).json({ success: false, message: "Database error" });
            }

            if (userResult.length > 0) {
              const user_id = userResult[0].user_id;
              const token = jwt.sign({ user_id }, JWT_SECRET, { expiresIn: "1h" });

              res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "Strict" });
              return res.status(201).json({
                success: true,
                message: "Google account registered successfully!",
                token,
              });
            }
          });
        } else {
          return res.status(500).json({ success: false, message: "Error creating account" });
        }
      });
    }
  });
});

router.post("/google-signin", (req, res) => {
  const { email } = req.body;
  const db = getDBConnection("form_builder");

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  // Check if the email exists
  const query = "SELECT user_id FROM users WHERE email = ?";
  db.query(query, [email], (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (result.length > 0) {
      // User exists, generate JWT token for login
      const user_id = result[0].user_id;
      const token = jwt.sign({ user_id }, JWT_SECRET, { expiresIn: "1h" });

      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "Strict" });
      return res.status(200).json({ success: true, message: "Google login successful", token });
    } else {
      // User not found
      return res.status(404).json({ success: false, message: "Google account not registered. Please sign up first." });
    }
  });
});

//Normal singup
router.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  const db = getDBConnection('form_builder');

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Sanitize Password (optional)
  const sanitizedPassword = password.replace(/[^a-zA-Z0-9]/g, "");

  // Check if email already exists
  const checkQuery = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';
  db.query(checkQuery, [email], (err, checkResult) => {
    if (err) {
      console.error('❌ Error checking email:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (checkResult[0].count > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists. Please log in.' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(sanitizedPassword, 10);

    // Insert new user
    const insertQuery = 'INSERT INTO users (user_name, email, account_password, created_time) VALUES (?, ?, ?, NOW())';
    db.query(insertQuery, [username, email, hashedPassword], (err, insertResult) => {
      if (err) {
        console.error('❌ Error inserting user:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (insertResult.affectedRows === 1) {
        // Fetch user ID
        const userQuery = 'SELECT user_id FROM users WHERE email = ?';
        db.query(userQuery, [email], (err, userResult) => {
          if (err) {
            console.error('❌ Error fetching user ID:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
          }

          if (userResult.length > 0) {
            const user_id = userResult[0].user_id;

            // Generate JWT Token
            const token = jwt.sign({ user_id }, JWT_SECRET, { expiresIn: '1h' });

            // Set JWT token in cookie
            res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });

            return res.status(201).json({
              success: true,
              message: 'Account created successfully!',
              token
            });
          }
        });
      } else {
        return res.status(500).json({ success: false, message: 'Error creating account' });
      }
    });
  });
});

// 🔹 Login API with JWT
router.post('/verifyLogin', (req, res) => {
  const { email, password } = req.body;
  const db = getDBConnection('form_builder');
  const query = 'SELECT user_id, account_password FROM users WHERE email = ?';

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('❌ Error during login:', err);
      return res.status(500).json({ message: 'Error during login' });
    }

    if (results.length > 0) {
      const user_id = results[0].user_id;
      const storedHashedPassword = results[0].account_password;

      // 🔹 Check if the password is empty (Google sign-in user)
      if (!storedHashedPassword || storedHashedPassword.trim() === "") {
        return res.json({
          success: false,
          message: "Login with Google instead. Account does not have password login enabled."
        });
      }

      const isPasswordCorrect = bcrypt.compareSync(password, storedHashedPassword);
      if (isPasswordCorrect) {
        const token = jwt.sign({ user_id }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'None' });
        return res.json({ success: true, token });
      }
    }

    return res.json({ success: false, message: 'Invalid credentials' });
  });
});

// 🔹 Check if User Exists API
router.post('/checkUserExists', (req, res) => {
  const { userInput } = req.body;
  const db = getDBConnection('form_builder');
  const query = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';

  db.query(query, [userInput], (err, results) => {
    if (err) {
      console.error('❌ Error in checkUserExists:', err);
      return res.status(500).json({ message: 'Error checking user' });
    }
    if (results[0].count > 0) {
      generateOTP(userInput, res);
    } else {
      res.json({ message: 'not_exists' });
    }
  });
});

// 🔹 Generate OTP Function
const generateOTP = (userInput, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiryTime = new Date(Date.now() + 5 * 60000); 
  const db = getDBConnection('form_builder');

  const query = `INSERT INTO otpstorage (UserInput, OTP, ExpiryTime) VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE OTP = ?, ExpiryTime = ?`;

  db.query(query, [userInput, otp, expiryTime, otp, expiryTime], async (err) => {
    if (err) {
      console.error('❌ Error in generateOTP:', err);
      return res.status(500).json({ message: 'Error generating OTP' });
    }

    // 🔹 Send OTP via Email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "vv.pavithran12@gmail.com",
        pass: "aajuyoahcuszqrey", // Gmail App Password
      },
    });

    const mailOptions = {
      from: '"dForms Support" <vv.pavithran12@gmail.com>',
      to: userInput,
      subject: "dForms Password Reset - Your OTP Code",
      html: `
    <div style="font-family: Arial, sans-serif; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #4A90E2;">dForms - One Time Password (OTP)</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password on <strong>dForms</strong>.</p>
      <p>Please use the following OTP to verify your identity:</p>
      <h3 style="color: #333; font-size: 24px;">${otp}</h3>
      <p>This OTP is valid for <strong>2 minutes</strong>. Do not share this code with anyone.</p>
      <p>If you did not request a password reset, please ignore this message.</p>
      <br/>
      <p style="color: #888;">— The dForms Team</p>
    </div>
  `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("❌ Error sending OTP email:", error);
      res.status(500).json({ message: "Failed to send OTP email" });
    }
  });
};

// 🔹 Verify OTP or Old Password API
router.post('/VerifyOrValidate', (req, res) => {
  const { validationType, userInput, enteredValue } = req.body;
  const db = getDBConnection('form_builder');

  if (validationType === "OTP") {
    // ✅ Verify OTP
    const query = "SELECT OTP FROM OTPStorage WHERE UserInput = ? AND ExpiryTime > NOW()";
    db.query(query, [userInput], (err, results) => {
      if (err) {
        console.error("❌ Error verifying OTP:", err);
        return res.status(500).json({ message: "Error verifying OTP" });
      }

      if (results.length > 0 && results[0].OTP === enteredValue) {
        const userQuery = "SELECT user_id FROM users WHERE email = ?";

        db.query(userQuery, [userInput], (userErr, userResults) => {
          if (userErr) {
            console.error("❌ Error retrieving user ID:", userErr);
            return res.status(500).json({ message: "Error retrieving user ID" });
          }

          if (userResults.length > 0) {
            const user_id = userResults[0].user_id;
            const token = jwt.sign({ user_id }, JWT_SECRET, { expiresIn: "1h" });

            // ✅ Set JWT token in secure cookie
            res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "None" });
            return res.json({ success: true, message: "OTP Verified", token });
          } else {
            return res.json({ success: false, message: "Invalid or Expired OTP" });
          }
        });
      } else {
        return res.json({ success: false, message: "Invalid or Expired OTP" });
      }
    });

  } else if (validationType === "OldPassword") {
    // ✅ Verify Old Password
    verifyJWT(req, res, () => {
      const user_id = req.user_id;

      if (!user_id) return res.status(401).json({ message: "Unauthorized" });

      const query = "SELECT account_password FROM users WHERE user_id = ?";
      db.query(query, [user_id], (err, results) => {
        if (err) {
          console.error("❌ Error validating password:", err);
          return res.status(500).json({ message: "Error validating password" });
        }

        if (results.length > 0) {
          const hashedPassword = results[0].account_password;
          const isMatch = bcrypt.compareSync(enteredValue, hashedPassword);
          return res.json({ success: isMatch, message: isMatch ? "Password Verified" : "Invalid Password" });
        } else {
          return res.json({ success: false, message: "Invalid Password" });
        }
      });
    });
  } else {
    return res.json({ success: false, message: "Invalid Validation Type" });
  }
});

// 🔹 Update Password API
router.post('/updatePassword', verifyJWT, (req, res) => {
  const { newPassword } = req.body;
  const user_id = req.user_id;
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  const db = getDBConnection('form_builder');
  const query = 'UPDATE users SET account_password = ? WHERE user_id = ?';

  db.query(query, [hashedPassword, user_id], (err) => {
    if (err) {
      console.error('❌ Error updating password:', err);
      return res.status(500).json({ message: 'Error updating password' });
    }
    res.json({ success: true, message: 'Password Updated' });
  });
});

module.exports = { router, verifyJWT };
