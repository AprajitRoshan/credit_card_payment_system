import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Cards from "./pages/Cards";
import AddCard from "./pages/AddCard";
import Payment from "./pages/Payment";
import Transactions from "./pages/Transactions";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/cards" element={<Cards />} />
      <Route path="/cards/add" element={<AddCard />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/admin" element={<AdminDashboard />} />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;