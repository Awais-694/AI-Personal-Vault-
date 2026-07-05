import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Document from "@/models/Document";
import { cookies } from "next/headers";

// Helper function to authenticate token and return decoded payload
async function getAuthenticatedUser() {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const jwtSecret = process.env.JWT_SECRET || "fallback_secret_key_matrix_shield";
    try {
        return jwt.verify(token, jwtSecret);
    } catch (err) {
        return null;
    }
}

export async function GET() {
    try {
        const decoded = await getAuthenticatedUser();
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: "Unauthorized: Active session missing." },
                { status: 401 }
            );
        }

        await connectDB();
        const documents = await Document.find({ userId: decoded.userId }).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            documents
        });
    } catch (error) {
        console.error("Document catalog fetch crash:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error while loading documents." },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const decoded = await getAuthenticatedUser();
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: "Unauthorized: Active session missing." },
                { status: 401 }
            );
        }

        const { title, description, fileUrl, fileType, tags } = await request.json();

        if (!title || !fileUrl) {
            return NextResponse.json(
                { success: false, message: "Title and file URL are required variables." },
                { status: 400 }
            );
        }

        // Sanitize & split tags if they are in string format
        let processedTags = [];
        if (typeof tags === "string") {
            processedTags = tags.split(",").map(t => t.trim()).filter(Boolean);
        } else if (Array.isArray(tags)) {
            processedTags = tags.map(t => String(t).trim()).filter(Boolean);
        }

        await connectDB();
        const newDoc = await Document.create({
            userId: decoded.userId,
            title,
            description: description || "",
            fileUrl,
            fileType: fileType || "image",
            tags: processedTags
        });

        return NextResponse.json({
            success: true,
            message: "Document successfully saved to secure registry.",
            document: newDoc
        }, { status: 201 });

    } catch (error) {
        console.error("Document registry creation crash:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error while saving document entry." },
            { status: 500 }
        );
    }
}
