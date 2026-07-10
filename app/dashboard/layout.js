// app/dashboard/layout.js
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardLayout({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const router = useRouter();
    
    const [currentPath, setCurrentPath] = useState("");
    const [isChatActive, setIsChatActive] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const checkLocation = () => {
                setCurrentPath(window.location.pathname);
                setIsChatActive(window.location.search.includes("chat=true"));
            };
            checkLocation();
            
            window.addEventListener("popstate", checkLocation);
            const interval = setInterval(checkLocation, 200);
            return () => {
                window.removeEventListener("popstate", checkLocation);
                clearInterval(interval);
            };
        }
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (data.success && data.user) {
                    setCurrentUser(data.user);
                }
            } catch (err) {
                console.error("Layout auth fetch error", err);
            }
        };
        fetchUser();
    }, []);

    // Auto-close profile dropdown after 3 seconds
    useEffect(() => {
        let timer;
        if (dropdownOpen) {
            timer = setTimeout(() => {
                setDropdownOpen(false);
            }, 3000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [dropdownOpen]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const res = await fetch("/api/auth/logout", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            console.error("Logout process error", err);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navbar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-150 py-3.5 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo & Brand */}
                    <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00adef] to-[#007cd1] text-white flex items-center justify-center font-black text-sm shadow-sm transition group-hover:scale-105">
                            V
                        </div>
                        <span className="font-black text-xs uppercase text-gray-900 tracking-wider hidden sm:inline-block">
                            Personal Secure Vault
                        </span>
                        <span className="font-black text-xs uppercase text-gray-900 tracking-wider sm:hidden">
                            PSV
                        </span>
                    </Link>
 
                    {/* Navigation Menu & Profile Dropdown */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href="/dashboard"
                            className={`text-xs font-bold transition px-3.5 py-2 rounded-xl whitespace-nowrap shadow-sm border ${
                                currentPath === "/dashboard" && !isChatActive
                                    ? "text-[#007cd1] bg-blue-50/40 hover:bg-blue-50 border-blue-200/50"
                                    : "text-gray-700 bg-gray-100 hover:bg-gray-200 border-transparent"
                            }`}
                        >
                            Upload
                        </Link>
                        <Link
                            href="/dashboard?chat=true"
                            className={`lg:hidden text-xs font-bold transition px-3.5 py-2 rounded-xl whitespace-nowrap shadow-sm border ${
                                currentPath === "/dashboard" && isChatActive
                                    ? "text-[#007cd1] bg-blue-50/40 hover:bg-blue-50 border-blue-200/50"
                                    : "text-gray-700 bg-gray-100 hover:bg-gray-200 border-transparent"
                            }`}
                        >
                            AI Chat
                        </Link>
                        <Link
                            href="/dashboard/documents"
                            className={`text-xs font-bold transition px-3.5 py-2 rounded-xl whitespace-nowrap shadow-sm border ${
                                currentPath.startsWith("/dashboard/documents")
                                    ? "text-[#007cd1] bg-blue-50/40 hover:bg-blue-50 border-blue-200/50"
                                    : "text-gray-700 bg-gray-100 hover:bg-gray-200 border-transparent"
                            }`}
                        >
                            <span className="hidden sm:inline">Saved All Documents</span>
                            <span className="sm:hidden">Records</span>
                        </Link>
 
                        {/* Profile Dropdown Trigger */}
                        {currentUser && (
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00adef] to-[#007cd1] text-white flex items-center justify-center font-bold text-xs border border-blue-200/50 cursor-pointer shadow-sm hover:scale-105 transition duration-350 outline-none"
                                >
                                    {currentUser.name?.[0]?.toUpperCase() || "U"}
                                </button>

                                {dropdownOpen && (
                                    <>
                                        {/* Click outside backdrop */}
                                        <div 
                                            className="fixed inset-0 z-40 bg-transparent" 
                                            onClick={() => setDropdownOpen(false)}
                                        />
                                        
                                        {/* Dropdown Card */}
                                        <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100/70 rounded-2xl shadow-lg shadow-gray-200/30 z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {/* Profile Info Details (Pure Minimalist Black/White) */}
                                            <div className="pb-3 border-b border-gray-100">
                                                <p className="text-sm font-semibold text-gray-900 truncate tracking-tight">{currentUser.name}</p>
                                                <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">{currentUser.email}</p>
                                            </div>

                                            {/* Action Options (No Emojis, Pure Minimalist Black/White) */}
                                            <div className="space-y-1">
                                                <button
                                                    onClick={() => {
                                                        setDropdownOpen(false);
                                                        router.push("/dashboard?chat=true");
                                                    }}
                                                    className="w-full text-left flex items-center px-3 py-2 rounded-xl hover:bg-gray-50 text-xs font-medium text-gray-700 hover:text-gray-950 transition outline-none"
                                                >
                                                    Help Center
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setDropdownOpen(false);
                                                        handleLogout();
                                                    }}
                                                    className="w-full text-left flex items-center px-3 py-2 rounded-xl hover:bg-red-50 text-xs font-medium text-red-600 hover:text-red-700 transition outline-none"
                                                >
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Workspace viewport */}
            <main className="flex-1 py-4 px-2 sm:py-10 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}