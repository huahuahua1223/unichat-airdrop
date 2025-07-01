import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// 文件缓存
export const fileCache = new Map<string, any>();

/**
 * 从R2读取文件数据（带缓存）
 * @param key R2文件的键值
 * @returns JSON解析后的数据
 */
export async function getR2FileWithCache(key: string) {
  // 检查缓存
  if (fileCache.has(key)) {
    console.log(`使用缓存: ${key}`);
    return fileCache.get(key);
  }
  
  console.log(`从R2读取: ${key}`);
  
  // 创建S3客户端 (配置为R2)
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  
  // 从R2获取
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
  });
  
  const response = await client.send(command);
  if (!response.Body) {
    throw new Error(`无法从R2读取文件: ${key}`);
  }
  
  const data = await response.Body.transformToString();
  const jsonData = JSON.parse(data);
  
  // 存入缓存
  fileCache.set(key, jsonData);
  
  return jsonData;
}

/**
 * 清除缓存
 * @param key 如果指定，则只清除特定的键；否则清除全部缓存
 * @returns 清除结果
 */
export function clearCache(key?: string) {
  if (key) {
    const deleted = fileCache.delete(key);
    return {
      success: deleted,
      message: deleted ? `缓存项 ${key} 已清除` : `缓存项 ${key} 不存在`
    };
  } else {
    const size = fileCache.size;
    fileCache.clear();
    return {
      success: true,
      message: `已清除全部 ${size} 个缓存项`
    };
  }
} 