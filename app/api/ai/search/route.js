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
                            role: "user",
                            content: `Aap ek personal vault AI document assistant hain. User aap se Urdu/Hindi ya English mein sawaal puchega ke uski documents, photos ya certificates is secure storage system mein hain ya nahi, ya phir kisi document ki summary ya details ke baare mein poochega.

              Mere personal vault mein saved documents ki actual database list neeche di gayi hai:
              ${documentsContext || "Is waqt database vault bilkul khali hai, koi documents nahi hain."}

              User ka sawaal hai: "${userQuery}"

              Rules for response formatting:
              1. Is list ko achhi tarah parhein aur user ke sawaal ka bilkul specific aur seedha jawab Urdu ya Hindi mein dein.
              2. Agar user kisi document ki summary ya details ke baare mein pooche (jaise "yeh document kis baare mein hai" ya "summarize this document"), to list mein se us document ki Description aur Title ko use karke ek achhi aur clear summary (agar zaroori ho to points mein) Urdu/Hindi mein provide karein.
              3. Agar user kisi specific document/photo ke bare mein pooche (information ya summary mangay), to us file ka details lazmi is format mein clean list karein:
                 **Title**: [file ka Title]
                 **Tags**: [file ke comma separated tags]
                 **Description**: [file ki description ya info]
                 Aur us ka raw Link (fileUrl) lazmi print karein taaki link client render ho sake.
              4. Lekin agar user sab documents ki list mangay (jaise 'List all saved docs' ya 'saare documents dikhao'), to 'Tags' aur 'Description' bilkul print na karein. Sirf document ka Title aur raw Link print karein taaki client direct visual card render kar sake (clutter-free list ke liye).
              5. Agar user kisi specific file ya document ke bare mein puche jo is list mein nahi hai, to saaf bata dein ke 'Bhai, yeh file is vault mein nahi mili'. Lekin agar user koi aam baat (jaise greetings 'hello/hi'), app instructions, ya general sawaal (jaise edit/delete kaise karein) puche, to ek helpful personal assistant ban kar use boht achhi tarah Urdu/Hindi mein guide karein.
                 - Edit/Delete Guide: User ko batayein ke Catalog page (/dashboard/documents) par har document ke niche "Edit" aur "Delete" buttons diye gaye hain, wahan se wo edit aur delete kar sakte hain.
                 - Questions Guideline: User ko batayein ke wo AI se document search karne (jaise 'mera HBL QR code kahan hai?'), details/summaries poochne (jaise 'university card details dikhao'), aur general help ke sawal pooch sakta hai. Ise clean list format mein present karein.
              6. Faltu technical words use mat karein, simple insani friendly aur helpful tone rakhein.
              7. User ke sawaal (query) ko response ke start mein repeat ya quote bilkul mat karein. Apni response direct jawab (answers) se start karein.`
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