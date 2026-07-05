// app/api/upload/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
    try {
        // 1. Frontend multipart form asset data stream read karna
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ success: false, message: "Bhai, koi file upload nahi hui!" }, { status: 400 });
        }

        // 2. Binary conversion system mapping matrix
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 3. Cloudinary API endpoints credentials process environment variables load karna
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

        // 4. Secure signature computation framework bypassing unsafe client presets
        const timestamp = Math.floor(Date.now() / 1000);
        const signatureStr = `timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

        // Base64 configuration generation layer
        const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

        // 5. Creating Native FormData payload to target official Cloudinary REST Endpoint
        const uploadFormData = new FormData();
        uploadFormData.append("file", base64File);
        uploadFormData.append("api_key", apiKey);
        uploadFormData.append("timestamp", timestamp);
        uploadFormData.append("signature", signature);

        const cloudinaryResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: uploadFormData }
        );

        const cloudinaryData = await cloudinaryResponse.json();

        if (cloudinaryData.secure_url) {
            return NextResponse.json({
                success: true,
                url: cloudinaryData.secure_url // Live global CDN downloadable url
            });
        } else {
            return NextResponse.json({
                success: false,
                message: cloudinaryData.error?.message || "Upload stream rejected by cloud provider"
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Media core pipeline upload crash:", error);
        return NextResponse.json({ success: false, message: "Internal server payload execution crash" }, { status: 500 });
    }
}