import React, { useState, useEffect } from "react";
import { apiFetch } from "./utils/api";
import { auth, provider, signInWithPopup } from "./firebaseConfig";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaUserCheck, FaPaintBrush, FaRobot } from "react-icons/fa";
import doodle_bg from "./assets/img/doodle_bg.jpg";
import LOGO from "./assets/img/LOGO.png";
import signupimg from "./assets/img/signup.png";
import Google_icon from "./assets/img/Google_icon.png";
import styled from 'styled-components';
import "./Login.css";

const Navbar = styled.nav`
  background-color: #fff !important;
  height: 70px; /* Adjust height as needed */
  display: flex;
  align-items: center; /* Ensures content is vertically centered */
  padding: 0 20px; /* Optional: Adds horizontal padding */
`;

const messages = [
  { text: "Security", icon: <FaShieldAlt />, color: "red" },
  { text: "User Experience", icon: <FaUserCheck />, color: "blue" },
  { text: "Customization", icon: <FaPaintBrush />, color: "purple" },
  { text: "Automation", icon: <FaRobot />, color: "orange" },
];

function Login() {
  const navigate = useNavigate();
  const [showLoginbtn, setShowLoginbtn] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSignUpSection, setShowSignUpSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginSection, setShowLoginSection] = useState(true);
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
  const [showBackToLogin, setShowBackToLogin] = useState(true);
  const [showBackToChangePassword, setShowBackToChangePassword] = useState(false);

  const [user, setUser] = useState(null);

  const [currentMessage, setCurrentMessage] = useState(messages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => {
        const currentIndex = messages.indexOf(prev);
        return messages[(currentIndex + 1) % messages.length];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("changePassword")) {
      showChangePassFrom();
    }
  }, []);

  useEffect(() => {
    if (window.location.pathname === "/signup") {
      setShowLoginSection(false);
      setShowSignUpSection(true);
      setShowLoginbtn(false);
    }
  }, []);

  const handleLoginbtn = () => {
    window.history.pushState({}, "", "/signup");
    setUsername(""); // Clear username
    setEmail(""); // Clear email
    setPassword(""); // Clear password

    setShowLoginSection(false);
    setShowChangePasswordSection(false);
    setShowSignUpSection(true);
    setShowLoginbtn(false);
    setShowOTPSection(false);
  };

  const handleSignUpbtn = () => {
    window.history.pushState({}, "", "/login");
    setUsername(""); // Clear username
    setEmail(""); // Clear email
    setPassword(""); // Clear password

    setShowLoginSection(true);
    setShowChangePasswordSection(false);
    setShowSignUpSection(false);
    setShowLoginbtn(true);
    setShowOTPSection(false);
  };

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, provider); // Call sign-in only inside onClick
      const user = result.user;

      // Send user details to backend
      const response = await apiFetch("/api/login/google-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, username: user.displayName || "", password: "" }),
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        showSuccessMessage("Account created successfully! Redirecting...");
        navigate("/home"); // Redirect after login
      } else {
        showErrorMessage(data.message || "Error inserting Google user.");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const handleGoogleSignIp = async () => {
    try {
      const result = await signInWithPopup(auth, provider); // Sign in with Google
      const user = result.user;

      // Send user details to backend for verification
      const response = await apiFetch("/api/login/google-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        showSuccessMessage("Login successful! Redirecting...");
        navigate("/home"); // Redirect on successful login
      } else {
        showErrorMessage(data.message || "Google Sign-In failed. Please try again.");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const handleSignUp = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      showErrorMessage("Please fill all fields.");
      return;
    }

    try {
      const response = await apiFetch("/api/login/signup", {
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
      const response = await apiFetch("/api/login/verifyLogin", {  // this is correct if the proxy is set up
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        navigate("/home");
      } else {
        // 🔹 Show the correct error message
        showErrorMessage(data.message || "Invalid email or password.");
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
      const response = await apiFetch("/api/login/checkUserExists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: otpInput }),
      });

      const data = await response.json();

      if (data.message === "OTP sent successfully") {
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
      const response = await apiFetch("/api/login/VerifyOrValidate", {
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
      const response = await apiFetch("/api/login/VerifyOrValidate", {
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
      const response = await apiFetch("/api/login/updatePassword", {
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
    alertBox.style.alignItems = "center";
    alertBox.style.borderRadius = "8px";
    alertBox.style.backgroundColor = "#FFFAEB"; // Light yellow background
    alertBox.style.color = "rgb(133, 77, 14)"; // Dark yellow-brown text color
    alertBox.style.padding = "14px";
    alertBox.style.marginTop = "10px";
    alertBox.style.lineHeight = "1.5";
    alertBox.style.fontSize = "14px";
    alertBox.style.border = "1px solid lightgray"; // No border

    alertBox.innerHTML = `
      <i className="fa fa-exclamation-triangle" style="color: #856404; margin-right: 10px;"></i>
      <span id="alert-message-text" style="font-weight: 50; font-family: Arial, sans-serif;">${message}</span>
    `;

    setTimeout(() => {
      alertBox.style.display = "none";
    }, 5000);
  };

  const showSuccessMessage = (message) => {
    const alertBox = document.getElementById("alert-message");
    alertBox.classList.remove("alert-danger");
    alertBox.classList.add("alert-success");
    alertBox.style.display = "flex";
    alertBox.style.alignItems = "center";
    alertBox.style.borderRadius = "8px";
    alertBox.style.border = "1px solid #c3e6cb";
    alertBox.style.backgroundColor = "#d4edda"; // Light green background for success
    alertBox.style.color = "#155724";
    alertBox.style.padding = "15px";  // Increase padding for more height
    alertBox.style.marginTop = "10px";
    alertBox.style.lineHeight = "1.5"; // Improve text spacing
    alertBox.innerHTML = `
      <i className="fa fa-check-circle" style="color: #155724; margin-right: 10px;"></i>
      <span id="alert-message-text">${message}</span>
    `;

    setTimeout(() => {
      alertBox.style.display = "none";
    }, 5000);
  };

  const handleOtpInputChange = (e) => {
    setOtpCode(e.target.value);
    setOtpEntered(e.target.value.trim().length > 0);
  };

  return (
    <div>
      {/* Header Navbar */}
      <Navbar className="navbar navbar-expand-lg navbar-light header">
        <div className="header-left">
          <a className="navbar-brand" href="#">
            <img
              src={LOGO}
              alt="dForms Logo"
              style={{ height: "80px", objectFit: "contain" }}
            />
          </a>
        </div>
        <div className="header-right">
          {showLoginbtn ? (
            <button className="btn navbtns" onClick={handleLoginbtn} >
              <img
                src={signupimg}
                alt="dForms Logo"
                style={{ height: "70px", objectFit: "contain", marginBottom: "-10px" }}
              />
            </button>
          ) : (
            <button className="btn navbtns" onClick={handleSignUpbtn}>
              Login
            </button>
          )}
        </div>
      </Navbar >
      {/* left side login details */}
      <div className="login-container">
        <div className="login-card">
          <div className="card">
            {showSignUpSection && (
              <div id="signup-section">
                <h4 className="card-title text-center my-3 font-weight-bold">Create your account</h4>

                <div className="form-group mt-3">
                  <button onClick={handleGoogleSignUp} className="googleauthbtn">
                    <img src={Google_icon} alt="Google" style={{ width: "30px", height: "30px" }} className="google-icon" />
                    Sign up with Google
                  </button>

                  {/* Divider Line with "Or" */}
                  <div className="login-divider">
                    <span className="login-divider-text">Or</span>
                  </div>

                  <div className="input-group mt-2">
                    <label htmlFor="username">Username</label>
                    <div className="input-container">
                      <input type="text" id="username" className="form-control"
                        value={username} onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <div className="input-container">
                      <input type="email" id="email" className="form-control"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <div className="input-container">
                      <input type={showPassword ? "text" : "password"} id="password" className="form-control"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn"
                        style={{ color: "hsl(8, 77%, 56%)", marginTop: "0px" }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={showPassword ? "fa fa-eye-slash" : "fa fa-eye"}></i>
                      </button>
                    </div>
                  </div>

                  {/* alert messages */}
                  <div id="alert-message" style={{ display: "none" }}></div>

                  <button onClick={handleSignUp} className="btn btn-success w-100 mt-4 mb-2" style={{ backgroundColor: "hsl(8, 77%, 56%)", border: "none" }}>
                    Create Account
                  </button>

                </div>
              </div>
            )}

            {showLoginSection && (
              <div id="login-section">
                <h4 className="card-title text-center my-3 font-weight-bold">Sign in to dForms</h4>
                <button onClick={handleGoogleSignIp} className="googleauthbtn">
                  <img src={Google_icon} alt="Google" style={{ width: "30px", height: "30px" }} className="google-icon" />
                  Sign in with Google
                </button>

                {/* Divider Line with "Or" */}
                <div className="login-divider">
                  <span className="login-divider-text">Or</span>
                </div>

                <div className="form-group mt-3">
                  <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <div className="input-container">
                      <input type="text" id="email" name="email" className="form-control"
                        value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <div className="input-container">
                      <input type={showPassword ? "text" : "password"} id="password" name="password" className="form-control"
                        value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button
                        type="button"
                        className="btn"
                        id="toggle-password"
                        style={{ color: "hsl(8, 77%, 56%)", marginTop: "0px" }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={showPassword ? "fa fa-eye-slash" : "fa fa-eye"}></i>
                      </button>
                    </div>
                  </div>

                  {/* alert messages */}
                  <div id="alert-message" style={{ display: "none" }}></div>

                  <button onClick={verifyLogin} className="btn btn-primary w-100 mt-4 mb-2" style={{ backgroundColor: "hsl(8, 77%, 56%)", border: "none" }} >
                    Secure Sign-in
                  </button>

                  <div className="text-center mt-3">
                    <small>
                      <div className="text-center mt-3">
                        <small>
                          <button onClick={showOTPForm} className="Forgot_password" style={{ background: "none", border: "none" }}>
                            Forgot password?
                          </button>
                        </small>
                      </div>

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
                      <input type="text" id="otp-input" className="form-control" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} />
                    </div>

                    {/* alert messages */}
                    <div id="alert-message" style={{ display: "none" }}></div>

                    <button onClick={sendOTP} className="btn btn-primary w-100 mt-3" style={{ backgroundColor: "hsl(8, 77%, 56%)", border: "none", outline: "none" }}>Send OTP</button>
                    {showBackToLogin && (
                      <button onClick={showLoginForm} id="Back_to_Login_btn" className="btn btn-secondary w-100 mt-2" style={{ border: "none", outline: "none" }}>Back to Login</button>
                    )}
                    {showBackToChangePassword && (
                      <button onClick={showChangePassFrom} id="Back_to_Change_New_Password_btn" className="btn btn-secondary w-100 mt-2" style={{ border: "none", outline: "none" }}>Back to Change Password</button>
                    )}
                  </div>
                )}

                {showOTPVerificationSection && (
                  <div id="otp-verification-section">
                    <div className="form-group mt-3">
                      <label htmlFor="otp-code">Enter OTP</label>
                      <input type="text" id="otp-code" className="form-control" value={otpCode} onChange={handleOtpInputChange} />
                      <small id="otp-timer" style={{ display: timeLeft > 0 ? "block" : "none", color: "red", fontWeight: "bold" }}>{`Time left: ${timeLeft} sec`}</small>
                    </div>

                    {/* alert messages */}
                    <div id="alert-message" style={{ display: "none" }}></div>

                    <button onClick={() => verifyOTP('')} id="login-btn" className="btn btn-success w-100 mt-3" style={{ display: otpEntered && !document.getElementById("Back_to_Change_New_Password_btn")?.offsetParent ? "block" : "none" }}>Login</button>
                    <button onClick={() => verifyOTP('showChangeNewPassFrom')} id="show-change-pass-btn" className="btn btn-success w-100 mt-3" style={{ display: otpEntered && document.getElementById("Back_to_Change_New_Password_btn")?.offsetParent ? "block" : "none" }}>Continue</button>
                  </div>
                )}

                {showChangePasswordSection && (
                  <div id="change-password-section">
                    <h4 className="text-center my-3 font-weight-bold">Change Password</h4>
                    <div className="form-group mt-4">
                      <label htmlFor="old-password">Enter Old Password</label>
                      <input type="password" id="old-password" className="form-control" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    </div>

                    {/* alert messages */}
                    <div id="alert-message" style={{ display: "none" }}></div>

                    <button onClick={validateOldPassword} className="btn btn-primary w-100 mt-3" style={{ backgroundColor: "hsl(8, 77%, 56%)", border: "none", outline: "none" }}>Continue</button>
                    <button onClick={changePasswordByOTP} className="btn btn-secondary w-100 mt-2" style={{ backgroundColor: "hsl(8, 77%, 56%)", border: "none", outline: "none" }}>Change Password via OTP</button>
                    <button onClick={showLoginForm} className="btn btn-secondary w-100 mt-2" style={{ border: "none", outline: "none" }}>Back to Login</button>
                  </div>
                )}

                {showNewPasswordSection && (
                  <div id="new-password-section">
                    <div className="form-group mt-3">
                      <label htmlFor="new-password">Enter New Password</label>
                      <input type="password" id="new-password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>

                    {/* alert messages */}
                    <div id="alert-message" style={{ display: "none" }}></div>

                    <button onClick={updatePassword} className="btn btn-success w-100 mt-3">Update Password</button>
                  </div>
                )}
              </div>
            )}

          </div>

          <div style={{ textAlign: "center" }}>
            <span style={{ color: "gray", fontSize: "0.7rem", display: "block", marginTop: "-20px" }}>
              By using dForms, you are agreeing to our{" "}
              <a
                href="#"
                style={{ color: "gray", textDecoration: "underline" }}
                onMouseOver={(e) => { e.target.style.color = "blue"; }}
                onMouseOut={(e) => { e.target.style.color = "gray"; }}
              >
                privacy policy
              </a>{" "}
              and{" "}
              <a
                href="#"
                style={{ color: "gray", textDecoration: "underline" }}
                onMouseOver={(e) => { e.target.style.color = "blue"; }}
                onMouseOut={(e) => { e.target.style.color = "gray"; }}
              >
                terms
              </a>.
            </span>
          </div>

        </div>

        {/* Right side image content */}
        <div className="login-image">
          <img src={doodle_bg} alt="Login_Background" />

          {/* White Div with Dynamic Text */}
          <div className="dynamic-text-container" style={{ color: currentMessage.color }}>
            <span className="icon">{currentMessage.icon}</span>
            <span className="dynamic-text mt-1">{currentMessage.text}</span>
          </div>

          {/* Text */}
          <div className="overlay-text">Make a form</div>

          {/* Second image inside a div */}
          {/* <div className="bottom-image-container">
            <img src={Login_intro_bottom_img} alt="Bottom_Image" className="bottom-image" />
          </div> */}
        </div>

      </div>

    </div >
  );
}

export default Login;