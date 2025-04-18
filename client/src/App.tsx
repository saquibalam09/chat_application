import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import ChatPage from "./pages/chat";

import { useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";

function App() {
  const { token, user } = useAuth();
  return (
    <>
      {/* {/* <MyModal isOpen={isOpen} setIsOpen={setIsOpen} /> */}

      {/* <Example /> */}
      <Routes>
        {/* Root route: Redirects to chat if the user is logged in, else to the login page */}
        <Route
          path="/"
          element={
            token && user?._id ? (
              <Navigate to="/chat" />
            ) : (
              <Navigate to="/login" />
            )
          }
        ></Route>

        {/* Private chat route: Can only be accessed by authenticated users */}
        <Route
          path="/chat"
          element={
            // <PrivateRoute>
            <ChatPage />
            // </PrivateRoute>
          }
        />

        {/* Public login route: Accessible by everyone */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Public register route: Accessible by everyone */}
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Wildcard route for undefined paths. Shows a 404 error */}
        <Route path="*" element={<p>404 Not found</p>} />
      </Routes>
    </>
  );
}

export default App;
