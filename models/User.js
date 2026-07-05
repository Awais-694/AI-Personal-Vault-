// Empty
// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Bhai, naam likhna zaroori hai!"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Bhai, email likhna lazmi hai!"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Bhai, secure password ke bina account nahi ban sakta!"],
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user", // By default naya account user hi banega
        },
    },
    {
        timestamps: true, // Yeh khud hi account creation date aur updates track karega
    }
);

// Next.js runtime models replication check matrix fallback
export default mongoose.models.User || mongoose.model("User", UserSchema);