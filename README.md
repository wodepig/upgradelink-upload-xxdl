## 功能
自动把前端的构建目录压缩成zip, 然后上传的http://upgrade.toolsetlink.com/中的文件升级
会自动登陆/创建应用版本/创建升级任务
## 配置参考
```
{
  "upgradelink_username": "用户名",
  "upgradelink_pwd": "密码",
  "upgradelink_type": "类型. 如file/url/tauri",
  "upgradelink_key": "type对应的唯一key",
  "prompt_upgrade_content": "升级内容",
  "dist_url": ".output",
  "auto_push": true,
  "yunma_token":"对验证码打码. https://console.jfbym.com/register/TG95218"
}
```
## 开发
fork 仓库
安装依赖
修改src/index的逻辑
pnpm build打包
然后push即可
> 有时候代码没生效可能就是没有build
## Example usage

```yaml
      - name: Push To UpgradeLink
        id: push-upgradelink
        uses: wodepig/upgradelink-upload-xxdl@git提交id
        with:
          upgradelink_username: ${{ vars.UPGRADELINK_USERNAME }}
          upgradelink_pwd: ${{secrets.UPGRADELINK_PWD}}
          upgradelink_type: ${{ vars.UPGRADELINK_TYPE }}
          upgradelink_key: ${{secrets.UPGRADELINK_KEY}}
          prompt_upgrade_content: ${{ env.cleaned_message }}
          dist_url: .output
          yunma_token: ${{ vars.YUNMA_TOKEN }}
          auto_push: true
```
