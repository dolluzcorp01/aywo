import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Form_Builder_Icon from "./assets/img/form_builder_icon.webp";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showInitialOptions, setShowInitialOptions] = useState(true);
  const [showSignUpSection, setShowSignUpSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginSection, setShowLoginSection] = useState(false);
  const [showOTPSection, setShowOTPSection] = useState(false);
  const [showEnterMailSection, setshowEnterMailSection] = useState(false);
  const [showChangePasswordSection, setShowChangePasswordSection] = useState(false);
  const [showOTPVerificationSection, setShowOTPVerificationSection] = useState(false);
  const [showNewPasswordSection, setShowNewPasswordSection] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [otpTimer, setOtpTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [otpEntered, setOtpEntered] = useState(false);
  const [showBackToLogin, setShowBackToLogin] = useState(true); // New state variable
  const [showBackToChangePassword, setShowBackToChangePassword] = useState(false); // New state variable

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("changePassword")) {
      showChangePassFrom();
    }

    document.getElementById('close_alert_message').addEventListener('click', function () {
      document.getElementById("alert-message").style.display = 'none';
    });
  }, []);

  const openLoginForm = () => {
    setUsername(""); // Clear username
    setEmail(""); // Clear email
    setPassword(""); // Clear password
    setShowLoginSection(true);
    setShowSignUpSection(false);
    setShowInitialOptions(false);
  };

  const openSignUpForm = () => {
    setUsername(""); // Clear username
    setEmail(""); // Clear email
    setPassword(""); // Clear password
    setShowSignUpSection(true);
    setShowLoginSection(false);
    setShowInitialOptions(false);
  };

  const handleSignUp = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      showErrorMessage("Please fill all fields.");
      return;
    }
    debugger
    try {
      const response = await fetch("http://localhost:5000/api/login/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
        credentials: "include"
      });

      const data = await response.json();

      if (data.success) {
        showSuccessMessage("Account created successfully! Redirecting...");
        navigate("/home");
      } else {
        showErrorMessage(data.message);
      }
    } catch (error) {
      console.error("Error signing up:", error);
      showErrorMessage("An error occurred. Please try again later.");
    }
  };

  const verifyLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showErrorMessage("Please enter your email and password.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/login/verifyLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"  // ✅ Required to include cookies
      });

      const data = await response.json();

      if (data.success) {
        navigate("/home");
      } else {
        showErrorMessage("Invalid mail id or password.");
      }
    } catch (error) {
      showErrorMessage("An error occurred. Please try again later.");
      console.error(error);
    }
  };


  const showOTPForm = () => {
    setShowOTPSection(true);
    setshowEnterMailSection(true);
    setOtpInput("");

    setShowBackToLogin(true);
    setShowBackToChangePassword(false);

    setShowLoginSection(false);
    setShowChangePasswordSection(false);
    setShowOTPVerificationSection(false);
    setShowNewPasswordSection(false);
    setOtpCode("");
    setNewPassword("");
  };

  const showLoginForm = () => {
    setShowOTPSection(false);
    setshowEnterMailSection(false);
    setShowChangePasswordSection(false);
    setShowOTPVerificationSection(false);
    setShowNewPasswordSection(false);
    setShowLoginSection(true);
    document.getElementById("alert-message").style.display = 'none';
    document.body.style.overflow = 'hidden';
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const sendOTP = async () => {
    if (!otpInput.trim()) {
      showErrorMessage("Please enter your email.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/login/checkUserExists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: otpInput }),
      });

      const data = await response.json();
      debugger
      if (data.message === "exists") {
        showSuccessMessage("OTP has been sent successfully!");
        setShowOTPVerificationSection(true);
        setOtpCode("");
        startOTPTimer();
      } else {
        showErrorMessage("This email is not registered.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      showErrorMessage("An error occurred while sending OTP. Please try again later.");
    }
  };

  const verifyOTP = async (action) => {
    if (!otpCode.trim()) {
      showErrorMessage("Please enter the OTP.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/login/VerifyOrValidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validationType: "OTP", userInput: otpInput, enteredValue: otpCode }),
      });

      const data = await response.json();

      if (data.message === "OTP Verified") {
        clearInterval(otpTimer);
        if (action === "showChangeNewPassFrom") {
          setShowNewPasswordSection(true);
          setShowOTPVerificationSection(false);
        } else {
          navigate("/home");
        }
      } else {
        showErrorMessage("Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      showErrorMessage("An error occurred while verifying OTP. Please try again later.");
    }
  };

  const validateOldPassword = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/login/VerifyOrValidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // ✅ Ensures cookies (including JWT) are sent
        body: JSON.stringify({
          validationType: "OldPassword",
          enteredValue: oldPassword
        }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (data.message === "Password Verified") {
        setShowNewPasswordSection(true);
        //setShowChangePasswordSection(false);
      } else {
        showErrorMessage("Invalid Password. Please try again.");
      }
    } catch (error) {
      console.error("Error validating old password:", error);
      showErrorMessage("An error occurred while validating old password. Please try again later.");
    }
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      showErrorMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/login/updatePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure cookies are sent with the request
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (data.message === "Password Updated") {
        showSuccessMessage("Password updated successfully!");
        showLoginForm();
      } else {
        showErrorMessage("Error updating password. Try again.");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      showErrorMessage("An error occurred while updating password. Please try again later.");
    }
  };


  const showChangePassFrom = () => {
    setShowOTPSection(true);
    setShowInitialOptions(false);
    setshowEnterMailSection(false);
    setShowChangePasswordSection(true);
    setShowOTPVerificationSection(false);
    setShowNewPasswordSection(false);
    setShowLoginSection(false);
    setOldPassword(""); // Clear the old-password field
  };

  const changePasswordByOTP = () => {
    setShowOTPSection(true);
    setshowEnterMailSection(true);
    setShowChangePasswordSection(false);
    setShowOTPVerificationSection(false);
    setShowNewPasswordSection(false);
    setShowBackToLogin(false); // Hide the back to login button
    setShowBackToChangePassword(true); // Show the back to change password button
    setOtpInput(""); // Clear the otp-input field
  };

  const startOTPTimer = () => {
    clearInterval(otpTimer);
    setTimeLeft(120);
    setOtpTimer(setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(otpTimer);
          showErrorMessage("OTP expired. Please request a new OTP.");
          setShowOTPVerificationSection(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000));
  };

  const showErrorMessage = (message) => {
    const alertBox = document.getElementById("alert-message");
    alertBox.classList.remove("alert-success");
    alertBox.classList.add("alert-danger");
    alertBox.style.display = "flex";
    alertBox.style.borderLeft = "5px solid #dc3545";
    alertBox.style.backgroundColor = "#f8d7da";
    alertBox.style.color = "#721c24";
    document.querySelector("#alert-message strong i").style.color = "#dc3545";
    document.getElementById("alert-message-text").innerHTML = message;
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 5000);
  };

  const showSuccessMessage = (message) => {
    const alertBox = document.getElementById("alert-message");
    alertBox.classList.remove("alert-danger");
    alertBox.classList.add("alert-success");
    alertBox.style.display = "flex";
    alertBox.style.borderLeft = "5px solid #28a745";
    alertBox.style.backgroundColor = "#d4f8d4";
    alertBox.style.color = "#155724";
    document.querySelector("#alert-message strong i").style.color = "#28a745";
    document.getElementById("alert-message-text").innerHTML = message;
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 5000);
  };

  const handleOtpInputChange = (e) => {
    setOtpCode(e.target.value);
    setOtpEntered(e.target.value.trim().length > 0);
  };

  return (
    <div className="container d-flex flex-column align-items-center mt-5">
      <div className="card">
        {showInitialOptions && (
          <div className="text-center my-4">
            {/* Project Title */}
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#333" }}>
              Welcome to Form Builder
            </h1>

            {/* Subtitle / Short Description */}
            <p style={{ fontSize: "1.2rem", color: "#666", marginBottom: "20px" }}>
              Create and manage forms effortlessly!
            </p>

            {/* Login & Signup Buttons */}
            <div className="d-flex flex-column align-items-center">
              <button className="btn btn-primary"
                style={{
                  backgroundColor: "hsl(8, 77%, 56%)",
                  border: "none",
                  width: "50%",
                  maxWidth: "250px",
                  padding: "10px 15px",
                  fontSize: "16px",
                  marginBottom: "10px",
                }}
                onClick={openLoginForm}
              >
                Login
              </button>
              <button className="btn btn-secondary"
                style={{
                  width: "50%",
                  maxWidth: "250px",
                  padding: "10px 15px",
                  fontSize: "16px",
                }}
                onClick={openSignUpForm}
              >
                Sign Up
              </button>
            </div>

          </div>
        )}

        {showSignUpSection && (
          <div id="signup-section">
            <h4 className="card-title text-center my-3 font-weight-bold">Create Account</h4>
            <p className="text-muted text-center">Fill in the details below.</p>

            <div className="form-group mt-3">

              <div className="input-group">
                <label htmlFor="username">Username</label>
                <div className="input-container">
                  <input type="text" id="username" className="form-control" placeholder="e.g. Jane Doe"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="email">Email</label>
                <div className="input-container">
                  <input type="email" id="email" className="form-control" placeholder="e.g. jane.doe@acme.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="input-container">
                  <input type={showPassword ? "text" : "password"} id="password" className="form-control" placeholder="Create a strong password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn"
                    style={{ color: "hsl(8,77%,56%)", marginTop: "0px" }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={showPassword ? "fa fa-eye-slash" : "fa fa-eye"}></i>
                  </button>
                </div>
              </div>

              <button onClick={handleSignUp} className="btn btn-success w-100 mt-4 mb-2" style={{ backgroundColor: "hsl(8,77%,56%)", border: "none" }}>
                Create Account
              </button>

              <button className="btn btn-secondary w-100 mb-4"
                onClick={() => {
                  setShowInitialOptions(true); setShowSignUpSection(false); setShowLoginSection(false);
                }}> Go Back
              </button>

            </div>
          </div>
        )}

        {showLoginSection && (
          <div id="login-section">
            <h4 className="card-title text-center my-3 font-weight-bold">Sign In</h4>
            <p className="text-muted text-center">Please login to access the home.</p>

            <div className="form-group mt-3">
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <div className="input-container">
                  <input type="text" id="email" name="email" className="form-control" placeholder="e.g. jane.doe@acme.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="input-container">
                  <input type={showPassword ? "text" : "password"} id="password" name="password" className="form-control" placeholder="Use alphanumeric characters"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button
                    type="button"
                    className="btn"
                    id="toggle-password"
                    style={{ color: "hsl(8,77%,56%)", marginTop: "0px" }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={showPassword ? "fa fa-eye-slash" : "fa fa-eye"}></i>
                  </button>
                </div>
              </div>

              <button onClick={verifyLogin} className="btn btn-primary w-100 mt-4 mb-2" style={{ backgroundColor: "hsl(8,77%,56%)", border: "none" }} >
                Secure Sign-in
              </button>

              <button className="btn btn-secondary w-100 mb-4"
                onClick={() => {
                  setShowInitialOptions(true); setShowSignUpSection(false); setShowLoginSection(false);
                }}> Go Back
              </button>

              <div className="text-center mt-3">
                <small>
                  <a href="#" onClick={showOTPForm} className="Forgot_password">Forgot password?</a>
                </small>
              </div>
            </div>
          </div>
        )}

        {showOTPSection && (
          <div id="otp-section">
            {showEnterMailSection && (
              <div id="enter-mail-for-otp">
                <h4 className="text-center my-3 font-weight-bold">Login via OTP</h4>
                <div className="form-group mt-4">
                  <label htmlFor="otp-input">Enter your Email</label>
                  <input type="text" id="otp-input" className="form-control" placeholder="Email" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} />
                </div>
                <button onClick={sendOTP} className="btn btn-primary w-100 mt-3" style={{ backgroundColor: "hsl(8,77%,56%)", border: "none", outline: "none" }}>Send OTP</button>
                {showBackToLogin && (
                  <button onClick={showLoginForm} id="Back_to_Login_btn" className="btn btn-secondary w-100 mt-2" style={{ border: "none", outline: "none" }}>Back to Login</button>
                )}
                {showBackToChangePassword && (
                  <button onClick={showChangePassFrom} id="Back_to_Change_New_Password_btn" className="btn btn-secondary w-100 mt-2" style={{ border: "none", outline: "none" }}>Back to Change New Password</button>
                )}
              </div>
            )}

            {showOTPVerificationSection && (
              <div id="otp-verification-section">
                <div className="form-group mt-3">
                  <label htmlFor="otp-code">Enter OTP</label>
                  <input type="text" id="otp-code" className="form-control" placeholder="Enter OTP" value={otpCode} onChange={handleOtpInputChange} />
                  <small id="otp-timer" style={{ display: timeLeft > 0 ? "block" : "none", color: "red", fontWeight: "bold" }}>{`Time left: ${timeLeft} sec`}</small>
                </div>
                <button onClick={() => verifyOTP('')} id="login-btn" className="btn btn-success w-100 mt-3" style={{ display: otpEntered && !document.getElementById("Back_to_Change_New_Password_btn")?.offsetParent ? "block" : "none" }}>Login</button>
                <button onClick={() => verifyOTP('showChangeNewPassFrom')} id="show-change-pass-btn" className="btn btn-success w-100 mt-3" style={{ display: otpEntered && document.getElementById("Back_to_Change_New_Password_btn")?.offsetParent ? "block" : "none" }}>Continue</button>
              </div>
            )}

            {showChangePasswordSection && (
              <div id="change-password-section">
                <h4 className="text-center my-3 font-weight-bold">Change New Password</h4>
                <div className="form-group mt-4">
                  <label htmlFor="old-password">Enter Old Password</label>
                  <input type="password" id="old-password" className="form-control" placeholder="Enter Old Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                </div>
                <button onClick={validateOldPassword} className="btn btn-primary w-100 mt-3" style={{ backgroundColor: "hsl(8,77%,56%)", border: "none", outline: "none" }}>Continue</button>
                <button onClick={changePasswordByOTP} className="btn btn-secondary w-100 mt-2" style={{ backgroundColor: "hsl(8,77%,56%)", border: "none", outline: "none" }}>Change Password via OTP</button>
                <button onClick={showLoginForm} className="btn btn-secondary w-100 mt-2" style={{ border: "none", outline: "none" }}>Back to Login</button>
              </div>
            )}

            {showNewPasswordSection && (
              <div id="new-password-section">
                <div className="form-group mt-3">
                  <label htmlFor="new-password">Enter New Password</label>
                  <input type="password" id="new-password" className="form-control" placeholder="Enter New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <button onClick={updatePassword} className="btn btn-success w-100 mt-3">Update Password</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div id="right-after-card" style={{ width: "500px", left: "100%", backgroundColor: "transparent", border: "none", boxShadow: "none" }} className="info-box">
        <div id="alert-message" className="alert alert-danger alert-custom" role="alert"
          style={{ borderRadius: "0", height: "65px", backgroundColor: "hsl(0,75%,97%)", display: "none", borderLeft: "5px solid #dc3545", alignItems: "center" }}>
          <strong style={{ display: "inline-flex", alignItems: "center", height: "100%", marginLeft: "0", paddingLeft: "0px" }}>
            <i className="fa-sharp fa-solid fa-circle-exclamation mr-3"></i>
          </strong>
          <span style={{ color: "black", lineHeight: "1.5" }} id="alert-message-text">Invalid Mail Id or password.</span>
          <button type="button" id="close_alert_message" style={{ marginLeft: "auto", paddingBottom: "1%", boxShadow: "none", border: "none", outline: "none" }} className="close mt-1">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>

      <div className="image-container">
        <img src={Form_Builder_Icon} alt="Form_Builder_Icon Icon" />
      </div>
    </div>
  );
}

export default Login;