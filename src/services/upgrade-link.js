import * as core from "@actions/core";
import { HttpClient } from "../utils/http.js";


/**
 * 认证服务
 * 处理 UpgradeLink 平台的登录认证
 */
export class UlService {
  static token = ''
  // 下个可用的版本号
  static nextVersionCode = 0
  // 上传后的文件信息
  static fileInfo = {}
  // 不同类型的基本信息. 如文件/配置/tauri应用
  static appInfo = {}
  // 类型对应的应用版本信息
  static appVersion = {}
  // 应用的升级任务信息
  static appUpdateTask = {}
  // 相关地址
  static extUrl = {
    // 应用版本点搜索
    versionListUrl: '',
    // 新建应用版本
    createVersionUrl: '',
    //新建升级任务
    createUpdateUrl: '',
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  static async autoLogin(username, password) {

    for (let i = 0; i < 3; i++) {
      try {
        await this.login(username, password);
      } catch (error) {
        core.error(`第${i + 1}次自动登录失败: ${error.message}`);
      }
      if (this.token) {
        return
      }
      await this.sleep(2000);
    }
    throw new Error("3次自动登录失败");

  }
  /**
   * 执行自动登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} 登录结果，包含 token 等信息
   */
  static async login(username, password) {
    try {
      const yunmaToken = core.getInput("yunma_token", { required: true });
      const getCaptcha = await HttpClient.get('http://backend.upgrade.toolsetlink.com/sys-api/captcha')
      if (getCaptcha.code !== 0) {
        throw new Error("获取验证码失败");
      }
      // core.info(`验证码: ${getCaptcha.data.imgPath}`);
      const captchaId = getCaptcha.data.captchaId
      const yunmaScan = await HttpClient.post('http://api.jfbym.com/api/YmServer/customApi', {
        image: getCaptcha.data.imgPath,
        token: yunmaToken,
        type: 10110
      })
      core.info(`验证码: ${JSON.stringify(yunmaScan)}`);
      if (yunmaScan.code !== 10000) {
        throw new Error("打码失败:" + yunmaScan.msg);
      }
      const code = yunmaScan.data.data
      // console.log('yunmaScan',yunmaScan);

      core.info(`开始登录，用户名: ${username}`);
      const startLogin = await HttpClient.post('http://backend.upgrade.toolsetlink.com/sys-api/user/login',
        {
          "password": password,
          "username": username,
          "captcha": code,
          "captchaId": captchaId
        })
      if (startLogin.code !== 0) {
        throw new Error("打码失败:" + startLogin.msg);
      }
      this.token = startLogin.data.token
      return {
        success: true,
        token: startLogin.data.token,
        expiresIn: startLogin.data.expire,
        ...startLogin,
      };

    } catch (error) {
      core.error(`登录失败: ${error.message}`);
      throw new Error(`登录失败: ${error.message}`);
    }
  }


  /**
   * 检测FileKey对应的数据是否存在,并且返回一个可用的版本号
   * @param {*} fileKey 
   * @param {*} token 
   */
  static async checkTypeKey(fileKey) {
    try {
      const upType = core.getInput("upgradelink_type", { required: true });
      // app点搜索
      let listUrl = ''
      // 应用版本列表的url
      let versionUrl = ''
      switch (upType) {
        case 'url': {
          listUrl = 'http://backend.upgrade.toolsetlink.com/upgrade/upgrade_url/list'
          this.extUrl.versionListUrl = ''
          this.extUrl.createVersionUrl = ''
          this.extUrl.createUpdateUrl = ''
          break
        }
        case 'file': {
          listUrl = 'http://backend.upgrade.toolsetlink.com/upgrade/upgrade_file/list'
          this.extUrl.versionListUrl = 'http://backend.upgrade.toolsetlink.com/upgrade/upgrade_file_version/list'
          this.extUrl.createVersionUrl = 'http://backend.upgrade.toolsetlink.com/upgrade/upgrade_file_version/create'
          this.extUrl.createUpdateUrl = 'http://backend.upgrade.toolsetlink.com/upgrade/upgrade_file_upgrade_strategy/create'
          break
        }
      }
      if (!listUrl) {
        throw new Error("暂不支持的upgradelink_type");
      }
      // 先获取列表数据用来取id
      const getList = await HttpClient.post(listUrl, {
        "key": fileKey,
        "page": 1,
        "pageSize": 20
      }, this.getAuthHeaders())
      if (getList.code !== 0) {
        throw new Error("获取应用列表失败");
      }
      if (getList.data.total === 0) {
        throw new Error("唯一标识不存在");
      }
      this.appInfo = getList.data.data[0]
      // 用来查询应用版本的可用版本号
      const versionList = await this.getVersionList()
      await this.getVersionCode(versionList)
    } catch (error) {
      core.error(`登录失败: ${error.message}`);
      throw new Error(`登录失败: ${error.message}`);
    }
  }


  /**
   * 获取最新的应用版本列表
   * @returns 
   */
  static async getVersionList() {
    try {
      const getVersionListResp = await HttpClient.post(this.extUrl.versionListUrl, {
        "fileId": this.appInfo.id,
        "page": 1,
        "pageSize": 20
      }, this.getAuthHeaders())
      if (getVersionListResp.code !== 0) {
        throw new Error("获取列表失败");
      }
      if (getVersionListResp.data.total === 0) {
        this.nextVersionCode = 1
        core.info('当前应用版本为空, 下一个版本号为: 1')
        return []
      }
      const items = getVersionListResp.data.data
      this.appVersion = items[0]

      return items
    } catch (error) {
      core.error(`获取版本列表失败: ${error.message}`);
      throw new Error(`获取版本列表失败: ${error.message}`);
    }
  }

  /**
   * 取应用版本列表中的下一个可用版本号
   * @returns 
   */
  static async getVersionCode(items) {
    if (items.length === 0) {
      return
    }
    try {
      // 1. 按 versionCode 升序排序（核心排序逻辑）
      const sortedList = [...items].sort((a, b) => a.versionCode - b.versionCode);

      // 2. 提取排序后的 versionCode 数组
      const sortedCodes = sortedList.map(item => item.versionCode);

      // 3. 计算下一个版本号（最大版本号 + 1）
      const maxCode = sortedCodes.length > 0 ? sortedCodes[sortedCodes.length - 1] : 0;
      const nextCode = maxCode + 1;

      this.nextVersionCode = nextCode
    } catch (error) {
      core.error(`获取最新可用版本失败: ${error.message}`);
      throw new Error(`获取最新可用版本失败: ${error.message}`);
    }
  }
  /**
     * 上传 ZIP 文件
     * @param {string} zipPath - ZIP 文件路径
     * @param {string} token - 认证 token
     * @returns {Promise<Object>} 上传结果，包含上传 URL 等信息
     */
  static async uploadZip(zipPath) {
    try {
      core.info(`开始上传文件: ${zipPath}`);

      // TODO: 替换为实际上传 API 地址
      const uploadUrl = "http://backend.upgrade.toolsetlink.com/fms-api/cloud_file/upload"

      const authHeaders = this.getAuthHeaders();

      // 可以添加额外的表单字段
      const additionalFields = {
        // TODO: 根据实际需求添加额外字段
        // version: "1.0.0",
        // description: "Build artifacts",
      };

      const response = await HttpClient.uploadFile(
        uploadUrl,
        zipPath,
        additionalFields,
        authHeaders
      );
      if (response.code !== 0) {
        throw new Error("上传文件失败:" + response.msg);
      }

      if (response.data && response.data.url) {
        this.fileInfo = response.data
      } else {
        throw new Error("上传响应格式不正确");
      }
    } catch (error) {
      core.error(`上传失败: ${error.message}`);
      throw new Error(`上传失败: ${error.message}`);
    }
  }
  /**
   * 创建一个应用版本
   * @param {*} url 发起请求的地址
   * @param {*} body 
   */
  static async createVersion() {
    try {
      let body = {
        cloudFileId: this.fileInfo.id,
        description: 'auto by github actions',
        fileId: this.appInfo.id,
        versionCode: this.nextVersionCode,
        versionName: this.nextVersionCode + ''
      }
      const createResp = await HttpClient.post(this.extUrl.createVersionUrl, body, this.getAuthHeaders())
      if (createResp.code !== 0) {
        throw new Error("创建应用版本失败:" + createResp.msg);
      }
      // 创建成功后要刷新下appVersion的值
      await this.getVersionList()
    } catch (error) {
      core.error(`创建应用版本失败: ${error.message}`);
      throw new Error(`创建应用版本失败: ${error.message}`);
    }
  }
  /**
   * 创建一个升级任务
   */
  static async createUpdateTask() {
    try {
      const time = this.generateTaskDateRange()
      const promptUpgradeContent = core.getInput("prompt_upgrade_content", { required: true });
      let reqBody = {}
      reqBody.beginDatetime = time.beginDatetime
      reqBody.endDatetime = time.endDatetime
      reqBody.description = this.appInfo.name + '_版本' + this.nextVersionCode + '_自动升级'
      reqBody.enable = 1
      reqBody.fileId = this.appInfo.id
      reqBody.fileVersionId = this.appVersion.id
      reqBody.flowLimitDataList = [{ "enable": 1, "beginTime": "00:00:00", "endTime": "00:00:00", "dimension": 1, "limit": 10 }]
      reqBody.grayDataList = [{ "enable": 1, "beginDatetime": time.now, "endDatetime": time.now, "limit": 10 }]
      reqBody.isFlowLimit = 0
      reqBody.isGray = 0
      reqBody.name = this.appInfo.name + '_版本' + this.nextVersionCode + '_自动升级'
      reqBody.promptUpgradeContent = promptUpgradeContent || '默认更新'
      reqBody.upgradeDevType = 0
      reqBody.upgradeDevTypeZeroData = ''
      reqBody.upgradeType = 1
      reqBody.upgradeVersionType = 0
      reqBody.upgradeVersionTypeZeroData = ''
      const createTaskResp = await HttpClient.post(this.extUrl.createUpdateUrl, reqBody, this.getAuthHeaders())
      if (createTaskResp.code !== 0) {
        throw new Error("创建升级任务失败");
      }
    } catch (error) {
      core.error(`创建升级任务失败: ${error.message}`);
      throw new Error(`创建升级任务失败: ${error.message}`);
    }
  }
  /**
    * 生成带格式的升级任务起止时间
    * @returns {{beginDatetime: string, endDatetime: string}}
    */
  static generateTaskDateRange() {
    const pad = (n) => n.toString().padStart(2, "0");
    function formatDate(date) {
      return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate()) +
        " " +
        pad(date.getHours()) +
        ":" +
        pad(date.getMinutes()) +
        ":" +
        pad(date.getSeconds())
      );
    }
    const now = new Date();
    const begin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      beginDatetime: formatDate(begin),
      endDatetime: formatDate(end),
      now: formatDate(new Date()),
    };
  }
  /**
   * 获取认证头
   * @param {string} token - 认证 token
   * @returns {Object} 包含认证信息的请求头
   */
  static getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }
}

