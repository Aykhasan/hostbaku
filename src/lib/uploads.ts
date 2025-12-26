import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export interface UploadedFile {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export async function ensureUploadDir(subDir?: string): Promise<string> {
  const dir = subDir ? path.join(UPLOAD_DIR, subDir) : UPLOAD_DIR;
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  return dir;
}

export async function saveFile(
  fileBuffer: Buffer,
  originalName: string,
  subDir: string = 'general'
): Promise<UploadedFile> {
  const dir = await ensureUploadDir(subDir);
  
  const ext = path.extname(originalName);
  const fileName = `${uuidv4()}${ext}`;
  const filePath = path.join(dir, fileName);
  
  await writeFile(filePath, fileBuffer);
  
  return {
    filePath: path.join(subDir, fileName),
    fileName: originalName,
    fileSize: fileBuffer.length,
    mimeType: getMimeType(ext),
  };
}

export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, filePath);
  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

export function getFilePath(relativePath: string): string {
  return path.join(UPLOAD_DIR, relativePath);
}

export function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

export function isValidImageType(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType);
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

// Process base64 image from form data
export async function saveBase64Image(
  base64Data: string,
  subDir: string = 'photos'
): Promise<UploadedFile> {
  // Remove data URL prefix if present
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  let buffer: Buffer;
  let ext = '.jpg';
  
  if (matches && matches.length === 3) {
    const mimeType = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
    
    if (mimeType === 'image/png') ext = '.png';
    else if (mimeType === 'image/gif') ext = '.gif';
    else if (mimeType === 'image/webp') ext = '.webp';
  } else {
    buffer = Buffer.from(base64Data, 'base64');
  }
  
  const dir = await ensureUploadDir(subDir);
  const fileName = `${uuidv4()}${ext}`;
  const filePath = path.join(dir, fileName);
  
  await writeFile(filePath, buffer);
  
  return {
    filePath: path.join(subDir, fileName),
    fileName,
    fileSize: buffer.length,
    mimeType: getMimeType(ext),
  };
}
