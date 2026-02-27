# 受益人解密操作模拟指南

## 📋 场景模拟

**假设场景**：受益人收到了一封包含 Release Token 的邮件，以及一张恢复包 PDF 文件。

---

## 🔐 模拟步骤

### Step 1: 访问解密页面

受益人可以通过以下方式访问：

#### 方式 A: 通过邮件链接（推荐）
1. 打开邮件，找到包含 Release Token 的链接
2. 链接格式：`http://localhost:3000/inherit/[release-token]`
3. 点击链接，系统会自动重定向到解密中心

#### 方式 B: 直接访问
1. 打开浏览器，访问：`http://localhost:3000/digital-heirloom/beneficiaries/inheritance-center`
2. 在页面中输入 Release Token（从邮件中获取）

---

### Step 2: 选择解密方式

页面会显示两种解密方式选择：

1. **PDF Fragment**（推荐）
   - 使用恢复包 PDF 文件
   - 更安全，不需要记住密码

2. **主密码**
   - 直接输入主密码
   - 适合记得密码的用户

---

### Step 3: 使用 PDF Fragment 方式解密（推荐）

#### 3.1 输入 Release Token
- 在 "Release Token" 输入框中输入邮件中提供的 Token
- **提示**：如果上传 PDF，系统会自动从 PDF 中提取 Token

#### 3.2 上传 PDF 文件

**Free/Base 用户**：
1. 点击 "Upload Fragment A PDF" 按钮
2. 选择包含完整助记词（24 个单词）的 PDF 文件
3. 上传成功后，会显示绿色勾选标记 ✅

**Pro 用户**：
1. 点击 "Upload Fragment A PDF" 上传第一张 PDF（包含前 12 个单词）
2. 点击 "Upload Fragment B PDF" 上传第二张 PDF（包含后 12 个单词）
3. 两张 PDF 都上传成功后，会显示绿色勾选标记 ✅

#### 3.3 解密
1. 确认 Release Token 和 PDF 文件都已准备好
2. 点击 "Decrypt Assets" 按钮
3. 等待解密完成（可能需要几秒钟）
4. 解密成功后，会显示资产摘要和文件列表

---

### Step 4: 使用主密码方式解密（备选）

#### 4.1 输入 Release Token
- 在 "Release Token" 输入框中输入邮件中提供的 Token

#### 4.2 选择解密方式
- 点击 "主密码" 选项（而不是 "PDF Fragment"）

#### 4.3 输入主密码
1. 在 "主密码 (Master Password)" 输入框中输入密码
2. 可以点击眼睛图标显示/隐藏密码
3. 如果页面显示了密码提示，可以参考提示回忆密码

#### 4.4 解密
1. 确认 Release Token 和主密码都已输入
2. 点击 "Decrypt Assets" 按钮
3. 等待解密完成

---

## 🎯 完整操作流程示例

### 场景：受益人收到 PDF 文件

1. **收到邮件**
   - 邮件主题：Digital Legacy Release Notification
   - 邮件内容包含 Release Token：`abc123xyz789...`
   - 附件：`recovery-kit-fragment-a.pdf`

2. **访问解密页面**
   - 点击邮件中的链接：`http://localhost:3000/inherit/abc123xyz789...`
   - 或手动访问：`http://localhost:3000/digital-heirloom/beneficiaries/inheritance-center?token=abc123xyz789...`

3. **选择解密方式**
   - 点击 "PDF Fragment" 选项（默认选中）

4. **上传 PDF**
   - 点击 "Upload Fragment A PDF"
   - 选择 `recovery-kit-fragment-a.pdf` 文件
   - 系统自动解析 PDF，提取助记词和 Release Token
   - 显示绿色勾选标记 ✅

5. **解密**
   - 点击 "Decrypt Assets" 按钮
   - 等待解密完成
   - 查看解密后的资产

---

## 📝 测试检查清单

### 基础功能
- [ ] 可以访问解密页面
- [ ] Release Token 输入框正常工作
- [ ] 解密方式选择按钮正常工作

### PDF Fragment 方式
- [ ] 可以上传 PDF 文件
- [ ] PDF 解析功能正常
- [ ] Release Token 自动提取功能正常
- [ ] Fragment A/B 验证功能正常
- [ ] 解密功能正常

### 主密码方式
- [ ] 主密码输入框正常工作
- [ ] 显示/隐藏密码功能正常
- [ ] 密码提示显示正常
- [ ] 解密功能正常

### 错误处理
- [ ] 错误的 Release Token 提示
- [ ] 错误的 PDF 文件提示
- [ ] 错误的密码提示
- [ ] 解密次数限制提示

---

## 🐛 常见问题

### Q: 找不到解密入口？

**A**: 解密入口在以下位置：
1. 邮件中的链接（推荐）
2. 直接访问：`/digital-heirloom/beneficiaries/inheritance-center?token=[token]`
3. 通过 `/inherit/[token]` 路由自动重定向

### Q: PDF 文件无法上传？

**A**: 请检查：
1. 文件格式必须是 PDF（.pdf）
2. 文件大小不超过 10MB
3. PDF 文件未损坏
4. 浏览器支持文件上传

### Q: 解密失败？

**A**: 可能的原因：
1. Release Token 错误
2. PDF Fragment 错误
3. 主密码错误
4. 解密次数已用完（Free 用户）

---

## 🚀 快速测试命令

```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问解密页面
# http://localhost:3000/digital-heirloom/beneficiaries/inheritance-center

# 3. 或通过邮件链接访问
# http://localhost:3000/inherit/[release-token]
```

---

**最后更新**: 受益人解密操作模拟指南已创建 ✅
