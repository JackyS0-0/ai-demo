import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import Demo from "./Demo";
import Login from "./Login";
import UserHome from "./UserHome";

export const router = createBrowserRouter([
  {
    path: "/index",
    element: (
      <RequireAuth>
        <Demo />
      </RequireAuth>
    ),
  },
  {
    path: "/user",
    element: (
      <RequireAuth>
        <UserHome />
      </RequireAuth>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
