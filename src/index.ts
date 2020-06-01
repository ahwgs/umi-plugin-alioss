/**
 * umi-plugin-oss
 *
 * @export
 * @param {*} api umi相关
 * @param {*} options 插件配置
 */
import { IApi } from 'umi-plugin-types';
const OSS = require('ali-oss');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * OSS配置
 */
export interface OssConfig {
  region: string /** 区域 */;
  bucket: string /** 桶名 */;
  secure: boolean;
}

/**
 * 插件配置
 */
export interface PluginOptions {
  ossConfig: OssConfig;
  configName?: string /** 配置文件名称 */;
  enabled: boolean; // 是否开启CDN上传
  cdnPrefix?: string; // CDN前缀
  uploadPath: string; // 文件上传路径
  exclude?: RegExp; // 排除文件
  ignoreHtml: boolean; // 不上传html
}

/**
 * 上传的文件集合
 */
const uploadFiles: any = [];

/**
 * 判断是否是windows
 */
function isWindows() {
  const sysType = os.type();
  return sysType === 'Windows_NT';
}

/**
 * 换行
 */
function line() {
  return isWindows() ? '\r\n' : '\n';
}

/**
 * 是否是umi3.x
 */
function isUmi3() {
  const version = process.env.UMI_VERSION;
  return version.split('.')[0] === '3';
}
const isUmi3v = isUmi3();

/**
 * 日志打印兼容umi3.x
 */
function logPrint(msg: string, key: any, api: IApi) {
  // @ts-ignore
  if (!api.log && isUmi3v) return api.logger[key] ? api.logger[key](msg) : api.logger.log(msg);
  // @ts-ignore
  return api.log[key] ? api.log[key](msg) : api.log.log(msg);
}

/**
 * 过滤文件
 */
function filterFile(filePath: string, options: PluginOptions) {
  let { exclude } = options;
  const { ignoreHtml } = options;

  if (ignoreHtml) {
    exclude = /\/*.html/;
  }

  if (exclude && exclude.test(filePath)) {
    return false;
  }

  return true;
}

/**
 * 读取所有文件
 * @param {*} fPath 构建完成之后的文件夹
 */
function readDirSync(fPath: string, option: PluginOptions) {
  const allFiles = fs.readdirSync(fPath);
  allFiles.forEach((item: any) => {
    const filePath = `${fPath}/${item}`;
    const info = fs.statSync(filePath);
    if (info.isDirectory()) {
      readDirSync(filePath, option);
    } else if (filterFile(filePath, option)) {
      uploadFiles.push(filePath);
    }
  });
}

/**
 *加载配置文件
 * @param {*} path 文件路径
 */
function loadConfig(filePath: string, api: IApi) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const temp = content.split(line()).map((text: string) => {
      const payload = text.split('=');
      return {
        [payload[0]]: payload[1],
      };
    });
    let result = {};
    temp.forEach((tmp: any) => {
      result = {
        ...result,
        ...tmp,
      };
    });
    return result;
  } catch (err) {
    logPrint(`${filePath}不是一个正确的路径或文件`, 'error', api);
    return false;
  }
}

/**
 * 上传文件
 * @param {*} fils 要上传的列表
 */
async function uploadFile(fils: any, ossConfig: OssConfig, options: PluginOptions, api: IApi) {
  // 实例化oss客户端
  const ossClient = new OSS(ossConfig);
  const globalStartTime = Date.now();
  const { uploadPath, cdnPrefix } = options;
  const { paths } = api;
  const { absOutputPath } = paths;
  for (const file of fils) {
    const result = await ossClient.put(`${file}`.replace(absOutputPath, uploadPath), file);
    const { name, url } = result;
    if (cdnPrefix) {
      logPrint(`上传成功 => ${cdnPrefix}${name}`, 'info', api);
    } else {
      logPrint(`上传成功 => ${url}`, 'info', api);
    }
  }
  return new Promise((resolve) => resolve(Date.now() - globalStartTime));
}

const defaultOptions = {
  ossConfig: {
    region: '',
    bucket: '',
    secure: true,
  },
  configName: '.alioss',
  enabled: true, // 是否开启CDN上传
  cdnPrefix: '', // CDN前缀
  uploadPath: '', // 文件上传路径
  exclude: /.DS_Store/, // 排除文件
  ignoreHtml: false, // 不上传html
};

export default function (api: IApi, opts: PluginOptions) {
  console.log('UMI_VERSION', process.env.UMI_VERSION);
  let umi3Config = {};
  if (isUmi3v) {
    // umi3.x注册插件及变量
    //@ts-ignore
    api.describe &&
      //@ts-ignore
      api.describe({
        key: 'alioss',
        config: {
          schema(joi: { object: () => any }) {
            return joi.object();
          },
        },
      });
    //@ts-ignore
    umi3Config = api.userConfig.alioss;
  }

  const options = { ...defaultOptions, ...opts, ...umi3Config };
  const { ossConfig, uploadPath, enabled, configName } = options;
  const isDev = process.env.NODE_ENV === 'development';
  const { paths } = api;
  const { absOutputPath } = paths;
  if (!isDev && enabled) {
    const aliossConfigPath = path.join(`${os.homedir()}/${configName}`);
    logPrint(`😊 当前配置文件路径${aliossConfigPath}`, 'info', api);
    const ossSecret: any = loadConfig(aliossConfigPath, api);
    if (!ossSecret) {
      logPrint(`🍉 请正确配置${configName}文件\n`, 'error', api);
      return process.exit(-1);
    }
    if (!ossSecret.accessKeyId) {
      logPrint('🍉 请正确配置accessKeyId\n', 'error', api);
      return process.exit(-1);
    }
    if (!ossSecret.accessKeySecret) {
      logPrint('🍉 请正确配置accessKeySecret\n', 'error', api);
      return process.exit(-1);
    }
    if (!uploadPath) {
      logPrint('🍉 请正确配置的uploadPath\n', 'error', api);
      return process.exit(-1);
    }
    const newOssConfig = { ...ossConfig, ...ossSecret };
    const buildFucKey = isUmi3v ? 'onBuildComplete' : 'onBuildSuccess';
    //@ts-ignore
    api[buildFucKey] &&
      //@ts-ignore
      api[buildFucKey](() => {
        logPrint('🤗 应用构建完成 准备上传至OSS\n', 'info', api);
        readDirSync(absOutputPath, options);
        logPrint(`⏰ 待上传文件总数：${uploadFiles.length}\n`, 'info', api);
        if (uploadFiles.length === 0) {
          return logPrint('🍉 没有需要上传的文件\n', 'error', api);
        }
        (async function () {
          try {
            const res: any = await uploadFile(uploadFiles, newOssConfig, options, api);
            logPrint(`🎉 上传文件耗时： ${res / 1000}s\n`, 'profile', api);
            logPrint(`🎉 已上传文件数： ${uploadFiles.length}\n`, 'profile', api);
          } catch (e) {
            return logPrint(`${e}\n`, 'error', api);
          }
        })();
      });
  }
}
