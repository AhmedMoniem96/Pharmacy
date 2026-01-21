import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/accounts/me/")
      .then((res) => setProfile(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome, {profile.user.username}</h1>
      <p>Role: {profile.role}</p>
      <p>Company: {profile.company?.name}</p>
      <button onClick={handleLogout}>Logout</button>
      
      <hr />
      <h3>Modules</h3>
      <p>Inventory | Sales (POS) | Accounting | Purchases</p>
    </div>
  );
}

export default Dashboard;