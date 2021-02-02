const axios = require('axios');
const qs = require('querystring');
const xml2js = require('xml2js');
const HttpsProxyAgent = require('https-proxy-agent');

const xmlParser = new xml2js.Parser({explicitArray: false});

const Axios = {
  instance: null,

  createInstance() {
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      transformRequest: [function (data) {
        return qs.stringify(data);
      }],
      httpsAgent: undefined as any
    };
    if (process.env.ENABLE_PROXY === 'true') {
      config.httpsAgent = new HttpsProxyAgent({
        host: process.env.PROXY_HOST,
        port: process.env.PROXY_PORT,
        auth: `${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}`,
      });
    }
    const instance = axios.create(config);

    // request interceptor
    instance.interceptors.request.use(function (config) {
      // Do something before request is sent
      return config;
    }, function (error) {
      // Do something with request error
      return Promise.reject(error);
    });

    // response interceptor
    instance.interceptors.response.use(function (response) {
      // Any status code that lie within the range of 2xx cause this function to trigger
      return xmlParser.parseStringPromise(response.data).then((result) => {
        response.data = result;
        return response;
      }).catch((_) => {
        return response;
      });
    }, function (error) {
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      return Promise.reject(error);
    });

    return instance;
  },

  getInstance() {
    if (this.instance == null) {
      this.instance = this.createInstance();
      return this.instance;
    }
    return this.instance;
  },
};

export default Axios;
