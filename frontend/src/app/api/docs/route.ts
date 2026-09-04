import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Locate docs directory (either ../docs from frontend/ or docs/ from root)
function getDocsDir() {
  const relPath = path.resolve(process.cwd(), "..", "docs");
  return relPath;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedFile = searchParams.get("file");
    const docsDir = getDocsDir();

    // If specific file requested, return its content and metadata
    if (requestedFile) {
      // Security: prevent path traversal outside docs directory
      const safeSuffix = requestedFile.replace(/^(\.\.(\/|\\|$))+/, "");
      const fullPath = path.resolve(docsDir, safeSuffix);

      if (!fullPath.startsWith(path.resolve(docsDir))) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      try {
        const stats = await fs.stat(fullPath);
        const content = await fs.readFile(fullPath, "utf-8");
        
        // Extract title from first H1 or filename
        const h1Match = content.match(/^#\s+(.+)$/m);
        const title = h1Match ? h1Match[1].trim() : path.basename(requestedFile, ".md").replace(/_/g, " ");

        // Compute word count and reading time
        const words = content.trim().split(/\s+/).filter(Boolean).length;
        const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

        return NextResponse.json({
          path: safeSuffix.replace(/\\/g, "/"),
          name: path.basename(safeSuffix),
          title,
          content,
          sizeBytes: stats.size,
          sizeFormatted: (stats.size / 1024).toFixed(1) + " KB",
          wordCount: words,
          readingTimeMinutes,
          lastModified: stats.mtime.toISOString(),
        });
      } catch (err: any) {
        return NextResponse.json({ error: `Document '${requestedFile}' not found` }, { status: 404 });
      }
    }

    // Otherwise, scan and return list of all markdown files organized by folder
    const allFiles: Array<{
      name: string;
      path: string;
      category: string;
      title: string;
      sizeBytes: number;
      sizeFormatted: string;
      wordCount: number;
      readingTimeMinutes: number;
    }> = [];

    async function scanDir(currentDir: string, relBase = "") {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(currentDir, entry.name);
          const relPath = path.join(relBase, entry.name).replace(/\\/g, "/");

          if (entry.isDirectory()) {
            await scanDir(entryPath, relPath);
          } else if (entry.isFile() && entry.name.endsWith(".md")) {
            const stats = await fs.stat(entryPath);
            const content = await fs.readFile(entryPath, "utf-8");
            const h1Match = content.match(/^#\s+(.+)$/m);
            const title = h1Match ? h1Match[1].trim() : entry.name.replace(".md", "").replace(/_/g, " ");
            const words = content.trim().split(/\s+/).filter(Boolean).length;

            let category = "Core Docs";
            if (relPath.startsWith("architecture/")) category = "Architecture";
            else if (relPath.startsWith("backend/")) category = "Backend & API";
            else if (relPath.startsWith("database/")) category = "Database";
            else if (relPath.startsWith("guidelines/")) category = "Engineering Guidelines";
            else if (relPath.startsWith("frontend/flutter/")) category = "Flutter Mobile";
            else if (relPath.startsWith("frontend/web/")) category = "Web Application";
            else if (relPath.startsWith("frontend/")) category = "Frontend";

            allFiles.push({
              name: entry.name,
              path: relPath,
              category,
              title,
              sizeBytes: stats.size,
              sizeFormatted: (stats.size / 1024).toFixed(1) + " KB",
              wordCount: words,
              readingTimeMinutes: Math.max(1, Math.ceil(words / 200)),
            });
          }
        }
      } catch (e) {
        // ignore scan errors
      }
    }

    await scanDir(docsDir);

    // Sort files cleanly
    allFiles.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

    return NextResponse.json({
      total: allFiles.length,
      documents: allFiles,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load docs" }, { status: 500 });
  }
}
