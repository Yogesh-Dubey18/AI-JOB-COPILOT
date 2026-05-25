import { ApiError } from "../utils/ApiError.js";

export function validateResumeBuffer(buffer: Buffer, filename: string, mimeType: string): void {
  // 1. Size Validation (5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    throw new ApiError(400, "File is too large. Maximum allowed size is 5MB");
  }

  // 2. Reject known executable formats immediately
  if (buffer.length >= 2) {
    // Windows EXE/DLL: "MZ"
    if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
      throw new ApiError(400, "Risky executable file formats are rejected");
    }
  }
  if (buffer.length >= 4) {
    // Linux ELF: "\x7fELF"
    if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
      throw new ApiError(400, "Risky executable file formats are rejected");
    }
  }

  const ext = filename.split(".").pop()?.toLowerCase();

  // 3. Magic Number Validation
  if (mimeType === "application/pdf" || ext === "pdf") {
    // PDF Magic Number: "%PDF" (25 50 44 46)
    if (
      buffer.length < 4 ||
      buffer[0] !== 0x25 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x44 ||
      buffer[3] !== 0x46
    ) {
      throw new ApiError(400, "File content does not match the selected file type. Only valid PDF resumes are allowed");
    }
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    // DOCX Zip container header: "PK\x03\x04" (50 4B 03 04)
    if (
      buffer.length < 4 ||
      buffer[0] !== 0x50 ||
      buffer[1] !== 0x4b ||
      buffer[2] !== 0x03 ||
      buffer[3] !== 0x04
    ) {
      throw new ApiError(400, "File content does not match the selected file type. Only valid DOCX resumes are allowed");
    }
  } else if (mimeType === "text/plain" || ext === "txt") {
    // Text files shouldn't contain binary null bytes or look like zip/pdf
    if (buffer.includes(0x00)) {
      throw new ApiError(400, "File content does not match the selected file type. Plain text files must not contain binary data");
    }
  } else {
    throw new ApiError(400, "Only PDF and DOCX resumes are supported");
  }
}
