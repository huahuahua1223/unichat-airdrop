/**
 * 此文件包含文件名到IPFS CID的映射
 * 从环境变量中读取CID，提高灵活性
 */

// 从环境变量中读取CID
const BATCHES_FOLDER_CID = process.env.NEXT_PUBLIC_BATCHES_FOLDER_CID || "";
const ADDRESS_MAP_CID = process.env.NEXT_PUBLIC_ADDRESS_MAP_CID || "";
const MERKLE_DATA_CID = process.env.NEXT_PUBLIC_MERKLE_DATA_CID || "";

// 检查是否设置了必要的环境变量
if (!process.env.NEXT_PUBLIC_BATCHES_FOLDER_CID) {
  console.warn("⚠️ 环境变量NEXT_PUBLIC_BATCHES_FOLDER_CID未设置，使用默认值");
}

if (!process.env.NEXT_PUBLIC_ADDRESS_MAP_CID) {
  console.warn("⚠️ 环境变量NEXT_PUBLIC_ADDRESS_MAP_CID未设置，使用默认值");
}

if (!process.env.NEXT_PUBLIC_MERKLE_DATA_CID) {
  console.warn("⚠️ 环境变量NEXT_PUBLIC_MERKLE_DATA_CID未设置，使用默认值");
}

export const filenameToCidMap: Record<string, string> = {
  // 直接映射文件
  "address_map.json": ADDRESS_MAP_CID,
  "merkle_data.json": MERKLE_DATA_CID,
  
  // 批次文件使用文件夹CID + 文件路径的方式
  "batches/batch_0.json": `${BATCHES_FOLDER_CID}/batch_0.json`,
  "batches/batch_1.json": `${BATCHES_FOLDER_CID}/batch_1.json`,
  "batches/batch_2.json": `${BATCHES_FOLDER_CID}/batch_2.json`,
  "batches/batch_3.json": `${BATCHES_FOLDER_CID}/batch_3.json`,
  "batches/batch_4.json": `${BATCHES_FOLDER_CID}/batch_4.json`,
  "batches/batch_5.json": `${BATCHES_FOLDER_CID}/batch_5.json`,
  "batches/batch_6.json": `${BATCHES_FOLDER_CID}/batch_6.json`,
  "batches/batch_7.json": `${BATCHES_FOLDER_CID}/batch_7.json`,
  "batches/batch_8.json": `${BATCHES_FOLDER_CID}/batch_8.json`,
};

/**
 * CID到文件名的映射
 * 注意：对于文件夹内的文件，我们使用完整路径作为标识
 */
export const cidToFilenameMap: Record<string, string> = {
  [ADDRESS_MAP_CID]: "address_map.json",
  [MERKLE_DATA_CID]: "merkle_data.json",
  [BATCHES_FOLDER_CID]: "batches"
}; 