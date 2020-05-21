// ref: https://umijs.org/config/

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
  plugins: [
    // ref: https://umijs.org/plugin/umi-plugin-react.html
    [
      'umi-plugin-react',
      {
        antd: false,
        dva: false,
        dynamicImport: false,
        title: 'base',
        dll: false,
        routes: {
          exclude: [],
        },
        hardSource: false,
        routes: {
          exclude: [/components/],
        },
      },
    ],
    ['umi-plugin-alioss', ossPluginOpt],
  ],
};
