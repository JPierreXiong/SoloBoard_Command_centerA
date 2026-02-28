# SoloBoard 本地开发快速启动指南

## ✅ 已完成的配置

1. **环境变量验证已修复** - 移除了不必要的 Supabase、ShipAny、Resend 依赖
2. **数据库连接已配置** - Neon PostgreSQL 连接信息已添加
3. **认证配置已优化** - 提供默认配置，避免数据库查询失败

## 🚀 启动开发服务器

直接运行以下命令启动服务器：

```powershell
pnpm dev
```

服务器将在 `http://localhost:3003` 启动

## 📝 重要说明

### 关于数据库表

**Better Auth 会自动创建表！**

当你第一次访问认证相关的页面（如注册或登录）时，better-auth 会自动检测并创建所需的数据库表。你不需要手动运行数据库迁移。

### 首次使用步骤

1. **启动服务器**
   ```powershell
   pnpm dev
   ```

2. **访问注册页面**
   ```
   http://localhost:3003/zh/sign-up
   ```

3. **注册第一个账户**
   - 填写邮箱、用户名、密码
   - 提交注册
   - Better Auth 会自动创建 `user` 表和其他认证相关的表

4. **登录测试**
   ```
   http://localhost:3003/zh/sign-in
   ```

5. **设置管理员权限**（可选）
   注册成功后，如果需要管理员权限，运行：
   ```powershell
   # 修改 src/scripts/init-admin.ts 中的邮箱地址
   # 然后运行：
   npx tsx src/scripts/init-admin.ts
   ```

## 🔧 如果遇到问题

### 问题1: 端口被占用
如果 3003 端口被占用，修改 `package.json` 中的端口：
```json
"dev": "next dev -p 3004"
```

### 问题2: 数据库连接失败
检查 `.env.local` 中的 `DATABASE_URL` 是否正确：
```bash
DATABASE_URL=postgresql://neondb_owner:npg_au5XJdonk1Es@ep-mute-smoke-ainrvel2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 问题3: 认证失败
1. 清除浏览器 cookies
2. 重启开发服务器
3. 检查终端日志中的错误信息

## 🎯 测试功能清单

启动服务器后，测试以下功能：

- [ ] 用户注册: http://localhost:3003/zh/sign-up
- [ ] 用户登录: http://localhost:3003/zh/sign-in
- [ ] 仪表板: http://localhost:3003/zh/dashboard
- [ ] SoloBoard: http://localhost:3003/zh/soloboard
- [ ] 定价页面: http://localhost:3003/zh/pricing

## 💡 提示

- **不需要手动运行 `db:push`** - Better Auth 会自动处理
- **首次注册可能稍慢** - 因为需要创建数据库表
- **查看终端日志** - 可以看到数据库操作和认证流程

---

现在就运行 `pnpm dev` 开始测试吧！🚀

