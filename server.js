require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const app = express();
app.use(cors());

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// ✅ Initialize AWS S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});

// ✅ Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// ✅ File Upload Function
async function uploadFileToS3(file) {
    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.originalname, // File name in S3
        Body: file.buffer, // File content
        ContentType: file.mimetype // MIME type
    };

    try {
        const command = new PutObjectCommand(uploadParams);
        await s3.send(command);
        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.originalname}`;
        return fileUrl;
    } catch (error) {
        console.error("❌ S3 Upload Error:", error);
        throw error;
    }
}


// ✅ API Route to Handle File Upload
app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        const fileUrl = await uploadFileToS3(req.file);
        res.status(200).json({ message: "File uploaded successfully", fileUrl });
    } catch (error) {
        res.status(500).json({ error: "File upload failed" });
    }
});

// ✅ Serve index.html for unknown routes
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Start Express Server (ONLY ONCE)
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
