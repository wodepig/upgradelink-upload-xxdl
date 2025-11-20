# 本地测试说明

## 快速开始

### 1. 配置测试参数

编辑 `test/test-config.json` 文件，填入你的测试参数：

```json
{
  "upgradelink_username": "your_username",
  "upgradelink_pwd": "your_password",
  "dist_url": "./test/fixtures/dist",
  "auto_push": false,
  "upgradelink_login_url": "https://api.upgradelink.com/auth/login",
  "upgradelink_upload_url": "https://api.upgradelink.com/upload",
  "upgradelink_push_url": "https://api.upgradelink.com/push"
}
```

### 2. 准备测试数据

测试脚本会自动在 `test/fixtures/dist` 目录创建测试文件。你也可以手动创建自己的测试目录和文件。

### 3. 运行测试

```bash
# 使用 pnpm
pnpm test:local

# 或直接使用 node
node test/local-test.js
```

## 测试流程

测试脚本会：

1. ✅ 读取测试配置
2. ✅ 设置模拟的 GitHub Actions 环境变量
3. ✅ 创建测试目录和文件（如果不存在）
4. ✅ 执行完整的上传流程：
   - 压缩产物为 ZIP
   - 执行登录
   - 上传文件
   - 可选自动推送
5. ✅ 显示测试结果

## 注意事项

- 测试会使用真实的 API 调用（如果已配置），请确保 API 地址正确
- 测试过程中会创建临时 ZIP 文件，测试完成后会自动清理
- 如果不想使用真实 API，可以在 `src/services/auth.js` 和 `src/services/upload.js` 中添加 mock 逻辑

## Mock 测试（可选）

如果你想在不调用真实 API 的情况下测试，可以修改服务文件添加 mock 模式：

```javascript
// 在 auth.js 或 upload.js 中添加
if (process.env.MOCK_MODE === 'true') {
  // 返回模拟数据
  return { token: 'mock-token', ... };
}
```

然后设置环境变量：
```bash
MOCK_MODE=true pnpm test:local
```

