import {
  createContext,
  useContext,
  useState
} from "react";


const AuthContext = createContext();



export function AuthProvider({ children }) {


  const [user, setUser] = useState(null);



  function login(role) {


    setUser({

      role

    });


  }



  function logout() {

    setUser(null);

  }



  return (

    <AuthContext.Provider

      value={{

        user,

        role: user?.role || null,

        login,

        logout

      }}

    >

      {children}

    </AuthContext.Provider>

  );


}



export function useAuth(){

  return useContext(AuthContext);

}