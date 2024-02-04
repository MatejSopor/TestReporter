import { readFile, writeFile, rm, unlink } from "fs/promises";
import { createTerminus } from "@godaddy/terminus";
import { join } from "path";
import { exec } from "child_process";

export async function uploadReport(reportSummary) {
  const zipReportId = `${reportSummary.reportId}.zip`;
  extractReportOS(zipReportId);
  await saveReportSummary(reportSummary);
  await deleteTempReport(zipReportId);
}

export async function getReports() {
  return await readReportsFromDisk(process.env.REPORTS_SUMMARY_PATH, {
    encoding: "utf-8",
  });
}

export async function deleteReport(reportId) {
  const reports = await readReportsFromDisk();
  const indexToDelete = reports.findIndex(
    (report) => report.reportId === reportId
  );
  if (indexToDelete !== -1) {
    const newReports = reports;
    newReports.splice(indexToDelete, 1);
    await writeReportsToDisk(newReports);
  }

  const pathToReport = join(process.env.REPORTS_DIR, reportId);

  await rm(pathToReport, { recursive: true, force: true });
}

export function setupTerminus(server) {
  createTerminus(server, {
    timeout: 2000,
    sendFailuresDuringShutdown: true,
    signals: ["SIGTERM", "SIGINT"],
    healthChecks: {
      "/healthz": () => Promise.resolve(),
    },
    onShutdown: () => {
      console.log("Server stopped");
      return Promise.resolve();
    },
    beforeShutdown: () => {
      console.log("Server is stopping");
      return new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });
    },
    useExit0: true,
    headers: {
      "Cache-control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

async function saveReportSummary(reportSummary) {
  const reportSummaries = await readReportsFromDisk();
  reportSummaries.push(reportSummary);
  await writeReportsToDisk(reportSummaries);
}

function extractReportOS(zipReportId) {
  const sanitizedFolderName = removeZipExtension(zipReportId);
  const zipFilePath = join(process.env.TEMP_UPLOADS_DIR, zipReportId);
  const extractFolderPath = join(process.env.REPORTS_DIR, sanitizedFolderName);
  exec(
    `unzip ${zipFilePath} -d ${extractFolderPath}`,
    (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log("Folder unzipped successfully!");
    }
  );
}

function removeZipExtension(zipFilePath) {
  return zipFilePath.split(".").slice(0, -1).join("");
}

async function readReportsFromDisk() {
  const reportsSummaryPath = process.env.REPORTS_SUMMARY_PATH;
  const data = await readFile(reportsSummaryPath, {
    encoding: "utf-8",
  });
  return JSON.parse(data);
}

async function writeReportsToDisk(reports) {
  const reportsSummaryPath = process.env.REPORTS_SUMMARY_PATH;
  await writeFile(reportsSummaryPath, JSON.stringify(reports));
}

async function deleteTempReport(fileName) {
  const filePath = join(process.env.TEMP_UPLOADS_DIR, fileName);
  await unlink(filePath);
}