/**
 * 列出 Vercel 项目脚本
 */

const VERCEL_TOKEN = 'rF4aDNj4aTRotWfhKQAzVNQd';
const VERCEL_API_URL = 'https://api.vercel.com';

async function listProjects() {
  try {
    const response = await fetch(`${VERCEL_API_URL}/v9/projects`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`获取项目列表失败: ${response.statusText}`);
    }

    const data = await response.json();
    const projects = data.projects || [];

    console.log(`\n📦 找到 ${projects.length} 个项目:\n`);
    
    projects.forEach((project: any, index: number) => {
      console.log(`${index + 1}. ${project.name}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   URL: ${project.link?.url || 'N/A'}`);
      console.log('');
    });

    if (projects.length > 0) {
      console.log('💡 请使用项目名称或 ID 来设置环境变量\n');
    }
  } catch (error) {
    console.error('❌ 获取项目列表失败:', error);
  }
}

listProjects();
