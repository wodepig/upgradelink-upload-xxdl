import * as core from "@actions/core";
import * as path from "path";
import { HttpClient } from "../utils/http.js";

/**
 * 上传服务
 * 处理文件上传到 UpgradeLink 平台
 */
export class UploadService {
  /**
   * 上传 ZIP 文件
   * @param {string} zipPath - ZIP 文件路径
   * @param {string} token - 认证 token
   * @returns {Promise<Object>} 上传结果，包含上传 URL 等信息
   */
  static async uploadZip(zipPath, token) {
    try {
      core.info(`开始上传文件: ${zipPath}`);

      // TODO: 替换为实际上传 API 地址
      const uploadUrl = "http://backend.upgrade.toolsetlink.com/fms-api/cloud_file/upload"

      const authHeaders = {
        Authorization: `Bearer ${token}`,
      };

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
      if(response.code !== 0){
        throw new Error("上传文件失败:" + response.msg);
      }
      
      if (response.data && response.data.url) {
        core.info("上传成功!");
        return {
          success: true,
          uploadUrl: response.data.url,
          cloudFileId: response.data.id,
          ...response,
        };
      } else {
        throw new Error("上传响应格式不正确");
      }
    } catch (error) {
      core.error(`上传失败: ${error.message}`);
      throw new Error(`上传失败: ${error.message}`);
    }
  }

  /**
   * 执行自动推送（如果需要）
   * @param {string} fileId - 文件 ID
   * @param {string} token - 认证 token
   * @returns {Promise<Object>} 推送结果
   */
  static async autoPush(fileId, token) {
    try {
      core.info(`开始自动推送，文件 ID: ${fileId}`);

      // TODO: 替换为实际推送 API 地址
      const pushUrl =
        process.env.UPGRADELINK_PUSH_URL ||
        "https://api.upgradelink.com/push";

      const pushData = {
        fileId,
      };

      const authHeaders = {
        Authorization: `Bearer ${token}`,
      };

      const response = await HttpClient.post(pushUrl, pushData, authHeaders);

      core.info("自动推送成功!");
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      core.error(`自动推送失败: ${error.message}`);
      throw new Error(`自动推送失败: ${error.message}`);
    }
  }
}

