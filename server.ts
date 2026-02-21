import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import cors from "cors";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import mammoth from "mammoth";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // Ensure directories exist
  const uploadsDir = path.join(__dirname, "uploads");
  const tempDir = path.join(__dirname, "temp");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const upload = multer({ dest: "uploads/" });

  // API Route: Extract text from PDF/Word
  app.post("/api/extract-text", upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      let extractedText = "";

      if (fileExtension === ".pdf") {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        
        // Page limit check
        if (data.numpages > 25) {
          fs.unlinkSync(filePath);
          return res.status(400).json({ error: "Document exceeds 25 page limit." });
        }
        extractedText = data.text;
      } else if (fileExtension === ".docx" || fileExtension === ".doc") {
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
      } else {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "Unsupported file format" });
      }

      fs.unlinkSync(filePath);
      res.json({ text: extractedText });
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Generate MP4 from audio and static image
  app.post("/api/generate-video", async (req, res) => {
    try {
      const { audioBase64, logoBase64 } = req.body;

      if (!audioBase64) {
        return res.status(400).json({ error: "Audio data is required" });
      }

      const audioPath = path.join(tempDir, `audio_${Date.now()}.mp3`);
      const imagePath = path.join(tempDir, `image_${Date.now()}.png`);
      const outputPath = path.join(tempDir, `output_${Date.now()}.mp4`);

      // Write audio file
      fs.writeFileSync(audioPath, Buffer.from(audioBase64, "base64"));

      // Write image file (logo)
      if (logoBase64) {
        fs.writeFileSync(imagePath, Buffer.from(logoBase64.split(",")[1], "base64"));
      } else {
        return res.status(400).json({ error: "Logo image is required" });
      }

      // Use FFmpeg to combine image and audio
      ffmpeg()
        .input(imagePath)
        .loop(1)
        .input(audioPath)
        .outputOptions([
          "-c:v libx264",
          "-tune stillimage",
          "-c:a aac",
          "-b:a 192k",
          "-pix_fmt yuv420p",
          "-shortest"
        ])
        .on("end", () => {
          if (fs.existsSync(outputPath)) {
            const videoBuffer = fs.readFileSync(outputPath);
            res.setHeader("Content-Type", "video/mp4");
            res.send(videoBuffer);
          } else {
            res.status(500).json({ error: "Output file not found" });
          }

          // Cleanup
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          res.status(500).json({ error: "Video generation failed: " + err.message });
          // Cleanup
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        })
        .save(outputPath);

    } catch (error: any) {
      console.error("Video generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
