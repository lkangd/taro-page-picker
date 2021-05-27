# Taro Page Picker README

Taro-page-picker（TPP） 是一个基于 vscode 插件系统实现的 taro 配置文件页面挑选插件。

TPP 会根据 Taro 的版本（v1,v2,v3）来动态读取配置文件，并通过 babel 获得 AST。在用户对配置文件作出修改后，点击保存并生成一份新的配置文件，这份配置文件将用于开发时的临时配置文件，除了修改 config 属性外，不修改任何其它已存在的逻辑（注释会删除）。

> ⚠️ 当工作区内存在多个 Taro 项目时，TPP 会优先选择最先找到的、可用的项目作为操作的目标。

> ⚠️ 项目内的临时选择配置项会保存在 .vscode/taro-page-picker.json 下。
## Features

### 动态拣选需要生成的主包页面配置

<p align="center">
  <img src="https://raw.githubusercontent.com/lkangd/taro-page-picker/main/taro-page-picker/resources/docs/main_page.gif" alt="Annotation Hovers" />
</p>

### 动态拣选需要生成的分包页面配置

<p align="center">
  <img src="https://raw.githubusercontent.com/lkangd/taro-page-picker/main/taro-page-picker/resources/docs/sub_packages_page.gif" alt="Annotation Hovers" />
</p>

### 批量[选择/取消]主包或分包的页面

<p align="center">
  <img src="https://raw.githubusercontent.com/lkangd/taro-page-picker/main/taro-page-picker/resources/docs/operate_all.gif" alt="Annotation Hovers" />
</p>

### 一键恢复原始配置文件

<p align="center">
  <img src="https://raw.githubusercontent.com/lkangd/taro-page-picker/main/taro-page-picker/resources/docs/recover_config.gif" alt="Annotation Hovers" />
</p>

### 支持选择指定的页面作为 entry 页

<p align="center">
  <img src="https://raw.githubusercontent.com/lkangd/taro-page-picker/main/taro-page-picker/resources/docs/set_entry.gif" alt="Annotation Hovers" />
</p>

### 动态增加页面配置后可重新读取

<p align="center">
  <img src="https://raw.githubusercontent.com/lkangd/taro-page-picker/main/taro-page-picker/resources/docs/dynamic_add_config.gif" alt="Annotation Hovers" />
</p>

### TODO

- 增加亮色主题图标支持
- 增加 git-hooks: pre-commit 以防止误上传配置文件
- 支持工作区内多项目同时操作配置文件

**Enjoy!**
