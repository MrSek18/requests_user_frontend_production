
import axios from "axios";

export const warmUpDatabase = async () => {
  try {
    await axios.get(`${process.env.REACT_APP_API_URL}/api/health`);
  } catch (err) {
    console.warn("Warm-up falló, esperando igual...");
  }
  await new Promise((resolve) => setTimeout(resolve, 5000));
};
