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
  region: string /**区域 */;
  bucket: string /**桶名 */;
  secure: boolean;
}

/**
 * 插件配置
 */
export interface PluginOptions {
  ossConfig: OssConfig;
  configName?: string /**配置文件名称 */;
  enabled: boolean; // 是否开启CDN上传
  cdnPrefix?: string; // CDN前缀
  uploadPath: string; // 文件上传路径
  exclude?: RegExp; // 排除文件
  ignoreHtml: boolean; // 不上传html
}

const { readdirSync, statSync } = fs;

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
  const allFiles = readdirSync(fPath);
  allFiles.forEach((item: any) => {
    const filePath = `${fPath}/${item}`;
    const info = statSync(filePath);
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
    api.log.error(`${filePath}不是一个正确的路径或文件`);
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
      api.log.complete(`上传成功 => ${cdnPrefix}${name}`);
    } else {
      api.log.complete(`上传成功 => ${url}`);
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
  const options = { ...defaultOptions, ...opts };
  const { ossConfig, uploadPath, enabled, configName } = options;
  const isDev = process.env.NODE_ENV === 'development';
  const { paths } = api;
  const { absOutputPath, cwd } = paths;
  if (!isDev && enabled) {
    const aliossConfigPath = path.join(`${os.homedir()}/${configName}`);
    api.log.info(`😊 当前配置文件路径${aliossConfigPath}`);
    const ossSecret: any = loadConfig(aliossConfigPath, api);
    if (!ossSecret) {
      api.log.error(`🍉 请正确配置${configName}文件\n`);
      return process.exit(-1);
    }
    console.log('ossSecret', ossSecret);
    if (!ossSecret.accessKeyId) {
      api.log.error('🍉 请正确配置accessKeyId\n');
      return process.exit(-1);
    }
    if (!ossSecret.accessKeySecret) {
      api.log.error('🍉 请正确配置accessKeySecret\n');
      return process.exit(-1);
    }
    if (!uploadPath) {
      api.log.error('🍉 请正确配置的uploadPath\n');
      return process.exit(-1);
    }
    const newOssConfig = { ...ossConfig, ...ossSecret };
    api.onBuildSuccess(() => {
      api.log.info('🤗 应用构建完成 准备上传至OSS\n');
      readDirSync(absOutputPath, options);
      api.log.info(`⏰ 待上传文件总数：${uploadFiles.length}\n`);
      if (uploadFiles.length === 0) {
        return api.log.error('🍉 没有需要上传的文件\n');
      }
      (async function () {
        try {
          const res: any = await uploadFile(uploadFiles, newOssConfig, options, api);
          api.log.log('');
          api.log.success(`🎉 上传文件耗时： ${res / 1000}s\n`);
          api.log.success(`🎉 已上传文件数： ${uploadFiles.length}\n`);
        } catch (e) {
          return api.log.error(`${e}\n`);
        }
      })();
    });
  }
}
