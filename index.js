const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const logger = require('./src/lib/logger');
const asianBillRouter = require('./router');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('views', path.join(__dirname, '/src/views'));
app.set('view engine', 'ejs');

app.use(asianBillRouter);

app.listen(process.env.PORT, () => {
  logger.info('update3');
  logger.info(`app listening at ${process.env.PORT}`);
});
