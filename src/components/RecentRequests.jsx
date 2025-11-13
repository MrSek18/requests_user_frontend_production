import { useEffect, useState } from "react";
import axios from "axios";

export default function RequerimientosRecientes({ token }) {
  const [requerimientos, setRequerimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchRequerimientos = async () => {
      try {
        const res = await axios.get("/requests/recent", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setRequerimientos(res.data);
      } catch (err) {
        console.error("Error al cargar requerimientos:", err);
        setError("No se pudieron cargar los requerimientos.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequerimientos();
  }, [token]);

  if (loading) return <p className="mt-4 text-gray-500">Cargando requerimientos...</p>;
  if (error) return <p className="mt-4 text-red-500">{error}</p>;

  return (
    <div className="mt-10">
      <div className="w-full flex items-center justify-between">
        <label className="text-2xl font-medium">
          Requerimientos agregados recientemente
        </label>
        <a href="#vertodo" className="font-medium text-[#000AC7]">
          Ver todo
        </a>
      </div>

      {requerimientos.length === 0 ? (
        <p className="mt-4 text-gray-500">No hay requerimientos recientes.</p>
      ) : (
        <ul className="mt-4">
          {requerimientos.map((req) => {
            const empresa = req.company?.name || "Empresa desconocida";
            const servicio = req.details?.[0]?.service?.name || "Servicio no especificado";
            const fecha = new Date(req.date).toLocaleDateString("es-PE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const total = parseFloat(req.total).toFixed(2);

            return (
              <li
                key={req.id}
                className="w-full flex justify-between mt-4 border-b-[0.1em] border-black"
              >
                <div className="mb-5">
                  <h1 className="mb-1 font-semibold">{empresa}</h1>
                  <h1 className="mb-5 font-normal">{servicio}</h1>
                  <label className="mt-3 font-light">{fecha}</label>
                </div>
                <div className="flex items-start">
                  <label className="font-medium mt-1 text-[#3f46c8]">${total}</label>
                  <button
                    className="group flex p-1 ml-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Omitir"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500 group-hover:text-gray-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>

                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
