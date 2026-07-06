// app/dashboard/documents/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DocumentsCatalogPage() {
    const [documents, setDocuments] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuthAndLoad = async () => {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (data.success && data.user) {
                    setCurrentUser(data.user);
                    await fetchUserDocuments();
                } else {
                    window.location.href = "/login";
                }
            } catch (err) {
                console.error("Auth validation failed", err);
                window.location.href = "/login";
            } finally {
                setLoading(false);
            }
        };
        checkAuthAndLoad();
    }, []);

    useEffect(() => {
        if (documents.length > 0 && typeof window !== "undefined" && window.location.hash) {
            const targetId = window.location.hash.substring(1);
            const element = document.getElementById(targetId);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                    element.classList.add("ring-4", "ring-blue-500/30", "border-blue-400");
                    setTimeout(() => {
                        element.classList.remove("ring-4", "ring-blue-500/30", "border-blue-400");
                    }, 4000);
                }, 600);
            }
        }
    }, [documents]);

    const fetchUserDocuments = async () => {
        try {
            const res = await fetch("/api/documents");
            const data = await res.json();
            if (data.success) {
                setDocuments(data.documents);
            }
        } catch (err) {
            console.error("Failed to load documents", err);
        }
    };

    const handleDelete = async (docId) => {
        if (!confirm("Bhai, kya aap waqai is document ko permanently delete karna chahte hain?")) {
            return;
        }

        try {
            const res = await fetch(`/api/documents?id=${docId}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = "/dashboard?deleted=true";
            } else {
                alert(data.message || "Failed to delete document.");
            }
        } catch (err) {
            console.error("Delete handler error:", err);
            alert("Connection error: Failed to contact delete server.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6]">
                <div className="text-xs font-black uppercase tracking-widest text-gray-500 animate-pulse">
                    Synchronizing secure library...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Back to Dashboard Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-[#004f95] tracking-tight uppercase">Saved Document Records</h1>
                        <p className="text-[10px] sm:text-xs text-[#007cd1] font-extrabold uppercase tracking-widest mt-1">
                            Vault Index: {currentUser?.name}
                        </p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="hidden sm:inline-block text-xs font-bold text-[#007cd1] bg-blue-50/40 hover:bg-blue-50 border border-blue-200/50 transition px-6 py-3 rounded-2xl uppercase tracking-wider shadow-sm self-start sm:self-auto"
                    >
                        ← Back to Panel
                    </Link>
                </div>

                {documents.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-[32px] border border-slate-150 shadow-sm space-y-4">
                        <span className="text-4xl">🗄️</span>
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Vault Workspace is Empty</h3>
                        <p className="text-xs text-gray-450 max-w-xs mx-auto leading-relaxed">
                            No documents have been saved under your user credentials yet. Use the upload panel to commit files.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {documents.map((doc) => (
                            <div key={doc._id} id={doc._id} className="relative bg-white border border-slate-100 rounded-[32px] shadow-lg flex flex-col md:flex-row md:gap-6 md:p-6 p-0 items-stretch md:items-start overflow-hidden min-h-[400px] md:min-h-0 transition duration-300 hover:shadow-xl hover:border-blue-200/55">
                                
                                {/* Left Side: Thumbnail Preview. On mobile, it covers the entire card background! */}
                                <div 
                                    onClick={() => window.open(doc.fileUrl, '_blank')}
                                    className="absolute inset-0 md:relative md:w-[220px] md:h-[220px] md:rounded-3xl overflow-hidden shrink-0 bg-gradient-to-tr from-blue-50 to-purple-50 flex items-center justify-center cursor-pointer group shadow-sm md:hover:shadow-md transition duration-300 z-0"
                                >
                                    {doc.fileType === "image" ? (
                                        <img
                                            src={doc.fileUrl}
                                            alt={doc.title}
                                            className="w-full h-full object-cover md:rounded-3xl group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center space-y-2 text-center p-4 w-full h-full md:rounded-3xl bg-gradient-to-br from-indigo-950 via-gray-900 to-black text-white">
                                            <span className="text-5xl md:text-4xl">📄</span>
                                            <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{doc.fileType}</span>
                                        </div>
                                    )}
                                    {/* Dark gradient overlay for mobile view to ensure text contrast */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent md:hidden" />
                                </div>

                                {/* Right Side: Details. On mobile, it overlays at the bottom! */}
                                <div className="relative z-10 flex-1 flex flex-col justify-end md:justify-between h-full md:self-stretch p-6 md:p-0 mt-auto md:mt-0 text-white md:text-gray-900">
                                    <div className="space-y-1.5 md:space-y-2">
                                        <h2 className="text-xl md:text-xl font-black uppercase tracking-tight text-white md:text-[#004f95]">{doc.title}</h2>
                                        <p className="text-[9px] md:text-[10px] text-blue-400 md:text-[#007cd1] font-extrabold uppercase tracking-widest">
                                            Secure Asset Node • {doc.fileType}
                                        </p>
                                        
                                        {doc.description && (
                                            <p className="text-xs text-gray-300 md:text-gray-500 font-medium leading-relaxed max-w-md">
                                                {doc.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-4 mt-4 md:mt-0">
                                        {/* Tags */}
                                        {doc.tags && doc.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 justify-start">
                                                {doc.tags.map((tag, idx) => (
                                                    <span key={idx} className="bg-[#00adef]/10 md:bg-blue-50 text-[#007cd1] px-3.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center justify-start gap-3 pt-1 w-full">
                                            <Link
                                                href={`/dashboard/documents/view?url=${encodeURIComponent(doc.fileUrl)}&title=${encodeURIComponent(doc.title)}&type=${doc.fileType}`}
                                                className="bg-white md:bg-gradient-to-r md:from-[#00adef] md:to-[#007cd1] text-gray-900 md:text-white hover:bg-gray-100 md:hover:opacity-90 text-xs font-bold px-6 py-3.5 rounded-full uppercase tracking-wider transition shadow-md flex-1 md:flex-initial text-center cursor-pointer"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                href={`/dashboard?edit=true&id=${doc._id}&title=${encodeURIComponent(doc.title)}&description=${encodeURIComponent(doc.description || "")}&tags=${encodeURIComponent((doc.tags || []).join(","))}`}
                                                className="bg-white/10 md:bg-white border border-white/20 md:border-gray-200 text-white md:text-gray-700 hover:bg-white/20 md:hover:bg-gray-50 text-xs font-bold px-6 py-3.5 rounded-full uppercase tracking-wider transition shadow-md flex-1 md:flex-initial text-center cursor-pointer"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(doc._id)}
                                                className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 md:bg-gray-50 hover:bg-red-500/20 text-gray-350 hover:text-red-500 border border-white/10 md:border-gray-100 transition shadow-md shrink-0"
                                                title="Delete Node"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
