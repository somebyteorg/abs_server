# emos abs server

基于 [audiobookshelf](https://github.com/advplyr/audiobookshelf) 与 [pr#5098](https://github.com/advplyr/audiobookshelf/pull/5098) 实现的 `emos` `abs` 服务端

- 采用 数据库直接插入模式 解决扫库带来格式限制问题

- 注释相关 扫库 上传 等接口

- 图片与资源等 服务端 `302` 处理

- 移除 `libraryfiles` 使用 `audiofiles` 代替

- 前端 移除版本提示

- 支持 emos 登录
