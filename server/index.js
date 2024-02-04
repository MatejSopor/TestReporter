import multer from "multer";
import { join } from "node:path";
import { createServer } from "node:http";
import express from "express";
import {
  deleteReport,
  getReports,
  uploadReport,
  setupTerminus,
} from "./lib.js";
import serveStatic from "serve-static";
import { config } from "dotenv";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const root = process.cwd();
const isProduction = process.env["NODE_ENV"] === "production";

if (isProduction) {
  config({ path: "./.env.production" });
} else {
  config();
}

const TEMP_UPLOADS_DIR = process.env.TEMP_UPLOADS_DIR;
const DIST_FOLDER = process.env.DIST_FOLDER;
const WWW_ROOT = process.env.WWW_ROOT;
const PORT = process.env.PORT || 7755;
const REPORTS_SUMMARY_PATH = process.env.REPORTS_SUMMARY_PATH;
const REPORTS_DIR = process.env.REPORTS_DIR;
const DATA_DIR = process.env.DATA_DIR;

setupDirectories();

function setupDirectories() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR);
  }

  if (!existsSync(TEMP_UPLOADS_DIR)) {
    mkdirSync(TEMP_UPLOADS_DIR);
  }

  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR);
  }

  if (!existsSync(REPORTS_SUMMARY_PATH)) {
    writeFileSync(REPORTS_SUMMARY_PATH, "[]");
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, `${file.originalname}`);
  },
});

const upload = multer({ storage: storage });
const app = express();

function setupApiRoutes() {
  app.get("/api/hello", (req, res) => {
    res.send("Saluti da Reportero!");
  });

  app.post(
    "/api/upload-report",
    upload.single("margo-report"),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }
      try {
        const reportSummary = JSON.parse(req.body["report-summary"]);
        await uploadReport(reportSummary);
        res.send("Uploading report OK.");
      } catch (e) {
        console.log(e);
        res.status(500).send(`Error uploading report. ${e}`);
      }
    }
  );

  app.get("/api/reports", async (req, res) => {
    try {
      res.send(await getReports());
    } catch (e) {
      console.log(e);
      res.status(500).send(`Error fetching data. ${e}`);
    }
  });

  app.delete("/api/reports/:id", async (req, res) => {
    const reportId = req.params.id;
    try {
      await deleteReport(reportId);
      res.send("Deleting report successfull.");
    } catch (e) {
      console.log(e);
      res.status(500).send(`Error deleting report. ${e}`);
    }
  });
}

async function startServer() {
  if (isProduction) {
    app.use("/", serveStatic(join(root, DIST_FOLDER)));
    app.use("/data", serveStatic(join(root, DATA_DIR)));
  } else {
    const vite = await import("vite");
    const viteDevMiddleware = (
      await vite.createServer({
        root,
        server: { middlewareMode: true },
      })
    ).middlewares;
    app.use(viteDevMiddleware);
  }

  const server = createServer(app);

  setupTerminus(server);

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

setupApiRoutes();
startServer();
