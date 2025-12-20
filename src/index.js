import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Configuración global de Axios
axios.defaults.baseURL =
  "https://requests-user-backend-production.onrender.com/api";
axios.defaults.headers.common["Accept"] = "application/json";

// Interceptor para manejar la autenticación en cada request
axios.interceptors.request.use((config) => {
  const authData = JSON.parse(localStorage.getItem("auth"));
  if (authData?.token) {
    config.headers.Authorization = `Bearer ${authData.token}`;
  }
  return config;
});


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
