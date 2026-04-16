import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import SavedPlans from "./pages/SavedPlans";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  // 🔥 STEP 1: listen for login/logout changes
  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  return (
    <>
      <Toaster position="top-center" />

      <Routes>

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={token ? <Home /> : <Navigate to="/login" />}
        />

        <Route
          path="/saved"
          element={token ? <SavedPlans /> : <Navigate to="/login" />}
        />

      </Routes>
    </>
  );
}

export default App;