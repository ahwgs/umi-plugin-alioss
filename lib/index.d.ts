/**
 * umi-plugin-oss
 *
 * @export
 * @param {*} api umi相关
 * @param {*} options 插件配置
 */
import { IApi } from 'umi-plugin-types';
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
    enabled: boolean;
    cdnPrefix?: string;
    uploadPath: string;
    exclude?: RegExp;
    ignoreHtml: boolean;
}
export default function (api: IApi, opts: PluginOptions): never;
