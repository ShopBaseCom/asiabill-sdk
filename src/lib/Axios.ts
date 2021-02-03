import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import qs                                                          from 'querystring'
import xml2js                                                      from 'xml2js'
import HttpsProxyAgent                                             from 'https-proxy-agent'

const xmlParser = new xml2js.Parser({explicitArray: false});

const Axios = {
  instance: null as AxiosInstance | null,

  createInstance(): AxiosInstance {
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      transformRequest: [function (data: any) {
        return qs.stringify(data);
      }],
      httpsAgent: undefined as any
    };
    if (process.env.ENABLE_PROXY === 'true') {
      config.httpsAgent = HttpsProxyAgent({
        host: process.env.PROXY_HOST,
        port: process.env.PROXY_PORT,
        auth: `${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}`,
      });
    }
    const instance = axios.create(config);

    // request interceptor
    instance.interceptors.request.use(function (config: AxiosRequestConfig) {
      // Do something before request is sent
      return config;
    }, function (error: Error) {
      // Do something with request error
      return Promise.reject(error);
    });

    // response interceptor
    instance.interceptors.response.use(function (response: AxiosResponse) {
      // Any status code that lie within the range of 2xx cause this function to trigger
      return xmlParser.parseStringPromise(response.data).then((result: any) => {
        response.data = result;
        return response;
      }).catch(() => {
        return response;
      });
    }, function (error: Error) {
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
