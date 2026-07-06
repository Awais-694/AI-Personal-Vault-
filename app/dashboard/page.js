// app/dashboard/page.js
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 💾 State Management Matrix for Documents & Uploads
    const [documents, setDocuments] = useState([]);
    const [uploadData, setUploadData] = useState({ title: "", description: "", tags: "" });
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [editId, setEditId] = useState(null);

    // 👤 User State & Loading
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // 🤖 State Management Matrix for Gemini AI Search Hub
    const [aiQuery, setAiQuery] = useState("");
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const chatEndRef = useRef(null);

    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

    const editParam = searchParams.get("edit");
    const idParam = searchParams.get("id");
    const titleParam = searchParams.get("title");
    const descParam = searchParams.get("description");
    const tagsParam = searchParams.get("tags");
    const chatParam = searchParams.get("chat");
    const deletedParam = searchParams.get("deleted");

    // Watch for mobile chat toggle
    useEffect(() => {
        setIsMobileChatOpen(chatParam === "true");
    }, [chatParam]);

    // Watch for edit mode changes and populate fields reactively
    useEffect(() => {
        if (editParam === "true" && idParam) {
            setEditId(idParam);
            setUploadData({
                title: titleParam || "",
                description: descParam || "",
                tags: tagsParam || ""
            });
        } else {
            setEditId(null);
            setUploadData({ title: "", description: "", tags: "" });
        }
    }, [editParam, idParam, titleParam, descParam, tagsParam]);

    // Watch for deletion success parameter and show system flash alert
    useEffect(() => {
        if (deletedParam === "true") {
            triggerSystemAlert("Success! The document has been permanently deleted from vault and cloud storage.", "success");
            router.replace("/dashboard");
        }
    }, [deletedParam]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    // 🖥️ UI System Status Logs States
    const [systemMessage, setSystemMessage] = useState({ text: "", type: "" });

    // 1. Lifecycle Hook: Load active node user and documents list on initialization
    useEffect(() => {
        const checkAuthAndLoad = async () => {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (data.success && data.user) {
                    setCurrentUser(data.user);
                    
                    // Display welcoming chatbot greeting message addressing user by name
                    setChatMessages([
                        {
                            id: "initial-greet",
                            sender: "bot",
                            text: `Hello ${data.user.name}! 👋 Main aapka Personal Secure Vault assistant hoon. Aap mujhse apne saved documents, certificates, ya degrees ke baare mein sawaal puch sakte hain.`
                        }
                    ]);

                    // Fetch user's documents
                    await fetchUserDocuments();
                } else {
                    window.location.href = "/login";
                }
            } catch (err) {
                console.error("Auth check crash:", err);
                window.location.href = "/login";
            } finally {
                setLoadingUser(false);
            }
        };
        checkAuthAndLoad();
    }, []);

    const fetchUserDocuments = async () => {
        try {
            const res = await fetch("/api/documents");
            const data = await res.json();
            if (data.success) {
                setDocuments(data.documents);
            }
        } catch (err) {
            console.error("Data pipeline load crash:", err);
        }
    };

    // 2. Binary Upload Stream Runner Routine
    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!editId && !selectedFile) {
            triggerSystemAlert("Bhai, pehle koi image ya file select kar lein!", "error");
            return;
        }

        setIsUploading(true);
        triggerSystemAlert(editId ? "Saving updates..." : "Streaming binary matrix directly to Cloudinary...", "info");

        try {
            let fileUrl = null;
            let fileType = null;

            if (selectedFile) {
                const uploadFormData = new FormData();
                uploadFormData.append("file", selectedFile);

                const cloudRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadFormData,
                });

                const cloudData = await cloudRes.json();

                if (!cloudData.success) {
                    throw new Error(cloudData.message || "Cloud link execution failed.");
                }
                
                fileUrl = cloudData.url;
                fileType = selectedFile.type.startsWith("image/") ? "image" : (selectedFile.type === "application/pdf" ? "pdf" : "other");
            }

            if (editId) {
                // UPDATE MODE
                const docRes = await fetch("/api/documents", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: editId,
                        title: uploadData.title,
                        description: uploadData.description,
                        tags: uploadData.tags,
                        fileUrl,
                        fileType
                    })
                });

                const docData = await docRes.json();
                if (!docData.success) {
                    throw new Error(docData.message || "Failed to update document metadata in database.");
                }

                triggerSystemAlert("Success! Your document has been updated.", "success");
                setUploadData({ title: "", description: "", tags: "" });
                setSelectedFile(null);
                setEditId(null);
                e.target.reset();

                await fetchUserDocuments();
                setTimeout(() => {
                    router.push("/dashboard/documents");
                }, 2000);

            } else {
                // CREATE MODE
                const docRes = await fetch("/api/documents", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: uploadData.title,
                        description: uploadData.description,
                        tags: uploadData.tags,
                        fileUrl,
                        fileType: fileType || "image"
                    })
                });

                const docData = await docRes.json();
                if (!docData.success) {
                    throw new Error(docData.message || "Failed to save document metadata in database.");
                }

                triggerSystemAlert("Success! Your document has been uploaded and stored safely.", "success");
                setUploadData({ title: "", description: "", tags: "" });
                setSelectedFile(null);
                e.target.reset();

                await fetchUserDocuments();
                setTimeout(() => {
                    router.push("/dashboard/documents");
                }, 2000);
            }

        } catch (error) {
            console.error("Upload workflow sequence crashed:", error);
            triggerSystemAlert(error.message || "Pipeline synchronization timeout.", "error");
        } finally {
            setIsUploading(false);
        }
    };


    // 3. AI Query Submission Handler Routine
    const handleChatSubmit = async (e, customQuery = "") => {
        if (e) e.preventDefault();
        
        const queryToSend = customQuery || aiQuery;
        if (!queryToSend.trim()) return;

        if (!customQuery) setAiQuery("");

        // Add user query message
        const userMsg = {
            id: Date.now() + "-user",
            sender: "user",
            text: queryToSend
        };

        // Add temporary loading bot message
        const botLoadingMsg = {
            id: Date.now() + "-bot-loading",
            sender: "bot",
            text: "🔍 Analyzing secure vault storage index...",
            isLoading: true
        };

        setChatMessages((prev) => [...prev, userMsg, botLoadingMsg]);
        setIsAiSearching(true);

        try {
            const res = await fetch("/api/ai/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userQuery: queryToSend,
                    userId: currentUser?.id || currentUser?._id
                }),
            });

            const data = await res.json();

            setChatMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== botLoadingMsg.id);
                return [
                    ...filtered,
                    {
                        id: Date.now() + "-bot-response",
                        sender: "bot",
                        text: data.success ? data.answer : `⚠️ AI Query Error: ${data.message}`
                    }
                ];
            });
        } catch (err) {
            console.error("AI operations error logic caught:", err);
            setChatMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== botLoadingMsg.id);
                return [
                    ...filtered,
                    {
                        id: Date.now() + "-bot-response",
                        sender: "bot",
                        text: "❌ Network connection error. Failed to reach AI node."
                    }
                ];
            });
        } finally {
            setIsAiSearching(false);
        }
    };

    // 4. Secure Session Termination Routine
    const handleLogout = async () => {
        try {
            const res = await fetch("/api/auth/logout", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                window.location.href = "/";
            } else {
                triggerSystemAlert("Failed to log out cleanly.", "error");
            }
        } catch (err) {
            console.error("Logout failed:", err);
            triggerSystemAlert("Session termination failed.", "error");
        }
    };

    const triggerSystemAlert = (text, type) => {
        setSystemMessage({ text, type });
        setTimeout(() => setSystemMessage({ text: "", type: "" }), 5000);
    };

    const formatAiResponse = (text) => {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s\)]+)/g;
        const rawUrls = text.match(urlRegex) || [];
        const urlsFound = Array.from(new Set(rawUrls.map(url => url.replace(/[\.\,\)]$/, ''))));
        
        // This regex matches "Title: ... Tags: ... Description: ..." inline or multi-line
        const docRegex = /(?:Title|Title\*\*)\s*:\s*([\s\S]*?)(?:Tags|Tags\*\*)\s*:\s*([\s\S]*?)(?:Description|Description\*\*)\s*:\s*([\s\S]*?)(?=(?:Title|Title\*\*|Tags|Tags\*\*|Description|Description\*\*|Link|Link\*\*)\s*:|\n\n|$)/gi;
        
        const blocks = [];
        let lastIndex = 0;
        let match;
        
        // Reset regex index
        docRegex.lastIndex = 0;
        
        while ((match = docRegex.exec(text)) !== null) {
            const matchIndex = match.index;
            // Add preceding text as a text block
            if (matchIndex > lastIndex) {
                blocks.push({
                    type: "text",
                    content: text.substring(lastIndex, matchIndex)
                });
            }
            
            // Add document block
            blocks.push({
                type: "document",
                title: match[1].replace(/^\*\*|\*\*$/g, '').trim(),
                tags: match[2].replace(/^\*\*|\*\*$/g, '').trim(),
                description: match[3].replace(/^\*\*|\*\*$/g, '').trim()
            });
            
            lastIndex = docRegex.lastIndex;
        }
        
        // Add remaining text
        if (lastIndex < text.length) {
            blocks.push({
                type: "text",
                content: text.substring(lastIndex)
            });
        }
        
        return (
            <div className="space-y-4 w-full">
                <div className="text-xs font-semibold text-gray-700 leading-relaxed space-y-3">
                    {blocks.map((block, i) => {
                        if (block.type === "document") {
                            // Strip out any http/https links and "Link" keywords from the description to prevent URL clutter in card
                            const cleanDescription = block.description
                                .replace(/https?:\/\/[^\s\)]+/g, '')
                                .replace(/Link\s*:\s*/gi, '')
                                .trim();

                            // Render a gorgeous card with only description and tags as requested!
                            return (
                                <div key={i} className="p-4 bg-white border border-slate-200 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-300 space-y-3 border-l-4 border-l-[#00adef] text-left w-full overflow-hidden break-words">
                                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                                        <span className="text-xs">📄</span>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-[#007cd1]">Secure Asset Metadata Details</span>
                                    </div>
                                    {cleanDescription && (
                                        <div className="space-y-1 w-full">
                                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Description:</span>
                                            <p className="text-[10px] text-slate-650 font-bold leading-relaxed break-words whitespace-pre-line">
                                                {cleanDescription}
                                            </p>
                                        </div>
                                    )}
                                    {block.tags && (
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Tags:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {block.tags.split(",").map((tag, tIdx) => {
                                                    const cleanTag = tag.replace(/[^a-zA-Z0-9\s]/g, '').trim();
                                                    if (!cleanTag) return null;
                                                    return (
                                                        <span key={tIdx} className="bg-blue-50 text-[#007cd1] text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                            #{cleanTag}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        
                        // Otherwise render as normal paragraph text
                        const trimmedContent = block.content.trim();
                        if (!trimmedContent) return null;
                        
                        // Split by newlines to preserve spacing
                        return trimmedContent.split('\n').map((line, lineIdx) => {
                            // Strip out raw URLs from the conversational text bubble
                            let cleanLine = line.replace(/https?:\/\/[^\s\)]+/g, '').trim();
                            
                            // Filter out raw link lines, empty bold wrappers, or link headers, plus lone hyphens, underscores, asterisks
                            if (
                                !cleanLine || 
                                cleanLine.toLowerCase().includes('link') || 
                                cleanLine.replace(/[\*\s:_\-\.]/g, '') === ''
                            ) {
                                return null;
                            }
                            
                            // Bold parsing
                            const boldRegex = /\*\*(.*?)\*\*/g;
                            let parts = [];
                            let lastIndex = 0;
                            let matchBold;
                            
                            while ((matchBold = boldRegex.exec(cleanLine)) !== null) {
                                if (matchBold.index > lastIndex) {
                                    parts.push(cleanLine.substring(lastIndex, matchBold.index));
                                }
                                parts.push(<strong key={matchBold.index} className="font-extrabold text-gray-900">{matchBold[1]}</strong>);
                                lastIndex = boldRegex.lastIndex;
                            }
                            if (lastIndex < cleanLine.length) {
                                parts.push(cleanLine.substring(lastIndex));
                            }
                            
                            return (
                                <p key={`${i}-${lineIdx}`} className="break-words text-left">
                                    {parts.length > 0 ? parts : cleanLine}
                                </p>
                            );
                        });
                    })}
                </div>
                
                {/* Detected Links section rendered beautifully */}
                {urlsFound.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                        <div className="text-[9px] font-black uppercase text-[#007cd1] tracking-wider text-left">🔗 Detected Vault Secure Assets:</div>
                        <div className="grid gap-2">
                            {urlsFound.map((url, idx) => {
                                const cleanUrl = url;
                                const matchedDoc = documents.find(d => d.fileUrl === cleanUrl);
                                const targetHref = matchedDoc 
                                    ? `/dashboard/documents#${matchedDoc._id}` 
                                    : cleanUrl;
                                const isInternal = !!matchedDoc;
                                const isImage = cleanUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i);

                                return (
                                    <Link
                                        key={idx}
                                        href={targetHref}
                                        target={isInternal ? "_self" : "_blank"}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-white border border-slate-200 rounded-[24px] hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition gap-3 text-left w-full overflow-hidden cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {isImage ? (
                                                <img 
                                                    src={cleanUrl} 
                                                    alt="Preview" 
                                                    className="w-12 h-12 object-cover rounded-xl border border-slate-100 shrink-0" 
                                                />
                                            ) : (
                                                <span className="text-xl shrink-0">📂</span>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-[11px] sm:text-xs font-black text-gray-800 uppercase tracking-tight">
                                                    {matchedDoc ? matchedDoc.title : "External Secured Asset"}
                                                </p>
                                                <p className="text-[9px] text-[#007cd1] font-bold">
                                                    {isInternal ? "Saved in Vault Records" : cleanUrl}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="w-full sm:w-auto text-center bg-[#00adef] group-hover:bg-[#0089e0] text-white text-[9px] font-black px-4 py-2.5 rounded-xl uppercase tracking-wider transition shrink-0">
                                            {isInternal ? "View Document" : "Open Link"}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loadingUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-100 via-blue-50 to-white">
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
                        Verifying secure tunnel handshake...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* CORE CONTROL WORKSPACE OPERATIONS SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* PANEL LEFT: FILE STREAM DATA INPUT FORMS (Enhanced Professional Layered White Card) */}
                <div className={`relative w-full ${isMobileChatOpen ? "hidden lg:block" : ""}`}>
                    {/* Underlay Card 1 (Cyan/Light Blue Gradient - tilted counter-clockwise) */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00bfff] to-[#00adef] rounded-[40px] transform -rotate-2 translate-x-[-6px] translate-y-[-4px] shadow-lg opacity-90 pointer-events-none"></div>
                    
                    {/* Underlay Card 2 (Deep Blue Gradient - tilted clockwise) */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0089e0] to-[#0062ff] rounded-[40px] transform rotate-2 translate-x-[6px] translate-y-[4px] shadow-lg opacity-95 pointer-events-none"></div>
 
                    <section className="relative z-10 bg-white p-8 md:p-10 border border-slate-100/80 rounded-[40px] shadow-2xl space-y-6">
                        {systemMessage.text && (
                            <div className={`p-4 rounded-2xl text-xs font-bold border transition-all duration-300 flex items-center gap-2 ${
                                systemMessage.type === "success" ? "bg-green-50 text-green-700 border-green-150" :
                                systemMessage.type === "error" ? "bg-red-50 text-red-700 border-red-150" :
                                "bg-blue-50 text-blue-700 border-blue-150"
                            }`}>
                                <span>{systemMessage.type === "success" ? "✅" : "❌"}</span>
                                <span>{systemMessage.text}</span>
                            </div>
                        )}
 
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-lg sm:text-xl font-extrabold text-[#004f95] uppercase tracking-wider flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#00adef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {editId ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        )}
                                    </svg>
                                    {editId ? "Edit document details" : "Upload documents, images"}
                                </h2>
                                <p className="text-xs text-slate-400 font-medium mt-1">
                                    {editId ? "Update metadata fields for this secure node." : "Securely register and encrypt your files in the cloud vault."}
                                </p>
                            </div>
                            {editId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUploadData({ title: "", description: "", tags: "" });
                                        setSelectedFile(null);
                                        setEditId(null);
                                        router.push("/dashboard");
                                    }}
                                    className="text-[9px] font-black text-red-650 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full uppercase tracking-wider transition border border-red-200/50 cursor-pointer"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
 
                        <form onSubmit={handleUploadSubmit} className="space-y-5">
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Document Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., University Certificate"
                                    value={uploadData.title}
                                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                    className="w-full bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-[#00adef] focus:ring-4 focus:ring-blue-100/30 py-3.5 px-4 rounded-2xl focus:rounded-[32px] text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-300"
                                />
                            </div>
 
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                    Document Description
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="e.g., Scan copy of official document or image receipt."
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                    className="w-full bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-[#00adef] focus:ring-4 focus:ring-blue-100/30 py-3.5 px-4 rounded-2xl focus:rounded-[32px] text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-300 resize-none"
                                />
                            </div>
 
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Indexing Search Tags (Comma Separated)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., degree, certificate, receipt, invoice"
                                    value={uploadData.tags}
                                    onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                                    className="w-full bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-[#00adef] focus:ring-4 focus:ring-blue-100/30 py-3.5 px-4 rounded-2xl focus:rounded-[32px] text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-300"
                                />
                            </div>
 
                            <div>
                                <label className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Upload Document File
                                    </span>
                                    <span className="text-[9px] font-black text-[#007cd1] bg-blue-50 px-2.5 py-0.5 rounded-full normal-case tracking-tight">
                                        Only images are currently supported
                                    </span>
                                </label>
                                <input
                                    type="file"
                                    required={!editId}
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="w-full border border-dashed border-slate-200 hover:border-[#00adef] p-4 rounded-xl text-xs font-bold text-slate-500 bg-slate-50/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-gradient-to-r file:from-[#00adef] file:to-[#007cd1] file:text-white hover:file:opacity-90 file:transition-all file:cursor-pointer cursor-pointer transition-colors duration-350"
                                />
                            </div>
 
                            <button
                                type="submit"
                                disabled={isUploading}
                                className="w-full bg-gradient-to-r from-[#00adef] to-[#007cd1] hover:from-[#0089e0] hover:to-[#0062ff] text-white text-xs font-extrabold py-4 rounded-2xl uppercase tracking-widest transition duration-300 disabled:opacity-50 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                {editId ? (isUploading ? "Saving updates..." : "Update Document Entry") : (isUploading ? "Encrypting & Saving..." : "Save Document Entry")}
                            </button>
                        </form>
                    </section>
                </div>
 
                {/* PANEL RIGHT: INTELLIGENT CONTEXT-DRIVEN AI RETRIEVAL CONSOLE */}
                <section className={`bg-white p-6 border border-gray-150 rounded-3xl shadow-sm space-y-4 justify-between min-h-[480px] flex flex-col ${
                    isMobileChatOpen 
                        ? "w-full" 
                        : "hidden lg:flex"
                }`}>
                    <div className="flex justify-between items-center pb-3 border-b border-blue-50 lg:border-none lg:pb-0">
                        {/* Mobile Header Navbar inside Chat */}
                        <div className="lg:hidden flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <span className="font-black text-xs uppercase text-[#007cd1] tracking-wider">
                                AI Assistant
                            </span>
                        </div>
 
                        {/* Redesigned Premium AI Assistant Heading */}
                        <div className="hidden lg:flex items-center gap-2.5 text-left">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <h2 className="text-base sm:text-lg font-black text-[#007cd1] uppercase tracking-wider leading-none">
                                AI Assistant
                            </h2>
                        </div>
                    </div>

                    {/* Chat Messages Stream Container */}
                    <div className="border border-gray-150 rounded-2xl p-4 bg-gray-50/30 flex-1 overflow-y-auto max-h-[300px] min-h-[250px] space-y-4 chat-scrollbar">
                        {chatMessages.map((msg) => {
                            const isBot = msg.sender === "bot";
                            return (
                                <div key={msg.id} className={`flex items-start gap-2.5 ${!isBot ? "flex-row-reverse" : ""}`}>
                                    {/* Avatar */}
                                    {isBot ? (
                                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-blue-100 bg-blue-50 shadow-sm">
                                            <img src="/robot-logo.png" alt="AI" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-extrabold text-[10px] uppercase bg-gray-900 text-white shadow-sm">
                                            {currentUser?.name?.[0] || "U"}
                                        </div>
                                    )}

                                    {/* Bubble */}
                                    <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm transition-all duration-300 ${
                                        isBot 
                                            ? "bg-gray-100/90 text-gray-800 rounded-tl-none max-w-[85%]" 
                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none max-w-[85%] ml-auto"
                                    }`}>
                                        {msg.isLoading ? (
                                            <div className="flex items-center gap-1.5 text-gray-450 italic">
                                                <span className="animate-bounce">●</span>
                                                <span className="animate-bounce [animation-delay:0.2s]">●</span>
                                                <span className="animate-bounce [animation-delay:0.4s]">●</span>
                                            </div>
                                        ) : isBot ? (
                                            formatAiResponse(msg.text)
                                        ) : (
                                            <p className="break-words">{msg.text}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Suggestion Quick Reply Pills (Dynamic based on user documents) */}
                    {chatMessages.length === 1 && (
                        <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                            {documents.length > 0 ? (
                                <>
                                    {documents.slice(0, 2).map((doc, idx) => (
                                        <button
                                            key={doc._id || idx}
                                            type="button"
                                            onClick={(e) => handleChatSubmit(e, `Mera document "${doc.title}" kahan hai aur uski summary kya hai?`)}
                                            className="border border-blue-200/50 bg-blue-50/30 hover:bg-blue-50/80 hover:scale-102 hover:shadow-sm text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-300"
                                        >
                                            Find & Summarize: {doc.title.length > 20 ? doc.title.substring(0, 20) + "..." : doc.title}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={(e) => handleChatSubmit(e, "List all documents with links")}
                                        className="border border-blue-200/50 bg-blue-50/30 hover:bg-blue-50/80 hover:scale-102 hover:shadow-sm text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-300"
                                    >
                                        List All Saved Docs
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleChatSubmit(e, "How do I edit or delete my saved documents in this vault?")}
                                        className="border border-blue-200/50 bg-blue-50/30 hover:bg-blue-50/80 hover:scale-102 hover:shadow-sm text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-300"
                                    >
                                        How to Edit/Delete?
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleChatSubmit(e, "Bhai, please guide me on how to use this AI Personal Vault application?")}
                                        className="border border-blue-200/50 bg-blue-50/30 hover:bg-blue-50/80 hover:scale-102 hover:shadow-sm text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-300"
                                    >
                                        App Usage Guide
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => handleChatSubmit(e, "Mera university ka degree kahan hai link do?")}
                                        className="border border-blue-200/50 bg-blue-50/30 hover:bg-blue-50/80 hover:scale-102 hover:shadow-sm text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-300"
                                    >
                                        Track University Degree
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleChatSubmit(e, "List all documents with links")}
                                        className="border border-blue-200/50 bg-blue-50/30 hover:bg-blue-50/80 hover:scale-102 hover:shadow-sm text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-300"
                                    >
                                        List All Saved Docs
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleChatSubmit(e, "Bhai, please guide me on how to use this AI Personal Vault application?")}
                                        className="border border-blue-200/50 bg-blue-50/30 hover:bg-blue-50/80 hover:scale-102 hover:shadow-sm text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-300"
                                    >
                                        App Usage Guide
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Chat Input form */}
                    <form onSubmit={(e) => handleChatSubmit(e)} className="flex gap-2">
                        <input
                            type="text"
                            required
                            disabled={isAiSearching}
                            placeholder="Type a message to search vault..."
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            className="flex-1 border border-gray-200 bg-gray-50/20 hover:border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 ease-in-out p-3 rounded-xl text-xs font-semibold outline-none shadow-sm focus:shadow-md disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={isAiSearching}
                            className="bg-gradient-to-r from-[#00adef] to-[#007cd1] hover:from-[#0089e0] hover:to-[#0062ff] text-white px-6 text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all duration-300 hover:shadow-md active:scale-95 disabled:opacity-50 shrink-0"
                        >
                            Send
                        </button>
                    </form>

                    <div className="flex items-center justify-between text-[9px] text-gray-400 font-extrabold uppercase tracking-widest border-t border-gray-100 pt-2.5">
                        <span>Secure AI Session: Encrypted</span>
                        <span>Model: Gemini-2.5-Flash</span>
                    </div>
                </section>

            </div>



        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-100 via-blue-50 to-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-[#00adef] animate-spin"></div>
                    </div>
                </div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}