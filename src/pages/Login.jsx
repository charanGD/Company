import {signInWithPopup} from "firebase/auth";
import {auth, provider} from "../firebase";
import { useNavigate } from "react-router-dom";
function Login(){
   const navigate=useNavigate();
  const login=async()=>{
    try{
     await signInWithPopup(auth, provider);
     navigate("/home");
    }catch(error){
     console.log(error);
    }
  };
  return(
    <div className="container">
    <button className="login-btn"   onClick={login}>Sign in with Google</button>
</div>
  );
}
export default Login;