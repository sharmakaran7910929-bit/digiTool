
import sharp from "sharp";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const MAX_DIMENSION = 8000;

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
  EMPTY_FILE: "The selected image is empty. Please choose another file.",
  FILE_TOO_LARGE: "Image size exceeds the 20 MB limit.",
  UNSUPPORTED_FORMAT:
    "Unsupported image format. Please upload JPEG, PNG, WebP or AVIF.",
  CORRUPTED_IMAGE:
    "This image appears to be damaged or corrupted. Please upload a valid image.",
  INVALID_QUALITY: "Quality must be a whole number between 10 and 100.",
  INVALID_FORMAT: "Please select a supported output format.",
  INVALID_DIMENSIONS:
    "Image dimensions must be whole numbers between 1 and 8000 pixels.",
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

function getProcessingError(error) {
  const message = String(error?.message || "").toLowerCase();

  if (
    message.includes("pixel limit") ||
    message.includes("exceeds pixel limit") ||
    message.includes("image exceeds")
  ) {
    return {
      code: "IMAGE_TOO_LARGE",
      status: 413,
    };
  }

  if (
    message.includes("unsupported image format") ||
    message.includes("unsupported format") ||
    message.includes("input file contains unsupported image format")
  ) {
    return {
      code: "UNSUPPORTED_FORMAT",
      status: 415,
    };
  }

  if (
    message.includes("corrupt") ||
    message.includes("unexpected end") ||
    message.includes("premature end") ||
    message.includes("invalid image") ||
    message.includes("bad seek")
  ) {
    return {
      code: "CORRUPTED_IMAGE",
      status: 422,
    };
  }

  return {
    code: "PROCESSING_FAILED",
    status: 500,
  };
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

    // 7. Validate aspect-ratio setting.
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

    // Default to preserving proportions if the field is omitted.
    const keepRatio = keepRatioValue !== "false";

    // 8. Validate progressive JPEG setting.
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

    // 9. Read image.
    const input = Buffer.from(await file.arrayBuffer());

    let image = sharp(input, {
      limitInputPixels: MAX_PIXELS,
      failOn: "error",
    });

    let metadata;

    try {
      metadata = await image.metadata();
    } catch {
      return jsonError("CORRUPTED_IMAGE", 422);
    }

    // 10. Verify actual image format.
    if (!SUPPORTED_FORMATS.includes(metadata.format)) {
      return jsonError("UNSUPPORTED_FORMAT", 415);
    }

    if (!metadata.width || !metadata.height) {
      return jsonError("CORRUPTED_IMAGE", 422);
    }

    // 11. Reject animated images.
    if (metadata.pages && metadata.pages > 1) {
      return jsonError("ANIMATED_IMAGE", 422);
    }

    // 12. Determine output format.
    const outputFormat =
      normalizedFormat === "original"
        ? metadata.format
        : normalizedFormat;

    if (!SUPPORTED_FORMATS.includes(outputFormat)) {
      return jsonError("INVALID_FORMAT", 400);
    }

    // 13. Configure image resizing.
    if (width || height) {
      image = image.resize({
        width,
        height,

        // ON: preserve original proportions.
        // OFF: force the requested width and height.
        fit: keepRatio ? "inside" : "fill",

        // Allow resizing to enlarge smaller images.
        withoutEnlargement: false,

        // Avoid unexpected cropping.
        position: "centre",
      });
    }

    // 14. JPEG cannot preserve transparency.
    if (outputFormat === "jpeg" && metadata.hasAlpha) {
      image = image.flatten({
        background: "#ffffff",
      });
    }

    // 15. Configure output encoder.
    switch (outputFormat) {
      case "jpeg":
        image = image.jpeg({
          quality,
          progressive,
          mozjpeg: true,
        });
        break;

      case "png":
        image = image.png({
          compressionLevel: 9,
          adaptiveFiltering: true,
        });
        break;

      case "webp":
        image = image.webp({
          quality,
          effort: 4,
        });
        break;

      case "avif":
        image = image.avif({
          quality,
          effort: 4,
        });
        break;

      default:
        return jsonError("INVALID_FORMAT", 400);
    }

    // 16. Process image.
    let output;

    try {
      output = await image.toBuffer();
    } catch (error) {
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

    // 17. Read actual output dimensions.
    const outputMetadata = await sharp(output).metadata();

    if (!outputMetadata.width || !outputMetadata.height) {
      return jsonError("PROCESSING_FAILED", 500);
    }

    // 18. Calculate compression results.
    const savings =
      ((file.size - output.length) / file.size) * 100;

    const extension =
      outputFormat === "jpeg" ? "jpg" : outputFormat;

    const outputName =
      `${safeFilename(file.name)}-compressed.${extension}`;

    // 19. Return compressed image.
    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": FORMAT_MIME_TYPES[outputFormat],

        "Content-Disposition":
          `attachment; filename="${outputName}"`,

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
      },
    });
  } catch (error) {
    console.error("Image compression API error:", error);

    return jsonError("PROCESSING_FAILED", 500);
  }
}
