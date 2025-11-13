import React, { useEffect, useState, useRef } from "react";

import api from "../api";
import RequerimientosRecientes from "./RecentRequests";

const Dashboard = ({ user, onLogout }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requerimientos, setRequerimientos] = useState([]);
  const [token, setToken] = useState(null);
  // Ref para evitar dependencias cambiantes en onLogout
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const authData = JSON.parse(localStorage.getItem("auth"));
        const token = authData?.token;
        setToken(token);

        if (!token) {
          throw new Error("No hay token disponible");
        }

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const response = await api.get("/api/user", {
          withCredentials: true,
        });

        console.log("Respuesta completa de la API:", response.data);

        if (!response.data?.user) {
          throw new Error("Estructura de respuesta inesperada");
        }

        setUserData({
          id: response.data.user.id,
          name: response.data.user.name || "Usuario",
          email: response.data.user.email || "No especificado",
          role: response.data.user.role || "Usuario estándar",
          joinedDate: response.data.user.created_at || new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error al obtener datos:", error);
        setError(error.message);

        // Evitar loop si siempre hay 401
        if (error.response?.status === 401 && user) {
          onLogoutRef.current();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    const fetchRequerimientos = async () => {
      try {
        const authData = JSON.parse(localStorage.getItem("auth"));
        const token = authData?.token;

        if (!token) throw new Error("No hay token disponible");

        const res = await api.get("/api/requests/recent", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRequerimientos(res.data);
      } catch (err) {
        console.error("Error al cargar requerimientos:", err);
      }
    };

    fetchRequerimientos();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button
            onClick={() => onLogoutRef.current()}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#2e387d]"
      style={{ fontFamily: '"Roboto SemiCondensed", sans-serif' }}
    >
      <div className="h-full w-full max-w-md space-y-6 bg-white rounded-xl shadow-lg overflow-y-auto">
        <div className="mt-14 ml-5 mr-5 flex flex-col items-center">
          <div className="w-[70%] h-[100px] flex items-center justify-center ">
            <h1 className="text-3xl font-bold text-center leading-relaxed">
              {userData.name}
            </h1>
          </div>

          <div className="text-xs w-full flex items-center justify-around mt-10 font-bold">
            <a href="/configuracion">Configuración</a>
            <a href="/AddRequest">Añadir requerimiento</a>

            <button
              className="text-[#F86060] font-bold"
              onClick={() => onLogoutRef.current()}
            >
              Cerrar sesión
            </button>
          </div>
          {/* Sección de requerimientos recientes */}
          <RequerimientosRecientes token={token} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
