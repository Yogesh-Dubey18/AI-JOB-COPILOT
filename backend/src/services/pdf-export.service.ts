export async function exportResumePdfPlaceholder(resumeVersionId: string) {
  return {
    resumeVersionId,
    pdfUrl: "/uploads/generated-resume-placeholder.pdf",
    note: "PDF export is wired as a deployment-ready placeholder. Connect a renderer such as Playwright or React PDF in production."
  };
}
