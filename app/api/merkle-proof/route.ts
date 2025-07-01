import { NextRequest, NextResponse } from "next/server";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { encodePacked, keccak256 as viem_keccak256, formatEther } from "viem";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2FileWithCache } from "@/app/utils/r2-cache";

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

/**
 * 获取地址的Merkle证明
 * @param targetAddress 目标地址
 * @returns 证明数据或null（如果地址不在空投列表中）
 */
async function getMerkleProof(targetAddress: string) {
  const normalizedAddress = targetAddress.toLowerCase();
  console.log(`为地址 ${normalizedAddress} 生成Merkle证明...`);
  
  try {
    // 从R2读取地址映射文件
    const addressMap = await getR2FileWithCache('address_map.json');
    
    // 检查地址是否存在
    if (!addressMap[normalizedAddress]) {
      console.warn(`地址 ${normalizedAddress} 不在空投列表中`);
      return null;
    }
    
    // 获取批次信息
    const { batchIndex, index } = addressMap[normalizedAddress];
    console.log(`找到地址 ${normalizedAddress} 在批次 ${batchIndex}，索引 ${index}`);
    
    // 读取批次数据
    const batchData = await getR2FileWithCache(`batches/batch_${batchIndex}.json`);
    
    // 找到记录
    const record = batchData.records.find((r: {
      address: string;
      index: number;
      amount: string;
    }) => r.address.toLowerCase() === normalizedAddress);
    
    if (!record) {
      console.error(`错误: 在批次 ${batchIndex} 中找不到地址 ${normalizedAddress} 的记录`);
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
    
    // 读取merkle_data.json获取最终根和所有批次根
    const merkleData = await getR2FileWithCache('merkle_data.json');
    
    // 对于智能合约验证，需要将批次内证明和批次索引一起传递
    proofData.batchIndex = batchIndex;
    proofData.batchRoot = batchRoot;
    
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
    
    // 创建S3客户端 (配置为R2)
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    // 创建命令
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: filename,
    });

    // 生成预签名URL (有效期1小时)
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }
}