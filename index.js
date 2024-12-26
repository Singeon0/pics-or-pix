const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// 1) Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// 2) API endpoint: list all portfolios
app.get("/api/portfolios", (req, res) => {
    const imagesDir = path.join(__dirname, "public", "images");

    // Get all subfolders in public/images
    let folders = [];
    try {
        folders = fs
            .readdirSync(imagesDir)
            .filter((item) => {
                const itemPath = path.join(imagesDir, item);
                return fs.statSync(itemPath).isDirectory();
            });
    } catch (err) {
        return res.json([]);
    }

    // Each folder => { name, cover }
    const portfolios = folders.map((folderName) => ({
        name: folderName,
        cover: `/images/${folderName}/cover.jpg`,
    }));

    res.json(portfolios);
});

// 3) API endpoint: list images in a specific portfolio folder
app.get("/api/portfolios/:folderName", (req, res) => {
    const folderName = req.params.folderName;
    const folderPath = path.join(__dirname, "public", "images", folderName);

    if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ error: "Portfolio not found" });
    }

    // Filter out cover.jpg
    const files = fs
        .readdirSync(folderPath)
        .filter((file) => file !== "cover.jpg");

    // Return absolute paths to the images
    const images = files.map((file) => `/images/${folderName}/${file}`);

    res.json({
        name: folderName,
        images,
    });
});

// 4) Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
