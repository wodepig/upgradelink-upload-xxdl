import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";

/**
 * ZIP 压缩工具类
 * 用于将目录压缩成 ZIP 文件
 */
export class ZipUtil {
  /**
   * 将目录压缩成 ZIP 文件
   * @param {string} sourceDir - 源目录路径
   * @param {string} outputPath - 输出 ZIP 文件路径
   * @returns {Promise<string>} 返回 ZIP 文件路径
   */
  static async compressDirectory(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        core.info(`开始压缩目录: ${sourceDir}`);
        core.info(`输出路径: ${outputPath}`);

        // 检查源目录是否存在
        if (!fs.existsSync(sourceDir)) {
          throw new Error(`源目录不存在: ${sourceDir}`);
        }

        // 确保输出目录存在
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // 创建文件输出流
        const output = fs.createWriteStream(outputPath);
        const archive = archiver("zip", {
          zlib: { level: 9 }, // 最高压缩级别
        });

        // 监听所有归档数据都写入完成
        output.on("close", () => {
          const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
          core.info(`压缩完成! 文件大小: ${sizeInMB} MB`);
          core.info(`ZIP 文件路径: ${outputPath}`);
          resolve(outputPath);
        });

        // 监听警告（例如 stat 失败等）
        archive.on("warning", (err) => {
          if (err.code === "ENOENT") {
            core.warning(`压缩警告: ${err.message}`);
          } else {
            reject(err);
          }
        });

        // 监听错误
        archive.on("error", (err) => {
          core.error(`压缩错误: ${err.message}`);
          reject(err);
        });

        // 将归档对象连接到文件流
        archive.pipe(output);

        // 添加整个目录到归档中
        archive.directory(sourceDir, false);

        // 完成归档（即我们完成了追加文件，但流必须完成）
        archive.finalize();
      } catch (error) {
        core.error(`压缩失败: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * 清理临时 ZIP 文件
   * @param {string} zipPath - ZIP 文件路径
   */
  static cleanup(zipPath) {
    try {
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
        core.info(`已清理临时文件: ${zipPath}`);
      }
    } catch (error) {
      core.warning(`清理临时文件失败: ${error.message}`);
    }
  }
}

