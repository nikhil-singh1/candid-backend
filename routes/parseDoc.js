const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { extractImagesFromPDF } = require("../utils/pdfImages");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    let text = "";
    let images = [];

    if (file.mimetype === "application/pdf") {
      const pdfData = await pdfParse(file.buffer);
      text = pdfData.text;
      images = await extractImagesFromPDF(file.buffer);
    } else if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value;
    }

    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    return res.json({
      title: paragraphs[0]?.slice(0, 50),
      paragraphs,
      images,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Parsing failed", error: err.toString() });
  }
});

module.exports = router;
