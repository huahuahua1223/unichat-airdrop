import { NextRequest, NextResponse } from "next/server";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { encodePacked, keccak256 as viem_keccak256, formatEther } from "viem";
import { getPinataFileWithCache, filenameToCidMap, createPinataDownloadLink } from "@/app/utils/pinata-service";

/**
 * 将地址和金额转换为叶节点哈希
 * @param index 空投索引
 * @param account 账户地址
 * @param amount 金额（以wei为单位）
 * @returns 叶节点哈希
 */
function hashToken(index: number, account: string, amount: string) {
  // 使用viem替代ethers进行哈希计算
  const packed = encodePacked(
    ["uint256", "address", "uint256"],
    [BigInt(index), account as `0x${string}`, BigInt(amount)]
  );
  
  const hash = viem_keccak256(packed);
  return Buffer.from(hash.slice(2), 'hex');
}

/**
 * 验证Merkle证明
 * @param merkleRoot Merkle根
 * @param proofData 证明数据
 * @returns 验证结果
 */
function verifyProof(merkleRoot: string, proofData: {
  index: number;
  address: string;
  amount: string;
  proof: string[];
}) {
  const { index, address, amount, proof } = proofData;
  
  const leaf = hashToken(index, address, amount);
  const isValid = MerkleTree.verify(proof, leaf, merkleRoot, keccak256, { sortPairs: true });
  
  return isValid;
}

// 地址批次缓存
const addressBatchCache = new Map<string, { batchIndex: number, index: number }>();

/**
 * 从特定批次中查找地址
 */
async function searchAddressInBatch(address: string, batchIndex: number) {
  try {
    const normalizedAddress = address.toLowerCase();
    console.log(`在批次 ${batchIndex} 中查找地址: ${normalizedAddress}`);
    
    // 获取批次数据
    const batchCid = filenameToCidMap[`batches/batch_${batchIndex}.json`];
    if (!batchCid) {
      throw new Error(`找不到批次文件的CID`);
    }
    
    const batchData = await getPinataFileWithCache(batchCid);
    
    // 查找地址
    for (const record of batchData.records) {
      if (record.address.toLowerCase() === normalizedAddress) {
        // 找到了地址，缓存结果
        const result = { batchIndex, index: record.index };
        addressBatchCache.set(normalizedAddress, result);
        console.log(`在批次 ${batchIndex} 中找到地址: ${normalizedAddress}, 索引: ${record.index}`);
        return result;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`搜索批次 ${batchIndex} 时出错:`, error);
    return null;
  }
}

/**
 * 查找地址所在的批次
 */
async function findAddressBatch(address: string) {
  const normalizedAddress = address.toLowerCase();
  
  // 检查缓存
  if (addressBatchCache.has(normalizedAddress)) {
    return addressBatchCache.get(normalizedAddress)!;
  }
  
  // 搜索所有批次
  const TOTAL_BATCHES = 9; // 从0到8
  for (let batchIndex = 0; batchIndex < TOTAL_BATCHES; batchIndex++) {
    const result = await searchAddressInBatch(address, batchIndex);
    if (result) return result;
  }
  
  return null;
}

/**
 * 获取地址的Merkle证明
 * @param targetAddress 目标地址
 * @returns 证明数据或null（如果地址不在空投列表中）
 */
async function getMerkleProof(targetAddress: string) {
  const normalizedAddress = targetAddress.toLowerCase();
  console.log(`为地址 ${normalizedAddress} 生成Merkle证明...`);
  
  try {
    // 直接使用本地函数查找地址批次，不再调用额外API
    const addressInfo = await findAddressBatch(normalizedAddress);
    
    if (!addressInfo) {
      console.warn(`地址 ${normalizedAddress} 不在空投列表中`);
      return null;
    }
    
    const { batchIndex, index } = addressInfo;
    console.log(`找到地址 ${normalizedAddress} 在批次 ${batchIndex}，索引 ${index}`);
    
    // 读取批次数据
    const batchCid = filenameToCidMap[`batches/batch_${batchIndex}.json`];
    if (!batchCid) {
      throw new Error(`找不到batch_${batchIndex}.json文件的CID`);
    }
    
    // 使用优化后的文件获取方法
    const batchData = await getPinataFileWithCache(batchCid);
    
    // 找到记录
    const record = batchData.records.find((r: {
      address: string;
      index: number;
      amount: string;
    }) => r.index === index);
    
    if (!record) {
      console.error(`错误: 在批次 ${batchIndex} 中找不到索引 ${index} 的记录`);
      return null;
    }
    
    // 验证地址匹配
    if (record.address.toLowerCase() !== normalizedAddress) {
      console.error(`错误: 记录地址不匹配: ${record.address} != ${normalizedAddress}`);
      return null;
    }
    
    // 重建批次的Merkle树
    const leaves = batchData.records.map((r: any) => 
      hashToken(r.index, r.address, r.amount)
    );
    
    const batchTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    
    // 生成批次内的证明
    const leaf = hashToken(record.index, record.address, record.amount);
    const proof = batchTree.getHexProof(leaf);
    
    // 验证证明是否与批次根匹配
    const batchRoot = batchData.root;
    
    const proofData = {
      index: record.index,
      address: record.address,
      amount: record.amount,
      proof: proof,
      amountInEther: formatEther(BigInt(record.amount)),
      batchIndex: batchIndex,
      batchRoot: batchRoot
    };
    
    // 验证批次内的证明
    const isBatchProofValid = verifyProof(batchRoot, proofData);
    console.log(`批次内证明验证结果: ${isBatchProofValid ? '有效' : '无效'}`);
    
    if (!isBatchProofValid) {
      console.error(`错误: 批次内证明无效！`);
      return null;
    }
    
    console.log(`证明已成功生成，批次索引: ${batchIndex}`);
    return proofData;
  } catch (error) {
    console.error(`生成证明时出错:`, error);
    return null;
  }
}

// 处理API请求
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json({ error: "缺少必需的地址参数" }, { status: 400 });
    }

    console.log(`收到地址 ${address} 的Merkle证明请求`);
    
    // 尝试获取Merkle证明
    const proofData = await getMerkleProof(address);
    
    if (!proofData) {
      return NextResponse.json({ error: "地址不在空投列表中或无法生成证明" }, { status: 404 });
    }
    
    return NextResponse.json({ data: proofData });
    
  } catch (error) {
    console.error("生成Merkle证明API错误:", error);
    return NextResponse.json({ error: "生成Merkle证明时发生服务器错误" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { filename } = await request.json();
    
    // 获取文件的CID
    const cid = filenameToCidMap[filename];
    if (!cid) {
      return NextResponse.json({ error: "找不到指定文件" }, { status: 404 });
    }

    // 创建下载链接
    const signedUrl = await createPinataDownloadLink(cid);

    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }
}