import { lazy, Suspense } from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Cards from "./pages/Cards";
import AddCard from "./pages/AddCard";
import Payment from "./pages/Payment";
import Transactions from "./pages/Transactions";
import AdminCards from "./pages/AdminCards";

import ThemeToggle from "./components/ThemeToggle";

// Chart-heavy pages are loaded on demand to keep the initial bundle small.
const Analytics = lazy(() => import("./pages/Analytics"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));


function App() {
  return (
    <>
      <ThemeToggle />

      <Suspense
        fallback={
          <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#080f1d]" />
        }
      >
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/cards"
          element={<Cards />}
        />

        <Route
          path="/cards/add"
          element={<AddCard />}
        />

        <Route
          path="/payment"
          element={<Payment />}
        />

        <Route
          path="/transactions"
          element={<Transactions />}
        />

        <Route
          path="/analytics"
          element={<Analytics />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/cards"
          element={<AdminCards />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
      </Suspense>
    </>
  );
}

export default App;