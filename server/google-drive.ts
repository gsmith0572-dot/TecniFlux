import { google } from "googleapis";
import { Readable } from "stream";

const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
];

/**
 * Obtiene un cliente de Google Drive autenticado usando service account credentials
 * desde las variables de entorno GDRIVE_CLIENT_EMAIL y GDRIVE_PRIVATE_KEY
 */
function getGoogleDriveClient() {
  const clientEmail = process.env.GDRIVE_CLIENT_EMAIL;
  let privateKey = process.env.GDRIVE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Google Drive credentials not configured. Set GDRIVE_CLIENT_EMAIL and GDRIVE_PRIVATE_KEY."
    );
  }

  // Importante: reemplazar '\n' por saltos de línea reales
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: DRIVE_SCOPES,
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Descarga un archivo PDF de Google Drive y lo devuelve como Buffer
 */
export async function downloadFileFromDrive(fileId: string): Promise<Buffer> {
  try {
    const drive = getGoogleDriveClient();

    const res = await drive.files.get(
      {
        fileId,
        alt: "media",
      },
      {
        responseType: "arraybuffer",
      }
    );

    return Buffer.from(res.data as ArrayBuffer);
  } catch (err) {
    console.error("Error downloading file from Google Drive:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to download file from Google Drive: ${errorMessage}`);
  }
}

/**
 * Sube un PDF a una carpeta de Drive (crea la carpeta si no existe).
 * Es usado por las rutas de ADMIN cuando subes nuevos diagramas.
 */
export async function uploadPDFToDrive(
  fileBuffer: Buffer,
  fileName: string,
  folderName: string
): Promise<{ fileId: string; fileUrl: string; directUrl: string }> {
  try {
    const drive = getGoogleDriveClient();

    // 1) Buscar o crear carpeta
    let folderId: string | null = null;

    const searchRes = await drive.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(
        /'/g,
        "\\'"
      )}' and trashed = false`,
      fields: "files(id, name)",
      pageSize: 1,
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      folderId = searchRes.data.files[0].id!;
    } else {
      const folderRes = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      folderId = folderRes.data.id!;
    }

    // 2) Subir archivo
    const fileRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
        mimeType: "application/pdf",
      },
      media: {
        mimeType: "application/pdf",
        body: bufferToStream(fileBuffer),
      },
      fields: "id, webViewLink, webContentLink",
    });

    const fileId = fileRes.data.id!;
    const fileUrl = fileRes.data.webViewLink || "";
    const directUrl =
      fileRes.data.webContentLink ||
      `https://drive.google.com/uc?export=download&id=${fileId}`;

    return { fileId, fileUrl, directUrl };
  } catch (err) {
    console.error("Error uploading file to Google Drive:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to upload file to Google Drive: ${errorMessage}`);
  }
}

/**
 * Elimina un archivo de Google Drive
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  try {
    const drive = getGoogleDriveClient();
    await drive.files.delete({ fileId });
  } catch (err) {
    console.error("Error deleting file from Google Drive:", err);
    // Best effort; no relanzar el error
  }
}

/**
 * Convierte un Buffer en ReadableStream para Google APIs
 */
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
