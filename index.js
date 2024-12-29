const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// 1) Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Helper function to get all images from a folder
const getImagesFromFolder = (folderPath, folderName) => {
    try {
        return fs.readdirSync(folderPath)
            .filter(file => file !== 'cover.jpg') // Exclude cover.jpg
            .map(file => `/images/${folderName}/${file}`);
    } catch (err) {
        console.error(`Error reading folder ${folderPath}:`, err);
        return [];
    }
};

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

        // Get the first image found to use as Complete Collection cover
        let completeCollectionCover = null;
        for (const folder of folders) {
            const folderPath = path.join(imagesDir, folder);
            const files = fs.readdirSync(folderPath);
            const nonCoverImage = files.find(file => file !== 'cover.jpg');
            if (nonCoverImage) {
                completeCollectionCover = `/images/${folder}/${nonCoverImage}`;
                break;
            }
        }

        // Add Complete Collection to portfolios list
        const portfolios = folders.map((folderName) => ({
            name: folderName,
            cover: `/images/${folderName}/cover.jpg`,
        }));

        if (completeCollectionCover) {
            portfolios.unshift({
                name: "Complete Collection",
                cover: completeCollectionCover
            });
        }

        res.json(portfolios);
    } catch (err) {
        return res.json([]);
    }
});

// 3) API endpoint: list images in a specific portfolio folder
app.get("/api/portfolios/:folderName", (req, res) => {
    const folderName = req.params.folderName;
    const imagesDir = path.join(__dirname, "public", "images");

    // Special handling for Complete Collection
    if (folderName === "Complete Collection") {
        try {
            // Get all folders
            const folders = fs
                .readdirSync(imagesDir)
                .filter(item => fs.statSync(path.join(imagesDir, item)).isDirectory());

            // Get all images from all folders
            const allImages = folders.reduce((acc, folder) => {
                const folderPath = path.join(imagesDir, folder);
                const folderImages = getImagesFromFolder(folderPath, folder);
                return [...acc, ...folderImages];
            }, []);

            res.json({
                name: folderName,
                images: allImages
            });
            return;
        } catch (err) {
            console.error('Error reading Complete Collection:', err);
            return res.status(500).json({ error: "Error reading Complete Collection" });
        }
    }

    // Regular portfolio handling
    const folderPath = path.join(imagesDir, folderName);

    if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ error: "Portfolio not found" });
    }

    const images = getImagesFromFolder(folderPath, folderName);

    res.json({
        name: folderName,
        images,
    });
});

// 4) Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});