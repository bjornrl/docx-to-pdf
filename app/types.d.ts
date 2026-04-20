declare module "html2pdf.js";
declare module "mammoth/mammoth.browser" {
  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer },
    options?: { styleMap?: string[] }
  ): Promise<{ value: string; messages: unknown[] }>;
  const mammoth: { convertToHtml: typeof convertToHtml };
  export default mammoth;
}
