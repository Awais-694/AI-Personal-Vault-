import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { cookies } from "next/headers";

export async function GET() {
    try {
        await connectDB();

        const cookieStore = cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Session token not found." },
                { status: 401 }
            );
        }

        const jwtSecret = process.env.JWT_SECRET || "fallback_secret_key_matrix_shield";
        let decoded;

        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            return NextResponse.json(
                { success: false, message: "Invalid or expired session token." },
                { status: 401 }
            );
        }

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found in system." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Auth session query failure:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error during session authentication." },
            { status: 500 }
        );
    }
}
