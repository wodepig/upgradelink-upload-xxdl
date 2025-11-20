import * as core from "@actions/core";
import { HttpClient } from "../utils/http.js";

/**
 * 认证服务
 * 处理 UpgradeLink 平台的登录认证
 */
export class AuthService {
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
      const captchaId = getCaptcha.data.captchaId
      const yunmaScan = await HttpClient.post('http://api.jfbym.com/api/YmServer/customApi', {
        image: getCaptcha.data.imgPath,
        token: yunmaToken,
        type: 10110
      })
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
      core.info("登录成功!");
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
   * 检测FileKey对应的数据是否存在
   * @param {*} fileKey 
   * @param {*} token 
   */
  static async checkFileKey(fileKey,token){
    try {
      const upType = core.getInput("upgradelink_type", { required: true });
      let listUrl = ''
      switch(upType){
        case 'url':{
          listUrl = 'http://backend.upgrade.toolsetlink.com/upgrade/upgrade_url/list'
         break 
        }
        case 'file':{
          listUrl = 'http://backend.upgrade.toolsetlink.com/upgrade/upgrade_file/list'
          break 
         }
      }
      if(!listUrl){
        throw new Error("暂不支持的类型");
      }
      const getList = await HttpClient.post(listUrl,{
        "key": fileKey,
        "page":1,
        "pageSize":20
      },this.getAuthHeaders(token))
      if (getList.code !== 0) {
        throw new Error("获取列表失败");
      }
      if (getList.data.total === 0) {
        throw new Error("唯一标识不存在");
      }
      console.log('列表查询成功');
      console.log(getList);
      
      
    } catch (error) {
      core.error(`登录失败: ${error.message}`);
      throw new Error(`登录失败: ${error.message}`);
    }
  }
  /**
   * 获取认证头
   * @param {string} token - 认证 token
   * @returns {Object} 包含认证信息的请求头
   */
  static getAuthHeaders(token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
}

