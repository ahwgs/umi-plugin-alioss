"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var OSS = require('ali-oss');
var path = require('path');
var fs = require('fs');
var os = require('os');
var readdirSync = fs.readdirSync, statSync = fs.statSync;
/**
 * 上传的文件集合
 */
var uploadFiles = [];
/**
 * 判断是否是windows
 */
function isWindows() {
    var sysType = os.type();
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
function filterFile(filePath, options) {
    var exclude = options.exclude;
    var ignoreHtml = options.ignoreHtml;
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
function readDirSync(fPath, option) {
    var allFiles = readdirSync(fPath);
    allFiles.forEach(function (item) {
        var filePath = fPath + "/" + item;
        var info = statSync(filePath);
        if (info.isDirectory()) {
            readDirSync(filePath, option);
        }
        else if (filterFile(filePath, option)) {
            uploadFiles.push(filePath);
        }
    });
}
/**
 *加载配置文件
 * @param {*} path 文件路径
 */
function loadConfig(filePath, api) {
    try {
        var content = fs.readFileSync(filePath, 'utf8');
        var temp = content.split(line()).map(function (text) {
            var _a;
            var payload = text.split('=');
            return _a = {},
                _a[payload[0]] = payload[1],
                _a;
        });
        var result_1 = {};
        temp.forEach(function (tmp) {
            result_1 = tslib_1.__assign(tslib_1.__assign({}, result_1), tmp);
        });
        return result_1;
    }
    catch (err) {
        api.log.error(filePath + "\u4E0D\u662F\u4E00\u4E2A\u6B63\u786E\u7684\u8DEF\u5F84\u6216\u6587\u4EF6");
        return false;
    }
}
/**
 * 上传文件
 * @param {*} fils 要上传的列表
 */
function uploadFile(fils, ossConfig, options, api) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var ossClient, globalStartTime, uploadPath, cdnPrefix, paths, absOutputPath, _i, fils_1, file, result, name_1, url;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ossClient = new OSS(ossConfig);
                    globalStartTime = Date.now();
                    uploadPath = options.uploadPath, cdnPrefix = options.cdnPrefix;
                    paths = api.paths;
                    absOutputPath = paths.absOutputPath;
                    _i = 0, fils_1 = fils;
                    _a.label = 1;
                case 1:
                    if (!(_i < fils_1.length)) return [3 /*break*/, 4];
                    file = fils_1[_i];
                    return [4 /*yield*/, ossClient.put(("" + file).replace(absOutputPath, uploadPath), file)];
                case 2:
                    result = _a.sent();
                    name_1 = result.name, url = result.url;
                    if (cdnPrefix) {
                        api.log.complete("\u4E0A\u4F20\u6210\u529F => " + cdnPrefix + name_1);
                    }
                    else {
                        api.log.complete("\u4E0A\u4F20\u6210\u529F => " + url);
                    }
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, new Promise(function (resolve) { return resolve(Date.now() - globalStartTime); })];
            }
        });
    });
}
var defaultOptions = {
    ossConfig: {
        region: '',
        bucket: '',
        secure: true,
    },
    configName: '.alioss',
    enabled: true,
    cdnPrefix: '',
    uploadPath: '',
    exclude: /.DS_Store/,
    ignoreHtml: false,
};
function default_1(api, opts) {
    var options = tslib_1.__assign(tslib_1.__assign({}, defaultOptions), opts);
    var ossConfig = options.ossConfig, uploadPath = options.uploadPath, enabled = options.enabled, configName = options.configName;
    var isDev = process.env.NODE_ENV === 'development';
    var paths = api.paths;
    var absOutputPath = paths.absOutputPath, cwd = paths.cwd;
    if (!isDev && enabled) {
        var aliossConfigPath = path.join(os.homedir() + "/" + configName);
        api.log.info("\uD83D\uDE0A \u5F53\u524D\u914D\u7F6E\u6587\u4EF6\u8DEF\u5F84" + aliossConfigPath);
        var ossSecret = loadConfig(aliossConfigPath, api);
        if (!ossSecret) {
            api.log.error("\uD83C\uDF49 \u8BF7\u6B63\u786E\u914D\u7F6E" + configName + "\u6587\u4EF6\n");
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
        var newOssConfig_1 = tslib_1.__assign(tslib_1.__assign({}, ossConfig), ossSecret);
        api.onBuildSuccess(function () {
            api.log.info('🤗 应用构建完成 准备上传至OSS\n');
            readDirSync(absOutputPath, options);
            api.log.info("\u23F0 \u5F85\u4E0A\u4F20\u6587\u4EF6\u603B\u6570\uFF1A" + uploadFiles.length + "\n");
            if (uploadFiles.length === 0) {
                return api.log.error('🍉 没有需要上传的文件\n');
            }
            (function () {
                return tslib_1.__awaiter(this, void 0, void 0, function () {
                    var res, e_1;
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, uploadFile(uploadFiles, newOssConfig_1, options, api)];
                            case 1:
                                res = _a.sent();
                                api.log.log('');
                                api.log.success("\uD83C\uDF89 \u4E0A\u4F20\u6587\u4EF6\u8017\u65F6\uFF1A " + res / 1000 + "s\n");
                                api.log.success("\uD83C\uDF89 \u5DF2\u4E0A\u4F20\u6587\u4EF6\u6570\uFF1A " + uploadFiles.length + "\n");
                                return [3 /*break*/, 3];
                            case 2:
                                e_1 = _a.sent();
                                return [2 /*return*/, api.log.error(e_1 + "\n")];
                            case 3: return [2 /*return*/];
                        }
                    });
                });
            })();
        });
    }
}
exports.default = default_1;
