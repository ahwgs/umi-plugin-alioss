# umi-plugin-alioss

umi,umi-plugin,alioss

基于 umi2.x 插件体系编写

### 说明

基于`umi-plugin`系统封装的一个插件，用于构建成功之后上传静态资源到阿里云

### 使用

```bash
yarn add umi-plugin-alioss -D
yarn add ali-oss -D
```

在`.umirc.js`或者`config/config.js`中使用

```javascript
const ossPluginOpt = {
  ossConfig: {
    region: 'oss-cn-beijing',
    bucket: 'example',
    secure: true,
  },
  configName: '.alioss',
  enabled: true,
  cdnPrefix: 'https://cdn.xxx.com/release/', // CDN前缀
  uploadPath: '/release', // 文件上传路径
  exclude: '', // 排除文件
  ignoreHtml: true, // 不上传html
};

export default {
  plugins: [['umi-plugin-alioss', ossPluginOpt]],
};
```

### 注意事项：

为了安全起见，`alioss`上传是需要`accessKeyId`,`accessKeySecret`的
我们在使用之前需要先到系统用户目录下新建`.alioss`文件，内容如下

```text
accessKeyId=1231231231231
accessKeySecret=12312312312313
```

比如`mac`用户在`/User/xxx/.alioss`

`windows`用户在`C:/User/admin/.alioss`

注意：在服务器环境中需要给该文件设置读取权限比如：`chmod 600 .alioss`

### 1.0.2 更新

为了兼容`umi3.x`代码有些许改动
