// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import axios, { AxiosError } from 'axios'
import paramsBuilder from './params-builder'

// import router from "@/router";

const getAxiosInstance = () => {
  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
    headers: {
      'Content-type': 'application/json',
      'from-browser':'true'
    }
  })
  // Add interceptors for request
  axiosInstance.interceptors.request.use(
    config => {

      if (!navigator.onLine) {
        console.error('عدم اتصال به اینترنت!')
        return config
      }


      return config
    },
    error => {

      return Promise.reject(error)
    }
  )

  axiosInstance.interceptors.response.use(
    function (response) {
      return response
    },
    function (error: AxiosError) {
      return Promise.reject(JSON.parse(error.request.response))
    }
  )

  return axiosInstance
}

const getCancelToken = (cancelTokenSource: any) =>
  cancelTokenSource ? cancelTokenSource.token : null

// clone instance and add new config to instance
const getInstance = (newAxiosConfig: any) => {
  const instance = getAxiosInstance()
  Object.keys(newAxiosConfig).forEach(
    (property) => (instance.defaults[property] = newAxiosConfig[property])
  )

  return instance
}

const http = {
  get: (
    url,
    cancelTokenSource = null,
    httpOptions = {}
  ) => {
    const instance = getInstance(httpOptions)

    return instance.get(url, {
      cancelToken: getCancelToken(cancelTokenSource)
    })
  },

  getByParams: (
    url,
    params,
    cancelTokenSource = null,
    httpOptions = {}
  ) => {
    const instance = getInstance(httpOptions)
    // instance.defaults.headers['Content-type'] = 'application/x-www-form-urlencoded';

    let readyParams = {}
    if (params) {
      // to remove empty params
      const paramsWithoutEmpty = {}
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== null &&
          params[key] !== '' &&
          params[key] !== undefined
        ) {
          paramsWithoutEmpty[key] = params[key]
        }
      })

      readyParams = decodeURIComponent(paramsBuilder(paramsWithoutEmpty))
    }
    // Note: correct querystring => ?id=1&myArray[]=1&myArray[]=2
    // but aspcore can't handle this , then querystring change to above line(remove [])

    return instance.get(url + '?' + readyParams, {
      cancelToken: getCancelToken(cancelTokenSource)
    })
    // return instance.get(url, { params: params, cancelToken: getCancelToken(cancelTokenSource) }); //  it makes params too.they are the same
  },

  postByParams: (
    url,
    params = null,
    cancelTokenSource = null,
    httpOptions = {}
  ) => {
    const instance = getInstance(httpOptions)

    let readyParams = {}
    if (params) readyParams = paramsBuilder(params)

    return instance.post(url, readyParams, {
      cancelToken: getCancelToken(cancelTokenSource)
    })
  },

  post: (
    url,
    payload,
    cancelTokenSource = null,
    httpOptions = {}
  ) => {
    const instance = getInstance(httpOptions)

    return instance.post(url, payload, {
      cancelToken: getCancelToken(cancelTokenSource)
    })
  },

  postByFormData: (
    url,
    formData,
    cancelTokenSource = null,
    httpOptions = {}
  ) => {
    const instance = getInstance(httpOptions)

    return instance.post(url, formData, {
      headers: { 'Content-type': 'multipart/form-data' },
      cancelToken: getCancelToken(cancelTokenSource)
    })
  },

  put: (
    url,
    payload,
    cancelTokenSource = null,
    httpOptions = {}
  ) => {
    const instance = getInstance(httpOptions)

    return instance.put(url, payload, {
      cancelToken: getCancelToken(cancelTokenSource)
    })
  },

  delete: (
    url,
    cancelTokenSource = null,
    httpOptions = {}
  ) => {
    const instance = getInstance(httpOptions)

    return instance.delete(url, {
      cancelToken: getCancelToken(cancelTokenSource)
    })
  },

  patch: (
    url,
    payload,
    cancelTokenSource = null,
    httpOptions = {}
  ) => {
    const instance = getInstance(httpOptions)

    return instance.patch(url, payload, {
      cancelToken: getCancelToken(cancelTokenSource)
    })
  }
}

export { http }
