import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { SongRoute } from '@routes/song.route';
import { ValidateEnv } from '@utils/validateEnv';
import { VoteRoute } from './routes/vote.route';

ValidateEnv();

const app = new App([new AuthRoute(), new SongRoute(), new VoteRoute()]);

app.listen();
