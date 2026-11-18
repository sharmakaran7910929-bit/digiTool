
import { NextResponse } from "next/server";
import { PDFDocument, degrees } from "pdf-lib";
import sharp from "sharp";



const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 20;

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|avif)$/i;

function error(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getFilename(file) {
  return file.name || "document";
}

function isPdf(file) {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

function isImage(file) {
  return (
    ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) ||
    IMAGE_EXTENSIONS.test(file.name)
  );
}

async function loadPdf(buffer) {
  try {
    return await PDFDocument.load(buffer, {
      ignoreEncryption: false,
    });
  } catch {
    throw new Error(
      "Invalid or password-protected PDF. Please check your document."
    );
  }
}

// Convert supported images into PDF pages.
async function addImageToPdf(pdf, buffer) {
  const png = await sharp(buffer, {
    limitInputPixels: 100_000_000,
  })
    .rotate()
    .png()
    .toBuffer();

  const image = await pdf.embedPng(png);

  const page = pdf.addPage([
    image.width,
    image.height,
  ]);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });
}

// Parse page ranges such as 1-3,5,8.
function parsePageRange(value, totalPages) {
  if (!value) {
    throw new Error("Please specify pages to extract.");
  }

  const selected = [];

  for (const part of value.split(",")) {
    const match = part.trim().match(/^(\d+)(?:-(\d+))?$/);

    if (!match) {
      throw new Error(`Invalid page range: ${part}`);
    }

    const start = Number(match[1]);
    const end = Number(match[2] || start);

    if (
      start < 1 ||
      end < start ||
      end > totalPages
    ) {
      throw new Error(
        `Page range ${part} is invalid. This PDF has ${totalPages} pages.`
      );
    }

    for (let i = start; i <= end; i++) {
      selected.push(i - 1);
    }
  }

  if (!selected.length) {
    throw new Error("No pages selected.");
  }

  if (new Set(selected).size !== selected.length) {
    throw new Error("Duplicate pages are not allowed in the selection.");
  }

  return selected;
}

async function imagesToPdf(files) {
  const pdf = await PDFDocument.create();

  for (const file of files) {
    if (!isImage(file)) {
      throw new Error(
        `${getFilename(file)} is not a supported image.`
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await addImageToPdf(pdf, buffer);
  }

  return Buffer.from(
    await pdf.save({ useObjectStreams: true })
  );
}

async function mergeFiles(files) {
  const merged = await PDFDocument.create();

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (isPdf(file)) {
      const source = await loadPdf(buffer);

      const pages = await merged.copyPages(
        source,
        source.getPageIndices()
      );

      pages.forEach(page => merged.addPage(page));
    } else if (isImage(file)) {
      await addImageToPdf(merged, buffer);
    } else {
      throw new Error(
        `Unsupported file: ${getFilename(file)}`
      );
    }
  }

  return Buffer.from(
    await merged.save({ useObjectStreams: true })
  );
}

async function extractPages(buffer, range) {
  const source = await loadPdf(buffer);
  const indices = parsePageRange(
    range,
    source.getPageCount()
  );

  const output = await PDFDocument.create();

  const pages = await output.copyPages(source, indices);

  pages.forEach(page => output.addPage(page));

  return Buffer.from(
    await output.save({ useObjectStreams: true })
  );
}

async function reorderPages(buffer, orderString) {
  const source = await loadPdf(buffer);
  const total = source.getPageCount();

  const order = orderString
    .split(",")
    .map(value => Number(value.trim()));

  if (
    order.length !== total ||
    order.some(
      page =>
        !Number.isInteger(page) ||
        page < 1 ||
        page > total
    ) ||
    new Set(order).size !== total
  ) {
    throw new Error(
      `Enter every page exactly once. This PDF contains ${total} pages. Example: ${Array.from({ length: total }, (_, i) => total - i).join(",")}`
    );
  }

  const output = await PDFDocument.create();

  const pages = await output.copyPages(
    source,
    order.map(page => page - 1)
  );

  pages.forEach(page => output.addPage(page));

  return Buffer.from(
    await output.save({ useObjectStreams: true })
  );
}

async function rotatePdf(buffer, angle) {
  if (![90, 180, 270].includes(angle)) {
    throw new Error("Rotation must be 90, 180 or 270 degrees.");
  }

  const pdf = await loadPdf(buffer);

  pdf.getPages().forEach(page => {
    const current = page.getRotation().angle;

    page.setRotation(
      degrees((current + angle) % 360)
    );
  });

  return Buffer.from(
    await pdf.save({ useObjectStreams: true })
  );
}

// Structural optimization. Does not recompress embedded images.
async function compressPdf(buffer) {
  const pdf = await loadPdf(buffer);

  return Buffer.from(
    await pdf.save({
      useObjectStreams: true,
      objectsPerTick: 50,
    })
  );
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    const operation = formData.get("operation");
    const pageRange = formData.get("pageRange");
    const pageOrder = formData.get("pageOrder");
    const rotation = Number(formData.get("rotation") || 90);

    const files = formData.getAll("files");

    if (!files.length) {
      return error("Please upload at least one file.");
    }

    if (files.length > MAX_FILES) {
      return error(`Maximum ${MAX_FILES} files allowed.`);
    }

    // Validate every file before processing.
    for (const file of files) {
      if (typeof file.arrayBuffer !== "function") {
        return error("Invalid uploaded file.");
      }

      if (file.size === 0) {
        return error(`${getFilename(file)} is empty.`);
      }

      if (file.size > MAX_FILE_SIZE) {
        return error(
          `${getFilename(file)} exceeds the 50 MB limit.`
        );
      }
    }

    let output;
    let filename = "converted-document.pdf";

    switch (operation) {
      case "images":
        output = await imagesToPdf(files);
        filename = "images-to-pdf.pdf";
        break;

      case "merge":
        if (files.length < 2) {
          return error("Upload at least two files to merge.");
        }

        output = await mergeFiles(files);
        filename = "merged-document.pdf";
        break;

      case "split": {
        if (files.length !== 1 || !isPdf(files[0])) {
          return error("Upload exactly one PDF.");
        }

        const buffer = Buffer.from(
          await files[0].arrayBuffer()
        );

        output = await extractPages(buffer, pageRange);
        filename = "extracted-pages.pdf";
        break;
      }

      case "reorder": {
        if (files.length !== 1 || !isPdf(files[0])) {
          return error("Upload exactly one PDF.");
        }

        const buffer = Buffer.from(
          await files[0].arrayBuffer()
        );

        output = await reorderPages(buffer, pageOrder);
        filename = "reordered-document.pdf";
        break;
      }

      case "rotate": {
        if (files.length !== 1 || !isPdf(files[0])) {
          return error("Upload exactly one PDF.");
        }

        const buffer = Buffer.from(
          await files[0].arrayBuffer()
        );

        output = await rotatePdf(buffer, rotation);
        filename = "rotated-document.pdf";
        break;
      }

      case "compress": {
        if (files.length !== 1 || !isPdf(files[0])) {
          return error("Upload exactly one PDF.");
        }

        const buffer = Buffer.from(
          await files[0].arrayBuffer()
        );

        output = await compressPdf(buffer);
        filename = "optimized-document.pdf";
        break;
      }

      default:
        return error("Unknown PDF operation.");
    }

    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(output.length),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (err) {
    console.error("PDF processing error:", err);

    return error(
      err.message || "Unable to process this document.",
      422
    );
  }
}
