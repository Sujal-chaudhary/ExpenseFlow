import react, { useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import axios from "axios";
import Login from './components/Login';
import Signup from './components/Signup';
import Expense from './pages/Expense';
import Profile from './pages/Profile';
import { API_BASE_URL } from './config/api';

//to scrill to top when page gets reload or new page is visited
const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  return null;
};

// 1. Define ProtectedRoute component here
const ProtectedRoute = ({ user, loading, children }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-teal-600 font-semibold">
        Loading...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};


export default function App() {
  const [user, setUser] = useState(null); //user state
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  //restrore authentication
  const fetchUser = async () => {

    try {

      const response = await axios.get(
        `${API_BASE_URL}/users/current-user`,
        {
          withCredentials: true
        }
      );

      setUser(response.data.user || response.data);

    } catch (err) {
       if(err.response?.status === 401){
         setUser(null);
       }else{
        console.error(err);
       }
    } finally {
      setLoading(false);
    }

  };
  useEffect(() => {
    fetchUser()
  }, []);

  const clearAuth = async () => {
    try {
      await axios.post(`${API_BASE_URL}/users/logout`,
        {},
        {
          withCredentials: true, //sending request along with request
        }
      );
    } catch (error) {
      console.log("clearAuth error:", error);
    }
  }

  const handleLogout = async () => {
    await clearAuth();
    setUser(null);
    navigate("/login");
  };


  const handleLogin = async () => {
    await fetchUser();
    navigate("/");
  }

  //to update the user data in state
  const updateUserData = (updatedUser) => {
    setUser(updatedUser); //call in profile compoonent 
  }





  return (
    <>
      <ScrollToTop/>
      <Routes>

        <Route path='/signup' element={<Signup />} />
        <Route path='/login' element={<Login onLogin={handleLogin}/>} />

        {/* Protected Routes */}
        <Route element={ <ProtectedRoute user={user} loading={loading}>
          <Layout user={user} onLogout={handleLogout} />
       </ProtectedRoute>}>
          {/* pages */}
          <Route path='/' element={<Dashboard />}/>
          <Route path="/income" element={<Income />} />
          <Route path="/expense" element={<Expense />} />
          <Route path="/profile" element={<Profile 
             user={user}
             onUpdateProfile={updateUserData}
             onLogout={handleLogout}
          />} />
        </Route>

        <Route path='*' element={<Navigate to={user ? "/" : "/login"} replace/>} />
      </Routes>
    </>
  )
}

//Overall Architecture
/*
App.jsx
│
├── fetchUser()  ← restore auth
│
├── handleLogin()
│
├── handleLogout()
│
├── updateUserData()
│
│
└── Routes
     │
     ├── Login
     ├── Signup
     │
     └── ProtectedRoute
            │
            └── Layout
                  │
                  ├── Dashboard
                  ├── Income
                  ├── Expense
                  └── Profile
*/