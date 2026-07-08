export interface PreviewImportFileDto {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
}
