import { useState, useRef } from "react";
import api from "../utils/api";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Home() {
    const [destination, setDestination] = useState("");
    const [plan, setPlan] = useState(null);
    const [days, setDays] = useState(3);
    const [daysError, setDaysError] = useState("");
    const [style, setStyle] = useState("normal");
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeDay, setActiveDay] = useState(1);
    const [loadingDay, setLoadingDay] = useState(null);
    const [saved, setSaved] = useState(false);
    const timeoutRef = useRef(null);
    const navigate = useNavigate();

    const isValidDestination = (value) => {
        const trimmed = value.trim();

        // at least 3 characters
        if (trimmed.length < 3) return false;

        // only letters + spaces (no numbers/symbols)
        const regex = /^[a-zA-Z\s,.'-]+$/;

        return regex.test(trimmed);
    };

    const handleDaysChange = (value) => {
        let newDays = Number(value);

        clearTimeout(timeoutRef.current);

        if (newDays > 10) {
            setDays(10);
            setDaysError("Max 10 days");
        } else if (newDays < 1) {
            setDays(1);
            setDaysError("Minimum is 1 day");
        } else {
            setDays(newDays);
            setDaysError("");
        }

        timeoutRef.current = setTimeout(() => {
            setDaysError("");
        }, 2000);
    };

    const goPrevDay = () => {
        setActiveDay((prev) => Math.max(1, prev - 1));
    };

    const goNextDay = () => {
        if (!plan?.days) return;
        setActiveDay((prev) => Math.min(plan.days.length, prev + 1));
    };

    const regenerateDay = async (dayNumber) => {
        setLoadingDay(dayNumber);

        try {
            const res = await api.post("/regenerate-day", {
                destination,
                style,
                interests,
                dayNumber,
            });

            const updatedDay = res.data.day;

            setPlan((prev) => {
                const newDays = prev.days.map((d) =>
                    d.day === dayNumber ? updatedDay : d
                );

                return { ...prev, days: newDays };
            });
        } catch (err) {
            console.log(err);
            toast.error("Failed to regenerate day, try again!");
        } finally {
            setLoadingDay(null);
        }
    };

    const handleClick = async () => {
        if (!isValidDestination(destination)) {
            setError("Please enter a valid destination");
            return;
        }

        if (interests.length === 0) {
            setError("Select at least one interest");
            return;
        }

        setLoading(true);
        setError("");
        setPlan(null);
        setActiveDay(1);

        try {
            const res = await api.post("/plan", {
                destination,
                days,
                style,
                interests,
            });

            if (res.data.error) {
                setError(res.data.error);
                setPlan(null);
            } else {
                setPlan(res.data.plan);
                setActiveDay(1);
                setSaved(false);
            }
        } catch (err) {
            console.log(err);
            setError("Server error or backend not running");
        } finally {
            setLoading(false);
        }
    };

    const interestOptions = [
        { label: "food", icon: "🍜" },
        { label: "culture", icon: "🏛" },
        { label: "nature", icon: "🌿" },
        { label: "nightlife", icon: "🌃" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-100 to-indigo-200 flex flex-col items-center p-6">
            <div className="w-full max-w-5xl flex justify-between items-center mb-6">

                {/* LEFT: Brand / title small */}
                <div className="text-lg font-bold text-gray-700">
                    ✈️ TripGenei
                </div>

                {/* RIGHT: actions */}
                <div className="flex items-center gap-4">

                    {/* Saved Plans */}
                    <button
                        onClick={() => navigate("/saved")}
                        className="px-4 py-2 rounded-full
                 bg-white/70 backdrop-blur-md
                 text-gray-700 font-medium
                 shadow-sm hover:shadow-md
                 hover:scale-105 active:scale-95
                 transition-all duration-200
                 border border-white/40
                 flex items-center gap-2"
                    >
                        📝 My plans
                    </button>

                    {/* Logout */}
                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            toast("Logged out 👋");
                            navigate("/login");
                        }}
                        className="px-4 py-2 rounded-full
                 bg-red-500 text-white font-medium
                 shadow-sm hover:shadow-lg
                 hover:scale-105 active:scale-95
                 transition-all duration-200
                 flex items-center gap-2"
                    >
                        🚪 Logout
                    </button>

                </div>
            </div>

            {/* TITLE */}
            <h1 className="text-5xl font-extrabold mb-6 text-gray-800 tracking-tight text-center">
                TripGenei AI 🌍
            </h1>

            {/* INPUT BOX */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg w-full max-w-md border border-white/40 space-y-4">

                <div className="mt-2 text-center text-gray-600 space-y-2">
                    <p className="text-xl">🌍 Ready for your next adventure?</p>
                    <p className="text-sm">
                        Try destinations like <span className="font-semibold">Japan</span>,{" "}
                        <span className="font-semibold">Bangkok</span>, or{" "}
                        <span className="font-semibold">Thailand</span>
                    </p>
                </div>
                {/* DESTINATION */}
                <input
                    className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 ${destination && !isValidDestination(destination)
                        ? "border-red-400 focus:ring-red-300"
                        : "border-gray-200 focus:ring-sky-400"
                        }`}
                    placeholder="🌍 Destination (e.g. Bangkok)"
                    onChange={(e) => setDestination(e.target.value)}
                />

                {/* DAYS */}
                <div>
                    <label className="text-sm text-gray-600">Days</label>

                    <input
                        type="number"
                        value={days}
                        onChange={(e) => handleDaysChange(e.target.value)}
                        className={`w-full border p-3 rounded-lg focus:ring-2 ${daysError
                            ? "border-red-400 focus:ring-red-300"
                            : "border-gray-200 focus:ring-sky-400"
                            }`}
                    />

                    {daysError && (
                        <p className="text-red-500 text-sm mt-1 animate-pulse">
                            {daysError}
                        </p>
                    )}
                </div>

                {/* STYLE */}
                <div>
                    <label className="text-sm text-gray-600">Travel Style</label>
                    <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-400"
                    >
                        <option value="normal">Normal</option>
                        <option value="budget">Budget 💸</option>
                        <option value="luxury">Luxury ✨</option>
                    </select>
                </div>

                {/* INTERESTS */}
                <div className="flex flex-wrap gap-3">
                    {interestOptions.map(({ label, icon }) => {
                        const active = interests.includes(label);

                        return (
                            <button
                                key={label}
                                onClick={() => {
                                    if (active) {
                                        setInterests(interests.filter((i) => i !== label));
                                    } else {
                                        setInterests([...interests, label]);
                                    }
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200
                                ${active
                                        ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md scale-105"
                                        : "bg-white text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                <span>{icon}</span>
                                <span className="capitalize">{label}</span>
                            </button>
                        );
                    })}
                </div>
                {/* GENERATE BUTTON */}
                <button
                    className="relative w-full py-4 rounded-xl font-semibold text-lg text-white
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500
  shadow-lg hover:shadow-2xl
  transition-all duration-300
  hover:scale-[1.02] active:scale-[0.98]
  overflow-hidden"
                    onClick={handleClick}
                    disabled={loading}
                >
                    {/* Glow effect */}
                    <span className="absolute inset-0 bg-white/20 blur-xl opacity-0 hover:opacity-100 transition"></span>

                    {/* Content */}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Creating Magic...
                            </>
                        ) : (
                            <>
                                ✨ Generate My Trip
                            </>
                        )}
                    </span>
                </button>
            </div>

            {/* ERROR STATE */}
            {error && (
                <div className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-lg shadow">
                    ⚠️ {error}
                </div>
            )}

            {/* LOADING STATE */}
            {loading && (
                <>
                    <div className="mt-6 text-gray-600 animate-pulse">
                        Creating your itinerary... ✨
                    </div>
                    <div className="mt-6 w-full max-w-3xl space-y-4 animate-pulse">
                        <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                        <div className="h-20 bg-gray-300 rounded"></div>
                        <div className="h-20 bg-gray-300 rounded"></div>
                    </div>
                </>
            )}

            {/* EMPTY STATE */}
            {!loading && !plan && !error && (
                <div className="mt-6 text-gray-600">
                    Enter a destination to generate a travel plan
                </div>
            )}

            {/* PLAN DISPLAY */}
            {plan?.days && (
                <div className="flex gap-2 mt-6 flex-wrap justify-center">
                    {plan.days.map((day) => (
                        <motion.button
                            key={day.day}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setActiveDay(day.day)}
                            className={`px-4 py-2 rounded-full font-medium transition ${activeDay === day.day
                                ? "bg-indigo-500 text-white shadow"
                                : "bg-white text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            Day {day.day}
                        </motion.button>
                    ))}
                </div>
            )}

            {plan?.days
                ?.filter((d) => d.day === activeDay)
                .map((day) => (
                    <motion.div
                        key={activeDay}
                        initial={{ opacity: 0, x: 30, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="relative w-full max-w-3xl bg-white/80 backdrop-blur-xl
rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)]
border border-white/40 mt-6 overflow-visible flex flex-col min-h-[520px]"
                    >
                        <button
                            onClick={goPrevDay}
                            disabled={activeDay === 1}
                            className="absolute left-[-18px] top-1/2 -translate-y-1/2 z-10
                                        w-14 h-14 rounded-full
                                        bg-white/80 backdrop-blur-md
                                        shadow-lg border border-white/40
                                        flex items-center justify-center
                                        text-2xl font-bold
                                        hover:scale-110 hover:bg-white transition
                                        disabled:opacity-30 disabled:scale-100"
                        >
                            ‹
                        </button>
                        <button
                            onClick={goNextDay}
                            disabled={activeDay === plan.days.length}
                            className="absolute right-[-18px] top-1/2 -translate-y-1/2 z-10
                                        w-14 h-14 rounded-full
                                        bg-white/80 backdrop-blur-md
                                        shadow-lg border border-white/40
                                        flex items-center justify-center
                                        text-2xl font-bold
                                        hover:scale-110 hover:bg-white transition
                                        disabled:opacity-30 disabled:scale-100"
                        >
                            ›
                        </button>
                        {/* IMAGE */}
                        {day.image && (
                            <div className="relative h-56 w-full overflow-hidden">
                                <img
                                    src={day.image}
                                    onError={(e) => {
                                        e.target.src = `https://picsum.photos/seed/${destination}/800/500`;
                                    }}
                                    className="w-full h-full object-cover transition duration-500 hover:scale-105"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                <h2 className="absolute bottom-4 left-6 text-white text-3xl font-bold tracking-wide">
                                    Day {day.day}
                                </h2>
                            </div>
                        )}

                        {/* CONTENT */}
                        <div className="p-8 px-12 space-y-6 flex-1
bg-gradient-to-b from-white/70 to-white/40">
                            <div>
                                <p className="font-semibold text-xl">🌅 Morning</p>
                                <ul className="space-y-1">
                                    {day.morning.map((item, i) => (
                                        <li key={i} className="bg-gray-50 px-3 py-2 rounded-lg text-lg line-clamp-2 transition hover:bg-gray-100 hover:scale-[1.01]">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <p className="font-semibold text-xl">🌞 Afternoon</p>
                                <ul className="space-y-1">
                                    {day.afternoon.map((item, i) => (
                                        <li key={i} className="bg-gray-50 px-3 py-2 rounded-lg text-lg line-clamp-2 transition hover:bg-gray-100 hover:scale-[1.01]">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <p className="font-semibold text-xl">🌙 Evening</p>
                                <ul className="space-y-1">
                                    {day.evening.map((item, i) => (
                                        <li key={i} className="bg-gray-50 px-3 py-2 rounded-lg text-lg line-clamp-2 transition hover:bg-gray-100 hover:scale-[1.01]">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="flex justify-center mt-6 mb-4">
                            <button
                                onClick={() => regenerateDay(day.day)}
                                disabled={loadingDay === day.day}
                                className="text-md px-7 py-3 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 text-white shadow-md hover:shadow-lg hover:scale-105 transition flex items-center gap-2"
                            >
                                {loadingDay === day.day ? (
                                    <span className="flex items-center gap-2">
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            Refreshing...
                                        </>
                                    </span>
                                ) : (
                                    "🔄 Regenerate Day"
                                )}
                            </button>
                        </div>
                    </motion.div>
                ))}
            {plan && (
                <div className="w-full max-w-2xl mt-6 flex justify-center">
                    <button
                        disabled={saved}
                        onClick={async () => {
                            try {
                                await api.post("/save-plan", {
                                    destination,
                                    days: plan.days,
                                    style,
                                    interests,
                                });

                                toast.success("Trip saved successfully 💾");
                                setSaved(true);
                            } catch (err) {
                                console.log(err);
                                toast.error("❌ Failed to save");
                            }
                        }}
                        className="px-6 py-3 rounded-full
                                    bg-gradient-to-r from-green-400 to-emerald-500
                                    text-white font-semibold text-lg
                                    shadow-xl hover:shadow-2xl
                                    hover:scale-105 active:scale-95
                                    transition-all duration-300"
                    >
                        {saved ? "✅ Saved!" : "💾 Save Plan"}
                    </button>
                </div>
            )}
        </div>

    );
}

export default Home;