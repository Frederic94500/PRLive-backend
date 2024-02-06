import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_USER, NODE_ENV } from '@config';
import { connect, set } from 'mongoose';

export const dbConnection = async () => {
  const dbConfig = {
    url: `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_DATABASE}?authSource=admin`,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true,
    },
  };

  if (NODE_ENV !== 'production') {
    set('debug', true);
  }

  await connect(dbConfig.url, dbConfig.options);
};
