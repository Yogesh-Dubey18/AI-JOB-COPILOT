type PdfExportType = "resume-version" | "application-kit" | "portfolio" | "interview-prep";

export async function createPdfExportJob(input: { ownerId?: string; sourceId: string; type: PdfExportType; title?: string }) {
  const fileSlug = [input.type, input.sourceId].join("-").replace(/[^a-zA-Z0-9._-]/g, "-");
  return {
    sourceId: input.sourceId,
    ownerId: input.ownerId,
    type: input.type,
    title: input.title || "AI Job Copilot export",
    status: "ready-placeholder",
    pdfUrl: `/uploads/${fileSlug}.pdf`,
    renderer: "placeholder",
    note: "PDF export foundation is wired. Connect Playwright, React PDF, or a hosted renderer before producing production PDFs.",
    createdAt: new Date().toISOString()
  };
}

export async function exportResumePdfPlaceholder(resumeVersionId: string, ownerId?: string) {
  return createPdfExportJob({ ownerId, sourceId: resumeVersionId, type: "resume-version", title: "Resume export" });
}
