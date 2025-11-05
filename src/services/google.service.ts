import { google } from 'googleapis';
import fs from 'fs';

import { PR } from "@/interfaces/pr.interface";
import { User } from "@/interfaces/user.interface";
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URIS, GOOGLE_SECRET } from '@/config';
import { Sheet, SheetSong } from '@/interfaces/sheet.interface';

const TOKEN_PATH = 'token.json';

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_SECRET,
  GOOGLE_REDIRECT_URIS[0]
);

if (fs.existsSync(TOKEN_PATH)) {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);
}

oAuth2Client.on('tokens', (tokens) => {
  try {
    let currentTokens = {};
    if (fs.existsSync(TOKEN_PATH)) {
      currentTokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    }

    const updatedTokens = {
      ...currentTokens,
      ...tokens,
      refresh_token: tokens.refresh_token || (currentTokens as any).refresh_token,
    };

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedTokens, null, 2));
    console.log('✅ Token refreshed and saved.');
  } catch (err) {
    console.error('❌ Error saving refreshed token:', err);
  }
});

function computeColumnWidths(songsSheetId: number, header: string[], rows: string[][]) {
  const pxPerChar = 8.5;
  const minWidth = 90;
  const maxWidth = 400;
  const padding = 30;
  const fixedUrlWidth = 60;

  const columnWidths: number[] = header.map((colName, colIndex) => {
    if (colName === "Video" || colName === "Audio") {
      return fixedUrlWidth;
    }

    let maxLen = colName.length;
    for (const row of rows) {
      const val = row[colIndex] ? String(row[colIndex]) : "";
      if (val.length > maxLen) maxLen = val.length;
    }

    const estimated = Math.min(
      maxWidth,
      Math.max(minWidth, Math.round(maxLen * pxPerChar) + padding)
    );
    return estimated;
  });

  return columnWidths.map((w, i) => ({
    updateDimensionProperties: {
      range: {
        sheetId: songsSheetId,
        dimension: "COLUMNS",
        startIndex: i,
        endIndex: i + 1,
      },
      properties: { pixelSize: w },
      fields: "pixelSize",
    },
  }));
}

export async function createSpreadsheet(pr: PR, user: User, sheet: Sheet): Promise<string> {
  const auth = oAuth2Client;
  const sheets = google.sheets({ version: "v4", auth });

  const sheetTitle = `PR ${pr.name} - ${user.name}`;
  const header = [
    "UUID",
    "Order ID",
    "Artist",
    "Title",
    "Source",
    "Song Type",
    "Video",
    "Audio",
    "Rank",
    "Score",
    "Comments",
  ];

  const rows = pr.songList.map((song) => {
    const artist = pr.nomination ? pr.nomination.blind ? "" : song.artist : song.artist;
    const title = pr.nomination ? pr.nomination.blind ? "" : song.title : song.title;
    const source = pr.nomination ? pr.nomination.blind ? "" : song.source : song.source;
    const type = pr.nomination ? pr.nomination.blind ? "" : song.type : song.type;
    const videoUrl = pr.nomination ? pr.nomination.blind ? "" : `=HYPERLINK("${song.urlVideo}", "Video")` : `=HYPERLINK("${song.urlVideo}", "Video")`;

    const rank = sheet.sheet.find(s => s.uuid === song.uuid)?.rank || "";
    const score = sheet.sheet.find(s => s.uuid === song.uuid)?.score || "";
    const comment = sheet.sheet.find(s => s.uuid === song.uuid)?.comment || "";

    return [
      song.uuid,
      song.orderId,
      artist,
      title,
      source,
      type,
      videoUrl,
      `=HYPERLINK("${song.urlAudio}", "Audio")`,
      rank,
      score,
      comment,
    ]
  });

  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: sheetTitle },
      sheets: [
        {
          properties: { title: "Songs" },
          data: [
            {
              rowData: [
                { values: header.map((h) => ({ userEnteredValue: { stringValue: h } })) },
                ...rows.map((row) => ({
                  values: row.map((cell) => ({
                    userEnteredValue: String(cell).startsWith("=")
                      ? { formulaValue: cell }
                      : { stringValue: String(cell) },
                  })),
                })),
              ],
            },
          ],
        },
        {
          properties: { title: "Meta", hidden: true },
          data: [
            {
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: "PR_ID" } },
                    { userEnteredValue: { stringValue: pr._id || "" } },
                  ],
                },
                {
                  values: [
                    { userEnteredValue: { stringValue: "USER_ID" } },
                    { userEnteredValue: { stringValue: user._id || user.discordId || "" } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId!;
  const songsSheetId = createRes.data.sheets?.find(
    (s) => s.properties?.title === "Songs"
  )?.properties?.sheetId!;
  const metaSheetId = createRes.data.sheets?.find(
    (s) => s.properties?.title === "Meta"
  )?.properties?.sheetId!;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateDimensionProperties: {
            range: {
              sheetId: songsSheetId,
              dimension: "COLUMNS",
              startIndex: 0,
              endIndex: 1,
            },
            properties: { hiddenByUser: true },
            fields: "hiddenByUser",
          },
        },

        {
          repeatCell: {
            range: { sheetId: songsSheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                horizontalAlignment: "CENTER",
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true,
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
          },
        },

        {
          repeatCell: {
            range: {
              sheetId: songsSheetId,
              startRowIndex: 1,
              endRowIndex: rows.length + 1,
              startColumnIndex: header.indexOf("Video"),
              endColumnIndex: header.indexOf("Audio") + 1,
            },
            cell: {
              userEnteredFormat: {
                horizontalAlignment: "CENTER",
              },
            },
            fields: "userEnteredFormat.horizontalAlignment",
          },
        },

        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: songsSheetId,
              dimension: "COLUMNS",
              startIndex: 0,
              endIndex: header.length,
            },
          },
        },

        {
          addBanding: {
            bandedRange: {
              range: {
                sheetId: songsSheetId,
                startRowIndex: 1,
                endRowIndex: rows.length + 1,
                startColumnIndex: 0,
                endColumnIndex: header.length,
              },
              rowProperties: {
                firstBandColor: { red: 0.96, green: 0.96, blue: 0.96 },
                secondBandColor: { red: 1, green: 1, blue: 1 },
              },
            },
          },
        },

        {
          setBasicFilter: {
            filter: {
              range: {
                sheetId: songsSheetId,
                startRowIndex: 0,
                endRowIndex: rows.length + 1,
                startColumnIndex: 0,
                endColumnIndex: header.length,
              },
            },
          },
        },

        {
          addProtectedRange: {
            protectedRange: {
              range: { sheetId: metaSheetId },
              description: "Meta sheet (read-only)",
              warningOnly: false,
              editors: { users: [] },
            },
          },
        },
      ],
    },
  });

  const columnWidthRequests = computeColumnWidths(songsSheetId, header, rows);

  sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        ...columnWidthRequests
      ],
    },
  });

  const drive = google.drive({ version: "v3", auth });
  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: { role: "writer", type: "anyone" },
  });

  return spreadsheetId;
}

export async function importSpreadsheetToSheet(id: string): Promise<SheetSong[]> {
  const auth = oAuth2Client;
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: "Songs",
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) {
    throw new Error("No data found in the spreadsheet.");
  }

  const header = rows[0];
  const dataRows = rows.slice(1).sort((a, b) => {
    const orderIdIndex = header.indexOf("Order ID");
    const orderA = parseInt(a[orderIdIndex], 10);
    const orderB = parseInt(b[orderIdIndex], 10);
    return orderA - orderB;
  });
  const sheetData: SheetSong[] = [];

  for (const row of dataRows) {
    const uuidIndex = header.indexOf("UUID");
    const orderIdIndex = header.indexOf("Order ID");
    const rankIndex = header.indexOf("Rank");
    const scoreIndex = header.indexOf("Score");
    const commentIndex = header.indexOf("Comments");
    
    const uuid = row[uuidIndex].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)?.[0];
    const orderId = parseInt(row[orderIdIndex], 10);
    const rank = rankIndex !== -1 && row[rankIndex] ? parseInt(row[rankIndex], 10) : null;
    const score = scoreIndex !== -1 && row[scoreIndex] ? parseFloat(row[scoreIndex]) : null;
    const comment = commentIndex !== -1 ? row[commentIndex] : '';

    if (uuid && !isNaN(orderId)) {
      sheetData.push({ uuid, orderId, rank, score, comment });
    }
  }

  return sheetData;
}
