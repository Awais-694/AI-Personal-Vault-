// app/api/auth/signup/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
    try {
        // 1. Database connection pooling pool initialize karna
        await connectDB();

        // 2. Request body se parameters stream extract karna
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, message: "All fields are required!" },
                { status: 400 }
            );
        }

        // 3. Email duplicate entry checks validation
        const userExists = await User.findOne({ email });
        if (userExists) {
            return NextResponse.json(
                { success: false, message: "This email is already registered!" },
                { status: 400 }
            );
        }

        // 4. Cryptographic Hashing Matrix for Password Security
        // 10 salt rounds use karke raw password text ko unreadable coded string mein badle ga
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Creating User Record Document inside MongoDB Atlas Cluster
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "user" // Fallback configuration default safeguard role
        });

        return NextResponse.json(
            { success: true, message: "🚀 Secure identity verification success: Account created!" },
            { status: 201 }
        );

    } catch (error) {
        console.error("Authentication pipeline network crash:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error during registration layout" },
            { status: 500 }
        );
    }
}