// models/Document.js
import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: [true, "Bhai, file ka title likhna zaroori hai!"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        fileUrl: {
            type: String,
            required: [true, "Cloudinary link ke bina document save nahi ho sakta!"],
        },
        fileType: {
            type: String,
            enum: ["image", "pdf", "document", "other"],
            default: "image",
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
    },
    {
        timestamps: true, // Auto track upload date and modifications
    }
);

// Next.js dynamic model replication compilation layout check
export default mongoose.models.Document || mongoose.model("Document", DocumentSchema);