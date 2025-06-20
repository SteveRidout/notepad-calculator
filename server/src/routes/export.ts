import express from "express";
import archiver from "archiver";
import { Response } from "express";

// Create a router
const router = express.Router();

// Function to create a zip file and pipe it to the response
const sendZipFile = (res: Response) => {
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Compression level
  });

  archive.on("error", function (err) {
    throw err;
  });

  // Set the archive name
  res.attachment("files.zip");

  // Pipe the zip to the response
  archive.pipe(res);

  // Append files to the zip
  archive.append("hello from file 1", { name: "file1.txt" });
  archive.append("hello from file 2", { name: "file2.txt" });
  archive.append("hello from file 3", { name: "file3.txt" });

  // Finalize the archive
  archive.finalize();
};

// GET /download route
router.get("/download", (req, res) => {
  sendZipFile(res);
});

export default router;
