import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
});

const authData = JSON.parse(localStorage.getItem("auth"));
if (authData?.token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${authData.token}`;
}

export default api;

