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
      core.info(`开始登录，用户名: ${username}`);

      // TODO: 替换为实际的登录 API 地址
      const loginUrl = process.env.UPGRADELINK_LOGIN_URL || "https://api.upgradelink.com/auth/login";

      const loginData = {
        username,
        password,
      };

      const response = await HttpClient.post(loginUrl, loginData);

      // TODO: 根据实际 API 响应格式调整
      // 假设响应格式为: { token: "...", expiresIn: 3600 }
      if (response.token) {
        core.info("登录成功!");
        return {
          success: true,
          token: response.token,
          expiresIn: response.expiresIn,
          ...response,
        };
      } else {
        throw new Error("登录响应中未找到 token");
      }
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

