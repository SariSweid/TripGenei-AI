import { useState } from "react";
import api from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async () => {
        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/register", { email, password });

            if (res.data.error) {
                toast.error(res.data.error);
            } else {
                toast.success("Account created 🎉"); navigate("/login");
            }
        } catch (err) {
            if (err.response?.data?.error) {
                toast.error(err.response.data.error);
            } else {
                toast.error("Register failed");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-200">

            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4">

                <h2 className="text-3xl font-bold text-center">Create Account ✨</h2>

                <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-lg border"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 rounded-lg border"
                />

                <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            Registering...
                        </>
                    ) : (
                        "Register"
                    )}
                </button>

                <p className="text-center text-sm">
                    Already have an account?{" "}
                    <Link to="/login" className="text-indigo-600 font-semibold">
                        Login
                    </Link>
                </p>

            </div>
        </div>
    );
}

export default Register;