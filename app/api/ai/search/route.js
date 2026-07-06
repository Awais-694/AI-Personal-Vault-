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
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, message: "Groq API key missing in runtime process variables" },
                { status: 500 }
            );
        }

        // 6. Direct HTTP client communications hitting Groq REST Engine (Bypassing heavy SDK)
        const aiResponse = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "system",
                            content: `Aap ek personal vault AI document assistant hain. Aapka kaam user ko uske secure vault documents ke baare mein inform karna hai.
 
Mere personal vault mein saved documents ki actual database list neeche di gayi hai:
${documentsContext || "Is waqt database vault bilkul khali hai, koi documents nahi hain."}

Rules for response formatting:
1. User ke sawaal ka bilkul direct, specific aur seedha jawab Urdu ya Hindi mein dein (faltu technical words ya dialog markers mat use karein).
2. Sawaal ko repeat bilkul mat karein. "User ne aapko..." ya "Aapka Jawab:" jaise sentences bilkul use nahi karne. Direct reply likhein.
3. Jab user koi specific document/photo search kare ya us ke bare mein pooche, to us document ka Title aur Details likhein aur us ka raw Link (fileUrl) response ke aakhir mein LAZMI print karein (e.g. Link: https://res.cloudinary.com/...) taaki client visual card (with preview and "View Document" button) render kar sake.
4. Agar user sab documents ki list mangay, to sirf har document ka Title aur us ka raw Link print karein. List items mein 'Description:' ya 'Tags:' headings bilkul print na karein (taaki visual cards clean list ho sakain).
5. Agar user kisi specific file ke bare mein puche jo list mein nahi hai, to saaf bata dein ke 'Bhai, yeh file is vault mein nahi mili'. Lekin agar user greeting (hello/hi) ya general help (edit/delete kaise karein) poochay, to friendly guider ki tarah guide karein (Edit/delete ke liye user ko batayein ke wo 'Documents Records' page par ja kar perform kar sakta hai).`
                        },
                        {
                            role: "user",
                            content: userQuery
                        }
                    ]
                })
            }
        );

        const aiData = await aiResponse.json();

        // Safety handling evaluation constraints checking matrix
        if (!aiResponse.ok) {
            console.error("❌ Groq API HTTP Error Status:", aiResponse.status);
            console.error("❌ Groq API Error response:", JSON.stringify(aiData));
            
            let displayMessage = aiData.error?.message || "AI Engine rejected the query payload.";
            return NextResponse.json({ 
                success: false, 
                message: displayMessage 
            }, { status: aiResponse.status || 500 });
        }

        if (!aiData.choices || aiData.choices.length === 0) {
            console.error("❌ Groq API returned no choices. Full response:", JSON.stringify(aiData));
            return NextResponse.json({ 
                success: false, 
                message: "AI Engine returned empty response." 
            }, { status: 500 });
        }

        const aiAnswer = aiData.choices[0].message.content;

        return NextResponse.json({
            success: true,
            answer: aiAnswer
        });

    } catch (error) {
        console.error("AI dynamic search controller matrix crash:", error);
        return NextResponse.json({ success: false, message: "Internal application engine failure" }, { status: 500 });
    }
}