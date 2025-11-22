import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR } = process.env;
export const { ORIGIN, SORTERPR } = process.env;
export const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;
export const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI } = process.env;
export const { DISCORD_BOT_TOKEN, DISCORD_BOT_LOGGING_CHANNEL_ID } = process.env;
export const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME, AWS_S3_STATIC_PAGE_URL } = process.env;
export const { RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USER, RABBITMQ_PASSWORD, RABBITMQ_QUEUE } = process.env;

export const GOOGLE_KEYJSON = process.env.GOOGLE_B64_KEYJSON
	? JSON.parse(Buffer.from(process.env.GOOGLE_B64_KEYJSON, 'base64').toString('utf-8'))
	: null;
export const GOOGLE_CREDJSON = process.env.GOOGLE_B64_CREDJSON
	? JSON.parse(Buffer.from(process.env.GOOGLE_B64_CREDJSON, 'base64').toString('utf-8'))
	: null;
export const { client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_SECRET, redirect_uris: GOOGLE_REDIRECT_URIS } = GOOGLE_CREDJSON.web;
