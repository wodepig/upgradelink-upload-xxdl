/**
 * 本地测试脚本
 * 用于在本地环境测试 GitHub Action 代码
 * 
 * 使用方法:
 * node test/local-test.js
 * 或
 * pnpm test:local
 */

import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取测试配置
const configPath = path.join(__dirname, "test-config.json");
let testConfig = {};

if (fs.existsSync(configPath)) {
  testConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  console.log("✓ 已加载测试配置:", configPath);
} else {
  console.warn("⚠ 警告: 未找到 test-config.json，将使用默认值");
  testConfig = {
    upgradelink_username: "test_user",
    upgradelink_pwd: "test_password",
    dist_url: "./test/fixtures/dist",
    auto_push: false,
  };
}

// 设置环境变量来模拟 GitHub Actions 环境
process.env.GITHUB_WORKSPACE = path.resolve(__dirname, "..");
process.env.GITHUB_REPOSITORY = "test/test-repo";
process.env.GITHUB_REF = "refs/heads/main";
process.env.GITHUB_SHA = "test-sha-123";

// 设置 API URL（如果配置中有）
if (testConfig.upgradelink_login_url) {
  process.env.UPGRADELINK_LOGIN_URL = testConfig.upgradelink_login_url;
}
if (testConfig.upgradelink_upload_url) {
  process.env.UPGRADELINK_UPLOAD_URL = testConfig.upgradelink_upload_url;
}
if (testConfig.upgradelink_push_url) {
  process.env.UPGRADELINK_PUSH_URL = testConfig.upgradelink_push_url;
}

// 确保测试目录存在
const testDistPath = path.resolve(
  __dirname,
  "..",
  testConfig.dist_url.replace(/^\.\//, "")
);
if (!fs.existsSync(testDistPath)) {
  console.log(`📁 创建测试目录: ${testDistPath}`);
  fs.mkdirSync(testDistPath, { recursive: true });
  
  // 创建一些测试文件
  fs.writeFileSync(
    path.join(testDistPath, "index.html"),
    "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Build</h1></body></html>"
  );
  fs.writeFileSync(
    path.join(testDistPath, "app.js"),
    "console.log('Test application');"
  );
  fs.writeFileSync(
    path.join(testDistPath, "style.css"),
    "body { margin: 0; padding: 20px; }"
  );
  console.log("✓ 已创建测试文件");
}

// 创建模拟的输入参数（通过环境变量）
// @actions/core 会从 INPUT_* 环境变量读取输入
process.env.INPUT_UPGRADELINK_USERNAME = testConfig.upgradelink_username;
process.env.INPUT_UPGRADELINK_PWD = testConfig.upgradelink_pwd;
process.env.INPUT_DIST_URL = testConfig.dist_url;
process.env.INPUT_YUNMA_TOKEN = testConfig.yunma_token;
process.env.INPUT_UPGRADELINK_TYPE = testConfig.upgradelink_type;
process.env.INPUT_UPGRADELINK_KEY = testConfig.upgradelink_key;
process.env.INPUT_AUTO_PUSH = String(testConfig.auto_push);

// 运行测试
async function runTest() {
  try {
    console.log("\n" + "=".repeat(50));
    console.log("🚀 开始本地测试");
    console.log("=".repeat(50) + "\n");
    
    console.log("📋 测试配置:");
    console.log(JSON.stringify({
      username: testConfig.upgradelink_username,
      dist_url: testConfig.dist_url,
      auto_push: testConfig.auto_push
      // 不显示密码
    }, null, 2));
    console.log("\n");

    // 导入并执行主函数
    const { main } = await import("../src/index.js");
    await main();

    console.log("\n" + "=".repeat(50));
    console.log("✅ 测试完成");
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("\n" + "=".repeat(50));
    console.error("❌ 测试失败");
    console.error("=".repeat(50));
    console.error("\n错误详情:");
    console.error(error);
    if (error.stack) {
      console.error("\n堆栈跟踪:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runTest();
