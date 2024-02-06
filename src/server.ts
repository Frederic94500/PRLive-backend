import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { SongRoute } from '@routes/song.route';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const app = new App([new AuthRoute(), new SongRoute()]);

app.listen();
