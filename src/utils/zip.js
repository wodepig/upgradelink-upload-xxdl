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
   * @param sourceDir 要压缩的源目录
   * @param outputPath 输出 zip 文件路径
   * @returns 输出文件路径
   */
  static async compressDirectory(sourceDir, outputPath){
    return new Promise((resolve, reject) => {
      // 检查目录
      if (!fs.existsSync(sourceDir)) {
        return reject(new Error(`源目录不存在: ${sourceDir}`));
      }

      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const output = fs.createWriteStream(outputPath);

      const archive = archiver("zip", {
        zlib: { level: 9 }
      });

      // 监听写入完成（CI 环境必须监听 finish）
      output.on("close", () => resolve(outputPath));
      output.on("finish", () => resolve(outputPath));

      // 错误处理
      archive.on("error", err => reject(err));

      // 绑定到文件流
      archive.pipe(output);

      // 关键：确保包含所有文件（含隐藏文件）
      archive.glob("**/*", {
        cwd: sourceDir,
        dot: true, // 包含隐藏文件
        follow: true // 跟随软链接
      });

      archive.finalize();
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

