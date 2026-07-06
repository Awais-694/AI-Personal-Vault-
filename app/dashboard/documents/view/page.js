// app/dashboard/documents/view/page.js
"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ViewerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const fileUrl = searchParams.get("url");
    const title = searchParams.get("title") || "Vault Document";
    const fileType = searchParams.get("type") || "other";

    // View states
    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);

    const handleDownload = async () => {
        try {
            const res = await fetch(fileUrl);
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            // Extract extension or fallback
            const ext = fileUrl.split('.').pop().split('?')[0] || 'jpg';
            a.download = `${title.replace(/\s+/g, '_')}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            window.open(fileUrl, "_blank");
        }
    };

    useEffect(() => {
        if (!fileUrl) {
            router.push("/dashboard/documents");
        }
    }, [fileUrl]);

    if (!fileUrl) {
        return (
            <div className="text-xs font-black uppercase tracking-widest text-[#007cd1] animate-pulse text-center">
                Loading Secure Viewer...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-4">
                <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#00adef]">Vault Interactive Viewer</span>
                    <h1 className="text-xl sm:text-2xl font-black text-[#004f95] tracking-tight uppercase truncate max-w-lg">
                        {title}
                    </h1>
                </div>
                <Link
                    href="/dashboard/documents"
                    className="text-xs font-bold text-[#007cd1] bg-blue-50/40 hover:bg-blue-50 border border-blue-200/50 transition px-5 py-2.5 rounded-2xl uppercase tracking-wider shadow-sm self-start sm:self-auto"
                >
                    ← Back to Catalog
                </Link>
            </div>

            {/* Viewer Shell Box */}
            <div className="bg-white border border-slate-100 rounded-[32px] shadow-xl overflow-hidden flex flex-col items-center">
                
                {/* Control Bar (Only for images) */}
                {fileType === "image" && (
                    <div className="w-full bg-slate-50 border-b border-slate-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase text-slate-400">Interactive:</span>
                            <span className="text-[10px] font-black text-[#007cd1] bg-blue-50 px-2 py-0.5 rounded">
                                {Math.round(scale * 100)}% Zoom
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {/* Zoom Out */}
                            <button
                                onClick={() => setScale(prev => Math.max(0.5, prev - 0.25))}
                                className="p-2 hover:bg-blue-50 text-slate-500 hover:text-[#007cd1] rounded-xl transition duration-200 outline-none cursor-pointer"
                                title="Zoom Out"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
                                </svg>
                            </button>
                            
                            {/* Zoom In */}
                            <button
                                onClick={() => setScale(prev => Math.min(3, prev + 0.25))}
                                className="p-2 hover:bg-blue-50 text-slate-500 hover:text-[#007cd1] rounded-xl transition duration-200 outline-none cursor-pointer"
                                title="Zoom In"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                            
                            {/* Rotate */}
                            <button
                                onClick={() => setRotation(prev => (prev + 90) % 360)}
                                className="hidden sm:inline-block p-2 hover:bg-blue-50 text-slate-500 hover:text-[#007cd1] rounded-xl transition duration-200 outline-none cursor-pointer"
                                title="Rotate 90°"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6H16" />
                                </svg>
                            </button>

                            {/* Download */}
                            <button
                                onClick={handleDownload}
                                className="p-2 hover:bg-blue-50 text-slate-500 hover:text-[#007cd1] rounded-xl transition duration-200 outline-none cursor-pointer"
                                title="Download Image"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                            
                            {/* Reset */}
                            <button
                                onClick={() => {
                                    setScale(1);
                                    setRotation(0);
                                }}
                                className="text-[10px] font-black uppercase tracking-wider px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl transition cursor-pointer"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                )}

                {/* Content Display Canvas */}
                <div className="w-full min-h-[500px] flex items-center justify-center p-3 sm:p-4 bg-slate-900/5 overflow-auto relative">
                    {fileType === "image" ? (
                        <div className="max-w-full max-h-[85vh] flex items-center justify-center overflow-hidden transition-all duration-300">
                            <img
                                src={fileUrl}
                                alt={title}
                                style={{
                                    transform: `rotate(${rotation}deg) scale(${scale})`,
                                    transition: "transform 0.2s ease-out"
                                }}
                                className="max-w-full max-h-[85vh] object-contain rounded-[32px] shadow-xl border-4 border-[#007cd1]"
                            />
                        </div>
                    ) : fileType === "pdf" ? (
                        <iframe
                            src={`${fileUrl}#toolbar=0`}
                            className="w-full h-[75vh] border-0 rounded-2xl shadow-md bg-white"
                            title={title}
                        />
                    ) : (
                        <div className="text-center space-y-4 py-12">
                            <span className="text-6xl">📂</span>
                            <p className="text-sm font-bold text-slate-500">Preview not available directly for this file format.</p>
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-gradient-to-r from-[#00adef] to-[#007cd1] text-white text-xs font-bold px-6 py-3 rounded-full uppercase tracking-wider transition shadow-md"
                            >
                                Open Raw Source
                            </a>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-400 font-extrabold uppercase tracking-widest px-4">
                <span>Secure Sandbox Node Viewer</span>
                <span>Status: Decrypted View</span>
            </div>
        </div>
    );
}

export default function DocumentViewerPage() {
    return (
        <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-blue-50 to-white py-8 px-4 sm:px-6 lg:px-8">
            <Suspense fallback={
                <div className="min-h-[50vh] flex items-center justify-center">
                    <div className="text-xs font-black uppercase tracking-widest text-[#007cd1] animate-pulse">
                        Initializing Viewer Canvas...
                    </div>
                </div>
            }>
                <ViewerContent />
            </Suspense>
        </div>
    );
}
