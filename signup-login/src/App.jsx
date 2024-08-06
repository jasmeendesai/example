import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import Home from './components/Home';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
//import { Link } from 'react-router-dom';

function App() {
  return (
    <>
    {/* <p className="text-gray-700 text-sm">
          Forgot password? <Link to="/login" className="text-blue-500 hover:underline">Forgot password</Link>
        </p>
    <p>hemo</p> */}
      <BrowserRouter>
        <Routes>
          <Route path='/signup' element={<Signup />} />
          <Route path='/login' element={<Login />} />
          <Route path='/home' element={<Home />} />
          <Route path='/forgotpassword' element={<ForgotPassword />} />
          <Route path='/reset-password/:token' element={<ResetPassword />} /> {/* Ensure this path matches */}
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </>
  );
}

export default App;
