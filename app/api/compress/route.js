
import sharp from "sharp";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const MAX_DIMENSION = 8000;
const MAX_TARGET_SIZE = 100 * 1024 * 1024;

const SUPPORTED_FORMATS = ["jpeg", "png", "webp", "avif"];

const FORMAT_MIME_TYPES = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

const ERROR_MESSAGES = {
  INVALID_REQUEST: "Invalid request. Please try again.",
  MISSING_FILE: "Please select an image to compress.",
  EMPTY_FILE: "The selected image is empty.",
  FILE_TOO_LARGE: "Image size exceeds the 20 MB limit.",
  UNSUPPORTED_FORMAT:
    "Unsupported image format. Please upload JPEG, PNG, WebP or AVIF.",
  CORRUPTED_IMAGE:
    "This image appears to be damaged or corrupted. Please upload a valid image.",
  INVALID_QUALITY: "Quality must be a whole number between 10 and 100.",
  INVALID_FORMAT: "Please select a supported output format.",
  INVALID_DIMENSIONS:
    "Image dimensions must be whole numbers between 1 and 8000 pixels.",
  INVALID_TARGET_SIZE:
    "Target size must be a valid positive number up to 100 MB.",
  TARGET_SIZE_UNREACHABLE:
    "This image cannot be compressed to the requested target size with the selected settings.",
  IMAGE_TOO_LARGE:
    "This image has too many pixels to process safely. Please resize it first.",
  ANIMATED_IMAGE:
    "Animated images are not supported yet. Please upload a static image.",
  PROCESSING_FAILED:
    "We couldn't compress this image. Please try another image or different settings.",
};

function jsonError(code, status = 400, customMessage = null) {
  return Response.json(
    {
      success: false,
      error: {
        code,
        message:
          customMessage ||
          ERROR_MESSAGES[code] ||
          ERROR_MESSAGES.PROCESSING_FAILED,
        status,
      },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

function parseOptionalDimension(value) {
  if (value === null || value === undefined || value === "") {
    return { valid: true, value: undefined };
  }

  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > MAX_DIMENSION
  ) {
    return { valid: false };
  }

  return { valid: true, value: number };
}

function safeFilename(name) {
  const base = String(name || "image")
    .split(/[\\/]/)
    .pop()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100);

  return base || "image";
}

function formatTargetSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(bytes / 1024).toFixed(2)} KB`;
}

// Normalize Sharp's HEIF/AV1 metadata to AVIF.
function getNormalizedInputFormat(metadata) {
  if (
    metadata.format === "heif" &&
    String(metadata.compression || "").toLowerCase() === "av1"
  ) {
    return "avif";
  }

  return metadata.format;
}

function getProcessingError(error) {
  const message = String(error?.message || "").toLowerCase();

  if (
    message.includes("pixel limit") ||
    message.includes("exceeds pixel limit") ||
    message.includes("image exceeds")
  ) {
    return { code: "IMAGE_TOO_LARGE", status: 413 };
  }

  if (
    message.includes("unsupported image format") ||
    message.includes("unsupported format") ||
    message.includes("input file contains unsupported image format")
  ) {
    return { code: "UNSUPPORTED_FORMAT", status: 415 };
  }

  if (
    message.includes("corrupt") ||
    message.includes("unexpected end") ||
    message.includes("premature end") ||
    message.includes("invalid image") ||
    message.includes("bad seek")
  ) {
    return { code: "CORRUPTED_IMAGE", status: 422 };
  }

  return { code: "PROCESSING_FAILED", status: 500 };
}

// Create a fresh Sharp pipeline for every encoding attempt.
function createImagePipeline(input, options) {
  const {
    width,
    height,
    keepRatio,
    outputFormat,
    quality,
    progressive,
    hasAlpha,
  } = options;

  let image = sharp(input, {
    limitInputPixels: MAX_PIXELS,
    failOn: "error",
  });

  if (width || height) {
    image = image.resize({
      width,
      height,
      fit: keepRatio ? "inside" : "fill",
      withoutEnlargement: false,
      position: "centre",
    });
  }

  if (outputFormat === "jpeg" && hasAlpha) {
    image = image.flatten({ background: "#ffffff" });
  }

  switch (outputFormat) {
    case "jpeg":
      return image.jpeg({
        quality,
        progressive,
        mozjpeg: true,
      });

    case "png":
      return image.png({
        compressionLevel: 9,
        adaptiveFiltering: true,
      });

    case "webp":
      return image.webp({
        quality,
        effort: 4,
      });

    case "avif":
      return image.avif({
        quality,
        effort: 4,
      });

    default:
      throw new Error("Unsupported output format.");
  }
}

async function encodeImage(input, options, quality) {
  return createImagePipeline(input, {
    ...options,
    quality,
  }).toBuffer();
}

// Find the highest usable quality that fits the requested maximum size.
async function compressToTarget(input, options, targetSize, initialQuality) {
  const { outputFormat } = options;

  // PNG encoding is lossless. Its output size cannot be reduced
  // through the quality setting.
  if (outputFormat === "png") {
    const output = await encodeImage(input, options, initialQuality);

    if (output.length > targetSize) {
      throw new Error(
        `This PNG image cannot reach ${formatTargetSize(targetSize)}. Try a larger target size or resize the image.`
      );
    }

    return output;
  }

  // First try the user's selected quality.
  const initialOutput = await encodeImage(
    input,
    options,
    initialQuality
  );

  if (initialOutput.length <= targetSize) {
    return initialOutput;
  }

  // Check whether the minimum supported quality can reach the target.
  const minimumQuality = 10;
  const minimumOutput = await encodeImage(
    input,
    options,
    minimumQuality
  );

  if (minimumOutput.length > targetSize) {
    throw new Error(
      `This image cannot be reduced to ${formatTargetSize(targetSize)} with the selected dimensions and format. Try a larger target size or smaller dimensions.`
    );
  }

  let bestOutput = minimumOutput;
  let low = minimumQuality + 1;
  let high = initialQuality - 1;

  // Binary search for the highest quality that fits.
  // Keep the best valid result found so far.
  for (let attempt = 0; attempt < 8 && low <= high; attempt += 1) {
    const middle = Math.floor((low + high) / 2);

    const candidate = await encodeImage(input, options, middle);

    if (candidate.length <= targetSize) {
      bestOutput = candidate;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return bestOutput;
}

export async function POST(request) {
  try {
    // 1. Validate request content type.
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return jsonError(
        "INVALID_REQUEST",
        415,
        "Please upload an image using a multipart form request."
      );
    }

    // 2. Read form data.
    let formData;

    try {
      formData = await request.formData();
    } catch {
      return jsonError(
        "INVALID_REQUEST",
        400,
        "We couldn't read your upload. Please select the image and try again."
      );
    }

    // 3. Validate uploaded file.
    const file = formData.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return jsonError("MISSING_FILE", 400);
    }

    if (file.size === 0) {
      return jsonError("EMPTY_FILE", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError("FILE_TOO_LARGE", 413);
    }

    // 4. Validate quality.
    const qualityValue = formData.get("quality");

    const quality =
      qualityValue === null || qualityValue === ""
        ? 75
        : Number(qualityValue);

    if (
      !Number.isInteger(quality) ||
      quality < 10 ||
      quality > 100
    ) {
      return jsonError("INVALID_QUALITY", 400);
    }

    // 5. Validate output format.
    const requestedFormat = String(
      formData.get("format") || "webp"
    ).toLowerCase();

    const normalizedFormat =
      requestedFormat === "jpg" ? "jpeg" : requestedFormat;

    if (
      normalizedFormat !== "original" &&
      !SUPPORTED_FORMATS.includes(normalizedFormat)
    ) {
      return jsonError("INVALID_FORMAT", 400);
    }

    // 6. Validate dimensions.
    const widthResult = parseOptionalDimension(formData.get("width"));
    const heightResult = parseOptionalDimension(formData.get("height"));

    if (!widthResult.valid || !heightResult.valid) {
      return jsonError("INVALID_DIMENSIONS", 400);
    }

    const width = widthResult.value;
    const height = heightResult.value;

    // 7. Validate optional target size in bytes.
    const targetSizeValue = formData.get("targetSizeBytes");

    let targetSize = null;

    if (targetSizeValue !== null && targetSizeValue !== "") {
      const parsedTarget = Number(targetSizeValue);

      if (
        !Number.isSafeInteger(parsedTarget) ||
        parsedTarget <= 0 ||
        parsedTarget > MAX_TARGET_SIZE
      ) {
        return jsonError("INVALID_TARGET_SIZE", 400);
      }

      targetSize = parsedTarget;
    }

    // 8. Validate aspect ratio.
    const keepRatioValue = formData.get("keepRatio");

    if (
      keepRatioValue !== null &&
      keepRatioValue !== "true" &&
      keepRatioValue !== "false"
    ) {
      return jsonError(
        "INVALID_REQUEST",
        400,
        "Invalid aspect ratio setting."
      );
    }

    const keepRatio = keepRatioValue !== "false";

    // 9. Validate progressive JPEG setting.
    const progressiveValue = formData.get("progressive");

    if (
      progressiveValue !== null &&
      progressiveValue !== "true" &&
      progressiveValue !== "false"
    ) {
      return jsonError(
        "INVALID_REQUEST",
        400,
        "Invalid progressive JPEG setting."
      );
    }

    const progressive = progressiveValue === "true";

    // 10. Read image.
    const input = Buffer.from(await file.arrayBuffer());

    const image = sharp(input, {
      limitInputPixels: MAX_PIXELS,
      failOn: "error",
    });

    let metadata;

    try {
      metadata = await image.metadata();
    } catch (error) {
      console.error("Sharp metadata error:", error);
      return jsonError("CORRUPTED_IMAGE", 422);
    }

    // 11. Normalize and verify actual image format.
    const inputFormat = getNormalizedInputFormat(metadata);

    if (!SUPPORTED_FORMATS.includes(inputFormat)) {
      return jsonError(
        "UNSUPPORTED_FORMAT",
        415,
        `Unsupported image format detected: ${metadata.format || "unknown"}.`
      );
    }

    if (!metadata.width || !metadata.height) {
      return jsonError("CORRUPTED_IMAGE", 422);
    }

    // 12. Reject animated images.
    if (metadata.pages && metadata.pages > 1) {
      return jsonError("ANIMATED_IMAGE", 422);
    }

    // 13. Determine output format.
    const outputFormat =
      normalizedFormat === "original"
        ? inputFormat
        : normalizedFormat;

    if (!SUPPORTED_FORMATS.includes(outputFormat)) {
      return jsonError("INVALID_FORMAT", 400);
    }

    const options = {
      width,
      height,
      keepRatio,
      outputFormat,
      progressive,
      hasAlpha: metadata.hasAlpha,
    };

    // 14. Compress, optionally enforcing the target size.
    let output;

    try {
      output = targetSize
        ? await compressToTarget(
            input,
            options,
            targetSize,
            quality
          )
        : await encodeImage(input, options, quality);
    } catch (error) {
      if (
        targetSize &&
        String(error?.message || "").includes(
          "cannot reach"
        )
      ) {
        return jsonError(
          "TARGET_SIZE_UNREACHABLE",
          422,
          error.message
        );
      }

      if (
        targetSize &&
        String(error?.message || "").includes(
          "cannot be reduced"
        )
      ) {
        return jsonError(
          "TARGET_SIZE_UNREACHABLE",
          422,
          error.message
        );
      }

      console.error("Sharp processing error:", error);

      const processingError = getProcessingError(error);

      return jsonError(
        processingError.code,
        processingError.status
      );
    }

    if (!output || output.length === 0) {
      return jsonError("PROCESSING_FAILED", 500);
    }

    // 15. Read actual output dimensions.
    const outputMetadata = await sharp(output).metadata();

    if (!outputMetadata.width || !outputMetadata.height) {
      return jsonError("PROCESSING_FAILED", 500);
    }

    // 16. Calculate results.
    const savings =
      ((file.size - output.length) / file.size) * 100;

    const extension =
      outputFormat === "jpeg" ? "jpg" : outputFormat;

    const outputName =
      `${safeFilename(file.name)}-compressed.${extension}`;

    // 17. Return compressed image.
    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": FORMAT_MIME_TYPES[outputFormat],
        "Content-Disposition": `attachment; filename="${outputName}"`,
        "Content-Length": String(output.length),
        "Cache-Control": "no-store",

        "X-Original-Size": String(file.size),
        "X-Output-Size": String(output.length),
        "X-Savings-Percent": savings.toFixed(2),

        "X-Original-Width": String(metadata.width),
        "X-Original-Height": String(metadata.height),

        "X-Output-Width": String(outputMetadata.width),
        "X-Output-Height": String(outputMetadata.height),

        "X-Output-Format": outputFormat,
        "X-Target-Size": targetSize ? String(targetSize) : "",
      },
    });
  } catch (error) {
    console.error("Image compression API error:", error);

    return jsonError("PROCESSING_FAILED", 500);
  }
}
