// Activity 页面已简化 - Digital Heirloom 项目不需要 AI Tasks
// 如果需要 Activity 页面，可以重定向到其他页面或显示空页面
export default async function ActivityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // 暂时返回空页面，或重定向到其他页面
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Activity</h1>
      <p className="text-muted-foreground mt-4">No activities available.</p>
    </div>
  );
}
