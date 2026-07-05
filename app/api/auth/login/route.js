// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
    try {
        // 1. Database Connection pooling pool
        await connectDB();

        // 2. Request body extract inputs
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required!" },
                { status: 400 }
            );
        }

        // 3. Find User
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "This email is not registered!" },
                { status: 400 }
            );
        }

        // 4. Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, message: "Incorrect password. Please try again." },
                { status: 400 }
            );
        }

        // 5. Generate JWT Token
        const jwtSecret = process.env.JWT_SECRET || "fallback_secret_key_matrix_shield";
        const token = jwt.sign(
            { userId: user._id, role: user.role, email: user.email },
            jwtSecret,
            { expiresIn: "7d" }
        );

        // 6. Secure Cookie Response allocation
        const response = NextResponse.json({
            success: true,
            message: "🔒 Handshake verified! Session authorized.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            path: "/",
            sameSite: "strict"
        });

        return response;

    } catch (error) {
        console.error("Login authorization pipeline crash:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error during authorization login" },
            { status: 500 }
        );
    }
}