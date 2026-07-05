// lib/db.js
import mongoose from "mongoose";

// Caching structure globally database reuse karne ke liye taaki duplicate connections drop hon
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    // Agar pehle se connected hai, to wahi active tunnel return karo
    if (cached.conn) {
        return cached.conn;
    }

    // Agar connection runtime pipeline nahi bana, to naya pooling process shuru karo
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        const dbUri = process.env.MONGODB_URI;
        if (!dbUri) {
            throw new Error("Pipeline Matrix Error: MONGODB_URI is missing in environment variables.");
        }

        cached.promise = mongoose.connect(dbUri, opts).then((mongooseInstance) => {
            console.log("⚡ MongoDB Atlas Network Session Active: Connected Successfully!");
            return mongooseInstance;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("❌ Database Tunnel Synchronization Crash:", e);
        throw e;
    }

    return cached.conn;
}

export default connectDB;