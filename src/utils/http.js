import * as core from "@actions/core";
import { FormData } from "formdata-node";
import { readFileSync } from "fs";
import { basename } from "path";

/**
 * HTTP 请求工具类
 * 用于发送 HTTP 请求
 */
export class HttpClient {
  /**
   * 发送 GET 请求
   * @param {string} url - 请求 URL
   * @param {Object} headers - 请求头
   * @returns {Promise<Object>} 响应数据
   */
  static async get(url, headers = {}) {
    try {
      core.info(`发送 GET 请求到: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP 错误! 状态: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      core.error(`GET 请求失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 发送 POST 请求
   * @param {string} url - 请求 URL
   * @param {Object} body - 请求体
   * @param {Object} headers - 请求头
   * @returns {Promise<Object>} 响应数据
   */
  static async post(url, body = {}, headers = {}) {
    try {
      core.info(`发送 POST 请求到: ${url}`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP 错误! 状态: ${response.status}, 响应: ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      core.error(`POST 请求失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 上传文件（multipart/form-data）
   * @param {string} url - 请求 URL
   * @param {string} filePath - 文件路径
   * @param {Object} additionalFields - 额外的表单字段
   * @param {Object} headers - 请求头
   * @returns {Promise<Object>} 响应数据
   */
  static async uploadFile(url, filePath, additionalFields = {}, headers = {}) {
    try {
      core.info(`上传文件到: ${url}`);
      core.info(`文件路径: ${filePath}`);

      const formData = new FormData();
      const fileBuffer = new Blob([readFileSync(filePath)]);
      const fileName = basename(filePath);
      formData.append("file", fileBuffer, fileName);
      // 添加额外的表单字段
      Object.keys(additionalFields).forEach((key) => {
        formData.append(key, additionalFields[key]);
      });
      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...headers,
          // 不要设置 Content-Type，让 FormData 自动设置
        },
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `上传失败! 状态: ${response.status}, 响应: ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      core.error(`文件上传失败: ${error.message}`);
      throw error;
    }
  }
}

