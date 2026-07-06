// app/api/ai/search/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Document from "@/models/Document";

export async function POST(request) {
    try {
        // 1. Database connection pool status synchronization active karna
        await connectDB();

        // 2. Client payload parameters extract karna
        const { userQuery, userId } = await request.json();

        if (!userQuery || !userId) {
            return NextResponse.json(
                { success: false, message: "Bhai, query aur userId dono payload mein required hain!" },
                { status: 400 }
            );
        }

        // 3. Relational data boundaries filtering structure
        // Database se sirf active user ke saved documents ka records data fetch karna
        const myDocuments = await Document.find({ userId }).select("title description tags fileUrl");

        // 4. Transform data arrays into clean textual context lines for AI parsing
        const documentsContext = myDocuments.map((doc, index) => (
            `${index + 1}. Title: ${doc.title}, Description: ${doc.description}, Tags: ${(doc.tags || []).join(", ")}, Link: ${doc.fileUrl}`
        )).join("\n");

        // 5. Build environment runtime keys validation checkpoints
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, message: "Gemini API key missing in runtime process variables" },
                { status: 500 }
            );
        }

        // 6. Direct HTTP client communications hitting Google AI Studio REST Engine (Bypassing heavy SDK)
        const aiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
            { method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Aap ek personal vault AI document assistant hain. User aap se Urdu/Hindi ya English mein sawaal puchega ke uski documents, photos ya certificates is secure storage system mein hain ya nahi, ya phir kisi document ki summary ya details ke baare mein poochega.

              Mere personal vault mein saved documents ki actual database list neeche di gayi hai:
              ${documentsContext || "Is waqt database vault bilkul khali hai, koi documents nahi hain."}

              User ka sawaal hai: "${userQuery}"

              Rules for response formatting:
              1. Is list ko achhi tarah parhein aur user ke sawaal ka bilkul specific aur seedha jawab Urdu ya Hindi mein dein.
              2. Agar user kisi document ki summary ya details ke baare mein pooche (jaise "yeh document kis baare mein hai" ya "summarize this document"), to list mein se us document ki Description aur Title ko use karke ek achhi aur clear summary (agar zaroori ho to points mein) Urdu/Hindi mein provide karein.
              3. Agar match hone wala document/photo list mein mil jaye, to us file ka details lazmi is format mein clean list karein:
                 **Title**: [file ka Title]
                 **Tags**: [file ke comma separated tags]
                 **Description**: [file ki description ya info]
                 Aur us ka raw Link (fileUrl) lazmi print karein taaki link client render ho sake.
              4. Agar user kisi aisi file ke bare mein puche jo list mein nahi hai, to saaf bata dein ke 'Bhai, yeh file is vault mein nahi mili'.
              5. Faltu technical words use mat karein, simple insani friendly tone rakhein.`
                        }]
                    }]
                })
            }
        );

        const aiData = await aiResponse.json();

        // Safety handling evaluation constraints checking matrix
        if (!aiResponse.ok) {
            console.error("❌ Gemini API HTTP Error Status:", aiResponse.status);
            console.error("❌ Gemini API Error response:", JSON.stringify(aiData));
            
            let displayMessage = aiData.error?.message || "AI Engine rejected the query payload.";
            if (aiResponse.status === 503) {
                displayMessage = "Gemini API servers are currently experiencing high demand (503 Service Unavailable). Please wait a few seconds and try sending your message again.";
            }

            return NextResponse.json({ 
                success: false, 
                message: displayMessage 
            }, { status: aiResponse.status || 500 });
        }

        if (!aiData.candidates || aiData.candidates.length === 0) {
            console.error("❌ Gemini API returned no candidates. Full response:", JSON.stringify(aiData));
            return NextResponse.json({ 
                success: false, 
                message: "AI Engine returned empty response. (Safety block or model filter)" 
            }, { status: 500 });
        }

        const aiAnswer = aiData.candidates[0].content.parts[0].text;

        return NextResponse.json({
            success: true,
            answer: aiAnswer // Response payload holding conversational analytics guide response
        });

    } catch (error) {
        console.error("AI dynamic search controller matrix crash:", error);
        return NextResponse.json({ success: false, message: "Internal application engine failure" }, { status: 500 });
    }
}