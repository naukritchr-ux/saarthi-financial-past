import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";

import {
  ROLE_PASSWORDS,
  ROLES
} from "../../auth/roles";

import "./Login.css";


function Login() {


  const navigate = useNavigate();

  const { login } = useAuth();


  const [role, setRole] = useState("");

  const [password, setPassword] = useState("");



  function handleRoleChange(e){

    setRole(e.target.value);

    setPassword("");

  }



  function handleLogin(){


    if(!role){

      alert("Please select user type");

      return;

    }


    const correctPassword =
      ROLE_PASSWORDS[role];


    if(password === correctPassword){


      login(role);


      navigate("/dashboard");


    }
    else {


      alert("Invalid Password");


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



        <label>
          Select User Type
        </label>



        <select

          value={role}

          onChange={handleRoleChange}

        >

          <option value="" disabled>

            Select User Type

          </option>


          <option value={ROLES.HEAD_OFFICE}>

            Head Office

          </option>


          <option value={ROLES.TEAM_LEADER}>

            Team Leader

          </option>


          <option value={ROLES.FRANCHISE_PARTNER}>

            Franchise Partner

          </option>


        </select>




        {

          role && (

            <>


              <div className="password-info">

                Password:

                <strong>

                  {ROLE_PASSWORDS[role]}

                </strong>

              </div>




              <input

                type="password"

                placeholder="Enter Password"

                value={password}

                onChange={(e)=>
                  setPassword(e.target.value)
                }

              />



              <button
                onClick={handleLogin}
              >

                Login

              </button>


            </>

          )

        }



      </div>


    </div>

  );


}


export default Login;