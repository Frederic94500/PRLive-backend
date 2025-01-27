import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { NominationRoute } from './routes/nomination.route';
import { PRRoute } from './routes/pr.route';
import { ServerRoute } from './routes/server.route';
import { SheetRoute } from './routes/sheet.route';
import { UserRoute } from './routes/user.route';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const app = new App([new AuthRoute(), new UserRoute(), new PRRoute(), new SheetRoute(), new NominationRoute(), new ServerRoute()]);

app.listen();
