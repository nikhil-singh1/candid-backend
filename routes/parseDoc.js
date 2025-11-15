
// const express = require("express");
// const multer = require("multer");
// const mammoth = require("mammoth");
// const PDFParser = require("pdf2json");

// const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage() });

// router.post("/", upload.single("file"), async (req, res) => {
//   try {
//     const file = req.file;
//     if (!file) return res.status(400).json({ msg: "No file uploaded" });

//     let text = "";
//     let images = [];

//     if (file.mimetype === "application/pdf") {
//       const pdfParser = new PDFParser();
//       const data = await new Promise((resolve, reject) => {
//         pdfParser.on("pdfParser_dataError", reject);
//         pdfParser.on("pdfParser_dataReady", resolve);
//         pdfParser.parseBuffer(file.buffer);
//       });

//       const pages = data?.formImage?.Pages;

//       if (!pages || !Array.isArray(pages)) {
//         return res.status(400).json({
//           msg: "Unable to extract text from PDF. Unsupported PDF format.",
//         });
//       }

//       text = pages
//         .map((page) =>
//           page.Texts.map((t) =>
//             decodeURIComponent(t.R.map((r) => r.T).join(""))
//           ).join(" ")
//         )
//         .join("\n\n");
//     }

//     else if (
//       file.mimetype ===
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//     ) {
//       const result = await mammoth.extractRawText({ buffer: file.buffer });
//       text = result.value;
//     }

//     // SAFETY CHECK
//     if (!text || typeof text !== "string") {
//       return res.status(400).json({ msg: "No readable text found in document" });
//     }

//     const paragraphs = text
//       .split(/\n\s*\n/)
//       .map((p) => p.trim())
//       .filter((p) => p.length > 10);

//     res.json({
//       title: paragraphs[0]?.slice(0, 50) || "Untitled",
//       paragraphs,
//       images,
//     });
//   } catch (err) {
//     console.error("Parse error:", err);
//     res.status(500).json({ msg: "Parsing failed", error: err.toString() });
//   }
// });

// module.exports = router;


const express = require("express");
const multer = require("multer");
const mammoth = require("mammoth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ msg: "No file uploaded" });

    // Only DOCX allowed
    if (
      file.mimetype !==
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return res.status(400).json({ msg: "Only DOCX files are supported" });
    }

    // ---- Extract TEXT + IMAGES from DOCX ----
    const result = await mammoth.convertToHtml(
      { buffer: file.buffer },
      {
        convertImage: mammoth.images.inline(function (image) {
          return image.read("base64").then((imageBuffer) => {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer,
            };
          });
        }),
      }
    );

    const html = result.value;

    // ----------------------------------
    // Extract images from <img src="...">
    // ----------------------------------
    const images = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(
      (m) => m[1]
    );

    // ----------------------------------
    // Extract text (remove tags & images)
    // ----------------------------------
    const text = html
      .replace(/<img[^>]+>/g, "") // remove image tags
      .replace(/<[^>]+>/g, " ") // remove HTML tags
      .replace(/\s+/g, " ")
      .trim();

    if (!text) {
      return res.status(400).json({ msg: "No readable text found in DOCX" });
    }

    const paragraphs = text
      .split(/\.\s+/) // split using periods
      .map((p) => p.trim())
      .filter((p) => p.length > 10);

    res.json({
      title: paragraphs[0]?.slice(0, 50) || "Untitled",
      paragraphs,
      images,
    });
  } catch (err) {
    console.error("DOCX Parse Error:", err);
    res.status(500).json({ msg: "Parsing failed", error: err.toString() });
  }
});

module.exports = router;
