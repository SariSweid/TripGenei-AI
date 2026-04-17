import { useState } from "react";
import api from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);

        try {
            const res = await api.post("/login", { email, password });

            if (res.data.error) {
                toast.error(res.data.error);
            } else {
                localStorage.setItem("token", res.data.token);

                // notify App.jsx that auth changed
                window.dispatchEvent(new Event("storage"));
                toast.success("Logged in successfully 👌");

                navigate("/");
            }
        } catch (err) {
            if (err.response?.data?.error) {
                toast.error(err.response.data.error);
            } else {
                toast.error("Login failed");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-200">

            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4">

                <h2 className="text-3xl font-bold text-center">Log in</h2>

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
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            Logging in...
                        </>
                    ) : (
                        "Login"
                    )}
                </button>

                <p className="text-center text-sm">
                    Don’t have an account?{" "}
                    <Link to="/register" className="text-indigo-600 font-semibold">
                        Register
                    </Link>
                </p>

            </div>
        </div>
    );
}

export default Login;