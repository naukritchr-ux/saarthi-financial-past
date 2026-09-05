import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";

import "./Login.css";


function Login() {

  const navigate = useNavigate();

  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);


  function handleLogin() {

    if (!username.trim()) {

      alert("Please enter username");

      return;

    }


    if (!password) {

      alert("Please enter password");

      return;

    }


    if (
      username === "Admin" &&
      password === "Admin@26"
    ) {

      login("Admin");

      navigate("/dashboard");

    }
    else {

      alert("Invalid username or password");

    }

  }


  function handleKeyDown(e) {

    if (e.key === "Enter") {

      handleLogin();

    }

  }


  return (

    <div className="login-page">


      <div className="login-box">


        <h1>
          TCHR
        </h1>


        <h2>
          Performance Ledger
        </h2>


        {/* Username */}

        <div className="login-field">

          <label htmlFor="username">
            Username
          </label>


          <input
            id="username"
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            onKeyDown={handleKeyDown}
            autoComplete="username"
          />

        </div>


        {/* Password */}

        <div className="login-field">

          <label htmlFor="password">
            Password
          </label>


          <div className="password-wrapper">


            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
            />


            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >

              {showPassword ? "🙈" : "👁"}

            </button>


          </div>

        </div>


        {/* Login Button */}

        <button
          className="login-button"
          onClick={handleLogin}
        >

          Login

        </button>


      </div>


    </div>

  );

}


export default Login;