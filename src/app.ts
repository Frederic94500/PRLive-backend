import 'reflect-metadata';

import { CREDENTIALS, LOG_FORMAT, NODE_ENV, ORIGIN, PORT } from '@config';
import { logger, stream } from '@utils/logger';

import { ErrorMiddleware } from '@middlewares/error.middleware';
import { Routes } from '@interfaces/routes.interface';
import Strategy from 'passport-discord';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { dbConnection } from '@database';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public passport: passport.PassportStatic;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3000;

    this.connectToDatabase();
    this.initializeMiddlewares();
    this.initializeHeaders();
    this.initializeSession();
    this.initializePassport();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private async connectToDatabase() {
    await dbConnection();
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    if (this.env === 'production') {
      this.app.set('trust proxy', 1);
    }
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use('/', route.router);
    });
  }

  private initializeSwagger() {
    const options = {
      swaggerDefinition: {
        info: {
          title: 'PRLive-backend',
          version: '1.0.0',
          description: 'PRLive-backend API',
        },
        components: {
          securityDefinitions: {
            discordOauth2: {
              type: 'oauth2',
              description: 'This API uses OAuth 2.0 with the Discord API',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://discord.com/api/oauth2/authorize',
                  scopes: { identify: "Grants read access to a user's profile data" },
                },
              },
            },
          },
        },
      },
      apis: ['swagger.yaml'],
    };

    const specs = swaggerJSDoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }

  private initializeHeaders() {
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', ORIGIN);
      res.header('Access-Control-Allow-Credentials', CREDENTIALS.toString());
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      next();
    });
  }

  private initializeSession() {
    this.app.use(
      session({
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: this.env === 'production' ? true : false,
          maxAge: 15 * 24 * 60 * 60 * 1000,
        },
      }),
    );
  }

  private initializePassport() {
    passport.serializeUser(function (user, done) {
      done(null, user);
    });
    passport.deserializeUser(function (user, done) {
      done(null, user);
    });
    passport.use(
      new Strategy(
        {
          clientID: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET,
          callbackURL: process.env.DISCORD_REDIRECT_URI,
          scope: ['identify'],
        },
        (accessToken, refreshToken, profile, done) => {
          return done(null, profile);
        },
      ),
    );
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  }
}
