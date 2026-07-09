// app/api/upload/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";

// GET endpoint to generate Cloudinary signature for client-side upload
export async function GET() {
    try {
        const cloudinaryUrl = process.env.CLOUDINARY_URL;
        if (!cloudinaryUrl) {
            return NextResponse.json({ success: false, message: "Cloudinary URL config missing in env" }, { status: 500 });
        }

        // Extraction pattern for credentials validation mapping
        const configRegex = /cloudinary:\/\/([^:]+):([^@]+)@(.+)/;
        const match = cloudinaryUrl.match(configRegex);

        if (!match) {
            return NextResponse.json({ success: false, message: "Invalid Cloudinary URL structure" }, { status: 500 });
        }

        const [, apiKey, apiSecret, cloudName] = match;

        // Secure signature computation framework bypassing unsafe client presets
        const timestamp = Math.floor(Date.now() / 1000);
        const signatureStr = `timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

        return NextResponse.json({
            success: true,
            signature,
            timestamp,
            apiKey,
            cloudName
        });
    } catch (error) {
        console.error("Signature generation crash:", error);
        return NextResponse.json({ success: false, message: "Internal server signature generation crash" }, { status: 500 });
    }
}

// Fallback POST route in case any old reference calls it, returning error message
export async function POST() {
    return NextResponse.json({ 
        success: false, 
        message: "Direct POST uploads deprecated. Please use client-side signed uploads." 
    }, { status: 400 });
}