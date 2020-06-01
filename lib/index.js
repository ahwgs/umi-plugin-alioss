"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var OSS = require('ali-oss');
var path = require('path');
var fs = require('fs');
var os = require('os');
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
 * 是否是umi3.x
 */
function isUmi3() {
    var version = process.env.UMI_VERSION;
    return version.split('.')[0] === '3';
}
var isUmi3v = isUmi3();
/**
 * 日志打印兼容umi3.x
 */
function logPrint(msg, key, api) {
    // @ts-ignore
    if (!api.log && isUmi3v)
        return api.logger[key] ? api.logger[key](msg) : api.logger.log(msg);
    // @ts-ignore
    return api.log[key] ? api.log[key](msg) : api.log.log(msg);
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
    var allFiles = fs.readdirSync(fPath);
    allFiles.forEach(function (item) {
        var filePath = fPath + "/" + item;
        var info = fs.statSync(filePath);
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
            result_1 = __assign({}, result_1, tmp);
        });
        return result_1;
    }
    catch (err) {
        logPrint(filePath + "\u4E0D\u662F\u4E00\u4E2A\u6B63\u786E\u7684\u8DEF\u5F84\u6216\u6587\u4EF6", 'error', api);
        return false;
    }
}
/**
 * 上传文件
 * @param {*} fils 要上传的列表
 */
function uploadFile(fils, ossConfig, options, api) {
    return __awaiter(this, void 0, void 0, function () {
        var ossClient, globalStartTime, uploadPath, cdnPrefix, paths, absOutputPath, _i, fils_1, file, result, name_1, url;
        return __generator(this, function (_a) {
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
                        logPrint("\u4E0A\u4F20\u6210\u529F => " + cdnPrefix + name_1, 'info', api);
                    }
                    else {
                        logPrint("\u4E0A\u4F20\u6210\u529F => " + url, 'info', api);
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
    console.log('UMI_VERSION', process.env.UMI_VERSION);
    var umi3Config = {};
    if (isUmi3v) {
        // umi3.x注册插件及变量
        //@ts-ignore
        api.describe &&
            //@ts-ignore
            api.describe({
                key: 'alioss',
                config: {
                    schema: function (joi) {
                        return joi.object();
                    },
                },
            });
        //@ts-ignore
        umi3Config = api.userConfig.alioss;
    }
    var options = __assign({}, defaultOptions, opts, umi3Config);
    var ossConfig = options.ossConfig, uploadPath = options.uploadPath, enabled = options.enabled, configName = options.configName;
    var isDev = process.env.NODE_ENV === 'development';
    var paths = api.paths;
    var absOutputPath = paths.absOutputPath;
    if (!isDev && enabled) {
        var aliossConfigPath = path.join(os.homedir() + "/" + configName);
        logPrint("\uD83D\uDE0A \u5F53\u524D\u914D\u7F6E\u6587\u4EF6\u8DEF\u5F84" + aliossConfigPath, 'info', api);
        var ossSecret = loadConfig(aliossConfigPath, api);
        if (!ossSecret) {
            logPrint("\uD83C\uDF49 \u8BF7\u6B63\u786E\u914D\u7F6E" + configName + "\u6587\u4EF6\n", 'error', api);
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
        var newOssConfig_1 = __assign({}, ossConfig, ossSecret);
        var buildFucKey = isUmi3v ? 'onBuildComplete' : 'onBuildSuccess';
        //@ts-ignore
        api[buildFucKey] &&
            //@ts-ignore
            api[buildFucKey](function () {
                logPrint('🤗 应用构建完成 准备上传至OSS\n', 'info', api);
                readDirSync(absOutputPath, options);
                logPrint("\u23F0 \u5F85\u4E0A\u4F20\u6587\u4EF6\u603B\u6570\uFF1A" + uploadFiles.length + "\n", 'info', api);
                if (uploadFiles.length === 0) {
                    return logPrint('🍉 没有需要上传的文件\n', 'error', api);
                }
                (function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var res, e_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, uploadFile(uploadFiles, newOssConfig_1, options, api)];
                                case 1:
                                    res = _a.sent();
                                    logPrint("\uD83C\uDF89 \u4E0A\u4F20\u6587\u4EF6\u8017\u65F6\uFF1A " + res / 1000 + "s\n", 'profile', api);
                                    logPrint("\uD83C\uDF89 \u5DF2\u4E0A\u4F20\u6587\u4EF6\u6570\uFF1A " + uploadFiles.length + "\n", 'profile', api);
                                    return [3 /*break*/, 3];
                                case 2:
                                    e_1 = _a.sent();
                                    return [2 /*return*/, logPrint(e_1 + "\n", 'error', api)];
                                case 3: return [2 /*return*/];
                            }
                        });
                    });
                })();
            });
    }
}
exports.default = default_1;
