const dotenv = require('dotenv');
dotenv.config();
import Express         from 'express';
import * as path       from 'path';
import * as bodyParser from 'body-parser'
import logger          from './src/lib/logger';
import router          from './router';

const app = Express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('views', path.join(__dirname, '/src/views'));
app.set('view engine', 'ejs');


app.use(router);

app.listen(process.env.PORT, () => {
  logger.info(`app listening at ${process.env.PORT}`);
});
