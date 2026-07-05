// app/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPortalPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Form inputs
    const [formData, setFormData] = useState({ name: "", email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Password Validation States
    const hasLength = formData.password.length >= 8;
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecial = /[@$!%*?&]/.test(formData.password);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (data.success && data.user) {
                    setCurrentUser(data.user);
                }
            } catch (err) {
                console.error("Auth verify error", err);
            } finally {
                setCheckingAuth(false);
            }
        };
        checkAuth();
    }, []);

    const validatePassword = (pass) => {
        const hasUpperCase = /[A-Z]/.test(pass);
        const hasNumber = /[0-9]/.test(pass);
        const hasSpecialChar = /[@$!%*?&]/.test(pass);
        return pass.length >= 8 && hasUpperCase && hasNumber && hasSpecialChar;
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setLoading(true);

        if (!isLogin && !validatePassword(formData.password)) {
            setError("Password requirements: 8+ chars, 1 uppercase, 1 number, and 1 special character (@$!%*?&).");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                // Login Flow
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: formData.email, password: formData.password }),
                });
                const data = await res.json();
                if (data.success) {
                    setSuccessMsg("Login successful! Redirecting to workspace...");
                    setTimeout(() => {
                        router.push("/dashboard");
                        router.refresh();
                    }, 1500);
                } else {
                    setError(data.message || "Invalid email or password configuration.");
                }
            } else {
                // Signup Flow
                const res = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                const data = await res.json();
                if (data.success) {
                    setSuccessMsg("Account successfully built! Switching to login...");
                    setTimeout(() => {
                        setIsLogin(true);
                        setError("");
                        setSuccessMsg("");
                    }, 2000);
                } else {
                    setError(data.message || "Registration rejected.");
                }
            }
        } catch (err) {
            setError("Auth connection timeout or endpoint error.");
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-blue-50 to-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                        {/* Outer spinning ring */}
                        <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-[#00adef] animate-spin"></div>
                        {/* Inner pulsing node */}
                        <div className="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                            <div className="w-3.5 h-3.5 bg-[#007cd1] rounded-full"></div>
                        </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#007cd1] animate-pulse">
                        Synchronizing Secure Terminal...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-blue-50 to-white flex items-center justify-center px-4 py-8 relative overflow-hidden">
            {/* Concentric rings background layer (Light-themed) */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 pointer-events-none">
                <div className="w-[800px] h-[800px] border border-blue-500/5 rounded-full flex items-center justify-center animate-[spin_120s_linear_infinite]">
                    <div className="w-[600px] h-[600px] border border-indigo-500/5 rounded-full flex items-center justify-center">
                        <div className="w-[400px] h-[400px] border border-blue-500/5 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Design Concept: Layered card effect inspired by Image 1 */}
            <div className="relative w-full max-w-[420px] mx-auto my-8">
                {/* Underlay Card 1 (Cyan/Light Blue - tilted counter-clockwise) */}
                <div className="absolute inset-0 bg-[#00adef] rounded-[40px] transform -rotate-3 translate-x-[-8px] translate-y-[-6px] shadow-lg opacity-90 pointer-events-none"></div>
                
                {/* Underlay Card 2 (Deep Blue - tilted clockwise) */}
                <div className="absolute inset-0 bg-[#007cd1] rounded-[40px] transform rotate-2 translate-x-[8px] translate-y-[6px] shadow-lg opacity-95 pointer-events-none"></div>

                {/* Main Auth Panel (Pure White Rounded Card) */}
                <div className="relative z-10 bg-white p-8 md:p-10 rounded-[40px] shadow-xl space-y-6 flex flex-col justify-between border border-slate-100">
                    
                    {/* Logo & Header */}
                    <div className="text-center space-y-2 pt-2">
                        <div className="inline-flex items-center gap-2 text-[#004f95] font-extrabold text-2xl tracking-wide uppercase">
                            Personal Secure Vault
                        </div>
                        {currentUser ? (
                            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">
                                Welcome Back!
                            </p>
                        ) : (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {isLogin ? "Welcome Back!" : "Initialize Vault ID"}
                            </p>
                        )}
                    </div>

                    {/* Logged in state */}
                    {currentUser ? (
                        <div className="space-y-6 text-center py-6">
                            <div className="p-4 bg-slate-50 border border-gray-100 rounded-2xl">
                                <p className="text-xs text-gray-450 font-bold uppercase tracking-wider">Signed in as:</p>
                                <p className="text-sm font-black text-gray-800 mt-1">{currentUser.name}</p>
                                <p className="text-[10px] text-gray-500 font-semibold">{currentUser.email}</p>
                            </div>
                            
                            <Link
                                href="/dashboard"
                                className="block w-full bg-[#00adef] hover:bg-[#0089e0] text-white font-extrabold text-xs py-4 rounded-2xl uppercase tracking-widest transition duration-300 shadow-md text-center"
                            >
                                Enter Secure Dashboard
                            </Link>
                        </div>
                    ) : (
                        // Logged out / Form state
                        <>
                            {/* Tab Switcher */}
                            <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200/50 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => { setIsLogin(true); setError(""); setSuccessMsg(""); }}
                                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
                                        isLogin ? "bg-white text-[#007cd1] shadow-sm" : "text-gray-400 hover:text-gray-600"
                                    }`}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsLogin(false); setError(""); setSuccessMsg(""); }}
                                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
                                        !isLogin ? "bg-white text-[#007cd1] shadow-sm" : "text-gray-400 hover:text-gray-600"
                                    }`}
                                >
                                    Sign Up
                                </button>
                            </div>

                            {/* Status Messages */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold text-center leading-relaxed">
                                    {error}
                                </div>
                            )}
                            {successMsg && (
                                <div className="p-3 bg-green-50 border border-green-100 text-green-600 rounded-xl text-xs font-semibold text-center">
                                    {successMsg}
                                </div>
                            )}

                            {/* Form Elements */}
                            <form onSubmit={handleAuthSubmit} className="space-y-6">
                                {!isLogin && (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            placeholder="Full Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-transparent border-b-2 border-slate-250 py-3 px-1 text-sm font-semibold text-slate-800 placeholder-gray-400 focus:outline-none focus:border-[#00adef] transition duration-300"
                                        />
                                    </div>
                                )}

                                <div>
                                    <input
                                        type="email"
                                        required
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-transparent border-b-2 border-slate-250 py-3 px-1 text-sm font-semibold text-slate-800 placeholder-gray-400 focus:outline-none focus:border-[#00adef] transition duration-300"
                                    />
                                </div>

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-transparent border-b-2 border-slate-250 py-3 pl-1 pr-10 text-sm font-semibold text-slate-800 placeholder-gray-400 focus:outline-none focus:border-[#00adef] transition duration-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                        title={showPassword ? "Hide Password" : "Show Password"}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Password requirements checker list (Visible during sign up when typing) */}
                                {!isLogin && formData.password.length > 0 && (
                                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl space-y-1.5 text-left">
                                        <p className="text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">Password Requirements Check:</p>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-bold">
                                            <div className={`flex items-center gap-1.5 ${hasLength ? "text-green-600" : "text-gray-400"}`}>
                                                <span>{hasLength ? "✓" : "○"}</span> 8+ Characters
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-green-600" : "text-gray-400"}`}>
                                                <span>{hasUppercase ? "✓" : "○"}</span> Uppercase Letter
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${hasLowercase ? "text-green-600" : "text-gray-400"}`}>
                                                <span>{hasLowercase ? "✓" : "○"}</span> Lowercase Letter
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${hasNumber ? "text-green-600" : "text-gray-400"}`}>
                                                <span>{hasNumber ? "✓" : "○"}</span> Number (0-9)
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-green-600" : "text-gray-400"}`}>
                                                <span>{hasSpecial ? "✓" : "○"}</span> Special (@$!%*?&)
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#00adef] hover:bg-[#0089e0] text-white font-extrabold text-xs py-4 rounded-2xl uppercase tracking-widest transition duration-300 shadow-md disabled:opacity-50"
                                >
                                    {loading ? "Processing..." : isLogin ? "Login" : "Register"}
                                </button>
                            </form>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}