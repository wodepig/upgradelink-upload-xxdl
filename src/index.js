import * as core from "@actions/core";
import * as github from "@actions/github";
import * as path from "path";
import * as fs from "fs";
import { ZipUtil } from "./utils/zip.js";
import { AuthService } from "./services/auth.js";
import { UploadService } from "./services/upload.js";

/**
 * 主函数：执行完整的上传流程
 */
async function main() {
  try {
    core.info("=== 开始 UpgradeLink 上传流程 ===");

    // 1. 获取输入参数
    const username = core.getInput("upgradelink_username", { required: true });
    const password = core.getInput("upgradelink_pwd", { required: true });
    const upKey = core.getInput("upgradelink_key", { required: true });
    const distUrl = core.getInput("dist_url", { required: true });
    const autoPush = core.getBooleanInput("auto_push", { required: false });
    core.info(`用户名: ${username}`);
    core.info(`产物路径: ${distUrl}`);
    core.info(`自动推送: ${autoPush}`);

    // 2. 解析产物路径（支持相对路径和绝对路径）
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    const distPath = path.isAbsolute(distUrl)
      ? distUrl
      : path.join(workspace, distUrl);

    core.info(`完整产物路径: ${distPath}`);

    // 检查产物目录是否存在
    if (!fs.existsSync(distPath)) {
      throw new Error(`产物目录不存在: ${distPath}`);
    }

    // 3. 压缩产物为 ZIP 文件
    // const zipFileName = `build-${Date.now()}.zip`;
    // const zipPath = path.join(workspace, zipFileName);

    // core.info("开始压缩产物...");
    // await ZipUtil.compressDirectory(distPath, zipPath);
    // core.info("压缩完成!");


    // 4. 执行登录
    core.info("开始登录...");
    // const loginResult = await AuthService.login(username, password);
    // const token = loginResult.token;
   core.info("登录成功!");

    core.info("开始校验唯一标识...");
    await AuthService.checkFileKey(upKey,token)
    core.info("唯一标识校验成功!");
    // 5. 上传 ZIP 文件
    core.info("开始上传文件...");
    // const uploadResult = await UploadService.uploadZip(zipPath, token);
    core.info("上传成功!");

    // 6. 如果需要，执行自动推送
    if (autoPush && uploadResult.fileId) {
      core.info("开始自动推送...");
      // await UploadService.autoPush(uploadResult.fileId, token);
      core.info("自动推送成功!");
    }

    // 7. 清理临时 ZIP 文件
    ZipUtil.cleanup(zipPath);

    // 8. 设置输出
    core.setOutput("success", "true");
    if (uploadResult.uploadUrl) {
      core.setOutput("upload_url", uploadResult.uploadUrl);
    }

    core.info("=== 上传流程完成 ===");
  } catch (error) {
    core.setFailed(`上传流程失败: ${error.message}`);
    throw error;
  }
}

// 导出 main 函数以便测试
export { main };

// 如果在 GitHub Actions 环境中（官方运行器会将 GITHUB_ACTIONS 设为 'true'），自动执行
if (process.env.GITHUB_ACTIONS === "true") {
  main();
}
