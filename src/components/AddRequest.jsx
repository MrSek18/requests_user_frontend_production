import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
export default function AddRequest({ user, onLogout }) {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [filteredReps, setFilteredReps] = useState([]);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [units, setUnits] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [form, setForm] = useState({
    company_id: "",
    representative_id: "",
    requesting_area: "",
    justification: "",
    provider_id: "",
    service_id: "",
    quantity: 1,
    unit_id: "",
    duration: 1,
    date: new Date().toISOString().split("T")[0], 
  });

  const [details, setDetails] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [comp, reps, prov, serv, unit] = await Promise.all([
          api.get("api/companies"),
          api.get("api/representatives"),
          api.get("api/providers"),
          api.get("api/services"),
          api.get("api/units"),
        ]);
        setCompanies(comp.data);
        setRepresentatives(reps.data);
        setProviders(prov.data);
        setServices(serv.data);
        setUnits(unit.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        alert("No se pudo conectar con el servidor. Verifica tu conexión o backend.");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!form.company_id) return;
    api
      .get(`api/company_representatives/${form.company_id}`)
      .then((res) => setFilteredReps(res.data))
      .catch((error) => {
        console.error("Error al cargar representantes:", error);
        setFilteredReps([]);
      });
  }, [form.company_id]);

  const currentUnitPrice = useMemo(() => {
    if (!form.unit_id || units.length === 0) return null;

    const unitName = units.find((u) => u.id === form.unit_id)?.name;
    if (!unitName) return null;

    const base =
      unitName === "meses" ? 1100 :
      unitName === "semanas" ? 300 :
      unitName === "trimestres" ? 3300 :
      unitName === "semestres" ? 6600 :
      unitName === "años" ? 13200 :
      0;

    return base > 0 ? base : null;
  }, [form.unit_id, units]);

  const currentSubtotal = useMemo(() => {
    if (!currentUnitPrice || !form.duration || !form.quantity) return null;
    return currentUnitPrice * form.duration * form.quantity;
  }, [currentUnitPrice, form.duration, form.quantity]);


  const handleAddDetail = () => {
    const unitPrice = currentUnitPrice; // precio por unidad de tiempo
    const subtotal = currentSubtotal;   // total por ítem

    if (!unitPrice || !subtotal) return; // evita agregar si no hay datos válidos

    const newDetail = {
      provider_id: form.provider_id,
      service_id: form.service_id,
      quantity: form.quantity,
      unit_id: form.unit_id,
      duration: form.duration,
      unit_price: unitPrice,
      subtotal: subtotal,
    };

    setDetails([...details, newDetail]);
    setTotal((prev) => prev + subtotal);
  };


  const handleRemoveDetail = (index) => {
    const removed = details[index];
    setDetails(details.filter((_, i) => i !== index));
    setTotal((prev) => prev - removed.price);
  };

  

const handleSubmit = async () => {
  try {
    const payload = {
      ...form,
      details,
      total,
    };
    const response = await api.post("/api/add_request", payload);
    return response.data; // 👈 devuelve el objeto con el ID
  } catch (error) {
    console.error("Error al enviar solicitud:", error.response?.data);
    alert("La solicitud no pudo enviarse. Revisa los campos o contacta al admin.");
    setShowPreview(false);
    throw error;
  }
};

const confirmarEnvio = async () => {
  setShowModal(false);
  try {
    const data = await handleSubmit(); // 👈 aquí obtienes el ID de la solicitud
    setSuccessMessage(true);

    // Descargar PDF automáticamente
    const token = localStorage.getItem("access_token");
    console.log("Token:", token);
    const requestId = data.request_id; // asegúrate que tu backend lo devuelva

    const response = await api.get(`/api/requests/${requestId}/orden-servicio/pdf`, {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `orden_servicio_${requestId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Redirigir después de un tiempo
    setTimeout(() => {
      setSuccessMessage(false);
      navigate("/dashboard");
    }, 2000);
  } catch (error) {
    console.error("Error en confirmarEnvio:", error);
  }
};




if (showPreview) {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 px-4 py-6">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4 overflow-y-auto">
        <h2 className="text-2xl font-bold text-center mb-4">Orden de Servicio</h2>

        <div className="space-y-2 text-sm">
          <p><strong>Empresa:</strong> {companies.find(c => c.id == form.company_id)?.name}</p>
          <p><strong>Solicitante:</strong> {representatives.find(r => r.id == form.representative_id)?.name}</p>
          <p><strong>Área:</strong> {form.requesting_area}</p>
          <p><strong>Justificación:</strong> {form.justification}</p>
        </div>

        <table className="w-full text-sm border mt-4">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Servicio</th>
              <th className="border px-2 py-1">Proveedor</th>
              <th className="border px-2 py-1">Cantidad</th>
              <th className="border px-2 py-1">Rango</th>
              <th className="border px-2 py-1">Duración</th>
              <th className="border px-2 py-1">Precio</th>
            </tr>
          </thead>
          <tbody>
            {details.map((d, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{services.find(s => s.id == d.service_id)?.name}</td>
                <td className="border px-2 py-1">{providers.find(p => p.id == d.provider_id)?.name}</td>
                <td className="border px-2 py-1">{d.quantity}</td>
                <td className="border px-2 py-1">{units.find(u => u.id == d.unit_id)?.name}</td>
                <td className="border px-2 py-1">{d.duration}</td>
                <td className="border px-2 py-1">{d.price} PEN</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right font-bold text-lg mt-4">
          Total: {total} PEN
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setShowPreview(false)}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Regresar
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Confirmar solicitud
          </button>
        </div>
        {successMessage && (
          <div
            style={{
              animation: "fade-in 0.4s ease-out",
              "@keyframes fade-in": `
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              `,
            }}
            className="bg-green-600 text-white px-6 py-4 rounded shadow-lg"
          >
            Solicitud enviada con éxito
          </div>

        )}
        {/* Modal de confirmación */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                ¿Estás seguro?
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                ¿En serio deseas realizar la solicitud?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEnvio}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

  return (
    <div
      className="h-screen flex items-center justify-center bg-[#2e387d]"
      style={{ fontFamily: '"Roboto SemiCondensed", sans-serif' }}
    >
      <div className="h-full w-full max-w-md space-y-6 bg-white rounded-xl shadow-lg overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 p-1">
          <button
            onClick={() => navigate(-1)}
            className="group flex p-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-8 h-8 text-black group-hover:text-gray-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-6">
          <h1 className="text-3xl font-bold text-center mb-6">Añadir requerimiento</h1>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Empresa / Institución</label>
              <select className="w-full border p-2 rounded" value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
                <option value="">Seleccionar</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Solicitante</label>
              <select className="w-full border p-2 rounded" value={form.representative_id} onChange={(e) => setForm({ ...form, representative_id: e.target.value })}>
                <option value="">Seleccionar</option>
                {filteredReps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Área</label>
              <input type="text" className="w-full border p-2 rounded" value={form.requesting_area} onChange={(e) => setForm({ ...form, requesting_area: e.target.value })} />
            </div>

            <div>
              <label className="block font-semibold mb-1">Justificación</label>
              <textarea className="w-full border p-2 rounded h-24" value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} />
            </div>

            <div className="border p-4 rounded-md bg-gray-50 space-y-4">
              <div>
                <label className="block font-semibold mb-1">Proveedor</label>
                <select className="w-full border p-2 rounded" value={form.provider_id} onChange={(e) => setForm({ ...form, provider_id: e.target.value })}>
                  <option value="">Seleccionar</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Servicio</label>
                <select className="w-full border p-2 rounded" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
                  <option value="">Seleccionar</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Cantidad</label>
                <input type="number" className="w-full border p-2 rounded" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Rango</label>
                  <select className="w-full border p-2 rounded" value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: parseInt(e.target.value) })}>
                    <option value="">Seleccionar</option>
                    {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cantidad</label>
                  <input type="number" className="w-full border p-2 rounded" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Precio</label>
                  {currentSubtotal  !== null ? (
                    <div className="border p-2 rounded bg-white">{currentSubtotal } PEN</div>
                  ) : (
                    <div className="text-sm text-gray-400 italic">Completa los campos para calcular</div>
                  )}
                </div>

              </div>

              <button
                onClick={handleAddDetail}
                disabled={!currentUnitPrice || !currentSubtotal}
                className={`w-full py-2 rounded transition-colors ${
                  !currentUnitPrice || !currentSubtotal
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Agregar
              </button>

            </div>

            <div className="space-y-2">
              {details.map((d, i) => (
                <div key={i} className="border p-2 rounded bg-white shadow-sm flex justify-between items-center">
                  <span>
                    {services.find(s => s.id == d.service_id)?.name} × {d.quantity} (
                    {units.find(u => u.id == d.unit_id)?.name} × {d.duration})
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{d.price} PEN</span>
                    <button
                      onClick={() => handleRemoveDetail(i)}
                      className="text-red-500 hover:text-red-700 font-bold"
                      title="Eliminar"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

            </div>

                        {/* Total y botón */}
            <div className="flex items-center justify-between mt-6">
              <div className="border border-blue-500 text-blue-700 px-4 py-2 rounded text-xl font-bold">
                Total: {total} PEN
              </div>
              <button
                onClick={() => setShowPreview(true)}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Solicitar
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
