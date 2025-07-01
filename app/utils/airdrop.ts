/**
 * 空投数据接口定义
 */
export interface AirdropData {
  index: number;
  address: string;
  amount: string;
  proof: string[];
  amountInEther?: string;
  batchIndex?: number; // 批次索引
  batchRoot?: string;  // 批次根哈希
}

/**
 * 从API获取用户的空投数据
 * @param address 用户钱包地址
 * @returns 用户的空投数据，如果没有数据则返回null
 */
export async function getUserAirdropData(address: string): Promise<AirdropData | null> {
  try {
    if (!address) return null;
    
    // 将地址转换为小写
    const normalizedAddress = address.toLowerCase();
    
    console.log(`从API获取地址 ${normalizedAddress} 的空投数据...`);
    
    // 调用API获取Merkle证明
    const response = await fetch(`/api/merkle-proof?address=${normalizedAddress}`);
    
    if (!response.ok) {
      console.warn(`API错误: ${response.status}`);
      return null;
    }
    
    const result = await response.json();
    
    if (result.error || !result.data) {
      console.warn(`API返回错误: ${result.error || '未知错误'}`);
      return null;
    }
    
    console.log(`成功获取到API数据:`, result.data);
    return result.data;
    
  } catch (error) {
    console.error('获取空投数据出错:', error);
    return null;
  }
}

/**
 * 格式化代币金额，将wei转换为更易读的格式
 * @param amount 代币金额（以wei为单位）
 * @returns 格式化后的金额
 */
export function formatTokenAmount(amount: string): string {
  try {
    // 假设代币有18位小数
    const amountInEther = parseFloat(amount) / 10**18;
    return amountInEther.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5
    });
  } catch {
    return '0';
  }
} 