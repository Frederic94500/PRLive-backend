import { google } from 'googleapis';
import readline from 'readline';
import fs from 'fs';
import { config } from 'dotenv';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = 'token.json';

config({ path: `../.env.${process.env.NODE_ENV || 'development'}.local` });
export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const GOOGLE_CREDJSON = process.env.GOOGLE_B64_CREDJSON
	? JSON.parse(Buffer.from(process.env.GOOGLE_B64_CREDJSON, 'base64').toString('utf-8'))
	: null;
export const { client_id, client_secret, redirect_uris } = GOOGLE_CREDJSON.web;

console.log(GOOGLE_CREDJSON);

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

async function getAccessToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Ouvre ce lien dans ton navigateur :', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code: string = await new Promise((resolve) => {
    rl.question('Entrez le code ici : ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('✅ Token enregistré dans', TOKEN_PATH);
}

getAccessToken().catch(console.error);
