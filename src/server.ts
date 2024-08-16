import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { PRRoute } from './routes/pr.route';
import { SheetRoute } from './routes/sheet.route';
import { UserRoute } from './routes/user.route';
import { ValidateEnv } from '@utils/validateEnv';
import { VoteRoute } from './routes/vote.route';

ValidateEnv();

const app = new App([new AuthRoute(), new VoteRoute(), new UserRoute(), new PRRoute(), new SheetRoute()]);

app.listen();
