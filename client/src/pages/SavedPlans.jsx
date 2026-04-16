import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

function SavedPlans() {
    const [plans, setPlans] = useState([]);
    const [selected, setSelected] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        api
            .get("/plans")
            .then((res) => setPlans(res.data.plans))
            .catch((err) => {
                console.log(err);
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/login");
                } else {
                    setFetchError("Failed to load your plans. Please try again later.");
                }
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    const confirmDelete = async () => {
        try {
            await api.delete(`/plans/${deleteTarget._id}`);

            setPlans((prev) =>
                prev.filter((p) => p._id !== deleteTarget._id)
            );

            setDeleteTarget(null);
        } catch (err) {
            console.log(err);
            alert("Failed to delete");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-100 to-indigo-200 p-6">

            <button
                onClick={() => navigate("/")}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
                🏠 Home
            </button>

            {/* HEADER */}
            <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-6">
                📂 Saved Trips
            </h1>

            {/* BACK BUTTON */}
            {selected && (
                <button
                    onClick={() => setSelected(null)}
                    className="mb-6 px-4 py-2 bg-white/70 backdrop-blur rounded-lg shadow hover:bg-white transition"
                >
                    ← Back
                </button>
            )}

            {loading && (
                <div className="text-center mt-10 text-gray-600 animate-pulse">
                    Loading your trips... ✈️
                </div>
            )}
            {fetchError && (
                <div className="text-center mt-10 text-red-500">
                    ⚠️ {fetchError}
                </div>
            )}

            {/* LIST VIEW */}
            {!selected && (
                <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan._id}
                            onClick={() => setSelected(plan)}
                            className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-5 cursor-pointer hover:scale-[1.02] transition border border-white/40"
                        >
                            <h2 className="text-xl font-bold text-gray-800">
                                📍 {plan.destination}
                            </h2>

                            <p className="text-gray-600 mt-1">
                                {plan.days.length} days • {plan.style}
                            </p>

                            <p className="text-sm text-gray-500 mt-2">
                                Click to view full itinerary →
                            </p>
                            {/* Delete Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(plan);
                                }}
                                className="absolute top-3 right-3
  bg-white/80 backdrop-blur-md
  text-red-500
  w-8 h-8 rounded-full
  flex items-center justify-center
  shadow hover:bg-red-500 hover:text-white
  transition-all duration-200"
                            >
                                🗑
                            </button>
                        </div>

                    ))}
                </div>
            )}


            {!loading && plans.length === 0 && (
                <div className="text-center mt-10 text-gray-600">
                    <p className="text-2xl">📭 No saved trips yet</p>
                    <p className="text-md mt-2">
                        Generate and save your first adventure!
                    </p>
                </div>
            )}


            {/* FULL PLAN VIEW */}
            {selected && (
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* HERO */}
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6">
                        <h2 className="text-3xl font-bold text-gray-800">
                            {selected.destination}
                        </h2>
                        <p className="text-gray-600">
                            {selected.days.length} days • {selected.style}
                        </p>
                    </div>

                    {/* DAYS */}
                    {selected.days.map((day) => (
                        <div
                            key={day.day}
                            className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden"
                        >

                            {/* IMAGE (safe fallback) */}
                            <div className="h-40 bg-gray-200 relative">
                                {day.image ? (
                                    <img
                                        src={day.image}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        🌍 No image available
                                    </div>
                                )}

                                <div className="absolute bottom-2 left-4 text-white font-bold text-xl drop-shadow">
                                    Day {day.day}
                                </div>
                            </div>

                            {/* CONTENT */}
                            <div className="p-5 space-y-3">

                                <div>
                                    <p className="font-semibold">🌅 Morning</p>
                                    <ul className="text-gray-600 text-md space-y-1 mt-1">
                                        {day.morning.map((item, i) => (
                                            <li key={i}>• {item}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <p className="font-semibold">🌞 Afternoon</p>
                                    <ul className="text-gray-600 text-md space-y-1 mt-1">
                                        {day.afternoon.map((item, i) => (
                                            <li key={i}>• {item}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <p className="font-semibold">🌙 Evening</p>
                                    <ul className="text-gray-600 text-md space-y-1 mt-1">
                                        {day.evening.map((item, i) => (
                                            <li key={i}>• {item}</li>
                                        ))}
                                    </ul>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>

            )}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

                    <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm shadow-xl">

                        <h2 className="text-xl font-bold text-gray-800">
                            Delete Plan?
                        </h2>

                        <p className="text-gray-600 mt-2">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold">
                                {deleteTarget.destination}
                            </span>
                            <span>  </span>plan?
                        </p>

                        <div className="flex justify-end gap-3 mt-6">

                            {/* CANCEL */}
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                            >
                                Cancel
                            </button>

                            {/* DELETE */}
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                            >
                                Delete
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>


    );
}

export default SavedPlans;