const express = require("express");
const multer = require("multer");
const mammoth = require("mammoth");
const PDFParser = require("pdf2json");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ msg: "No file uploaded" });

    let text = "";
    let images = []; // pdf2json cannot extract images (safe for Vercel)

    // ----------------------------
    // PDF
    // ----------------------------
    if (file.mimetype === "application/pdf") {
      const pdfParser = new PDFParser();

      const data = await new Promise((resolve, reject) => {
        pdfParser.on("pdfParser_dataError", reject);
        pdfParser.on("pdfParser_dataReady", resolve);
        pdfParser.parseBuffer(file.buffer);
      });

      // Extract raw text
      text = data?.formImage?.Pages?.map((page) =>
        page.Texts.map((t) =>
          decodeURIComponent(t.R.map(r => r.T).join(""))
        ).join(" ")
      ).join("\n\n");
    }

    // ----------------------------
    // DOCX
    // ----------------------------
    else if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value;
    }

    // ----------------------------
    // Paragraph cleanup
    // ----------------------------
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 10);

    res.json({
      title: paragraphs[0]?.slice(0, 50) || "Untitled",
      paragraphs,
      images, // empty (but safe)
    });
  } catch (err) {
    console.error("Parse error:", err);
    res.status(500).json({ msg: "Parsing failed", error: err.toString() });
  }
});

module.exports = router;
