import { NextRequest, NextResponse } from "next/server";
import { clearCache } from "@/app/utils/r2-cache";

export async function DELETE(request: NextRequest) {
  try {
    // 可以添加授权检查，确保只有管理员可以清除缓存
    const authHeader = request.headers.get("authorization");
    if (!process.env.ADMIN_API_KEY || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 获取查询参数，确定是清除特定key还是全部缓存
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    
    // 使用共享模块的clearCache函数
    const result = clearCache(key || undefined);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("清除缓存时出错:", error);
    return NextResponse.json({ error: "清除缓存时发生服务器错误" }, { status: 500 });
  }
} 