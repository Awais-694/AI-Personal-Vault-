// app/api/auth/logout/route.js
import { NextResponse } from "next/server";

export async function POST() {
    try {
        // 1. Instantiating dynamic logout response shell
        const response = NextResponse.json({
            success: true,
            message: "🔒 Identity session successfully terminated. Tunnel locked!",
        });

        // 2. Clear browser authorization cookie storage parameters
        // Token variable string ko clear data space assign karke instant past parameters par set karna
        response.cookies.set("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            expires: new Date(0), // Sets expiration to 1970 UTC to trigger immediate automatic browser cleanup
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("Session termination matrix failure:", error);
        return NextResponse.json(
            { success: false, message: "Internal application engine failure during exit sequence" },
            { status: 500 }
        );
    }
}