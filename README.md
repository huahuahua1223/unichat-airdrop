This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# 空投认领前端应用

这个项目是一个基于 Next.js 的前端应用，用于与 MerkleDistributor 智能合约交互，允许用户连接钱包并认领他们的代币空投。项目使用了最新的 Next.js App Router 架构，并集成了多链钱包连接功能。

## 功能特点

- **多链钱包支持**: 支持 Bitcoin、Ethereum、Solana 和 Sui 钱包
- **Merkle 证明验证**: 使用 Merkle 树技术验证用户的空投资格
- **批次处理**: 支持大规模空投的批次处理机制
- **响应式设计**: 适配各种设备尺寸的界面
- **动态证明生成**: 通过 API 动态生成用户的 Merkle 证明

## 项目结构

```
front-airdrop/
├── app/                         # Next.js App Router 目录
│   ├── api/                     # API 路由
│   │   └── merkle-proof/        # Merkle 证明生成 API
│   ├── components/              # React 组件
│   │   ├── ui/                  # UI 组件库
│   │   │   ├── Button.tsx       # 按钮组件
│   │   │   └── Card.tsx         # 卡片组件
│   │   └── AirdropClaim.tsx     # 空投认领主组件
│   ├── utils/                   # 工具函数
│   │   ├── airdrop.ts           # 空投相关工具函数
│   │   └── contracts.ts         # 智能合约 ABI 和地址
│   ├── globals.css              # 全局样式
│   ├── layout.tsx               # 根布局组件
│   ├── page.tsx                 # 首页组件
│   └── providers.tsx            # 全局提供者配置
├── merkle-data/                 # Merkle 树数据
│   ├── batches/                 # 批次数据文件
│   ├── address_map.json         # 地址映射文件
│   └── merkle_data.json         # Merkle 树元数据
├── public/                      # 静态资源
├── next.config.ts               # Next.js 配置
├── package.json                 # 项目依赖
└── tsconfig.json                # TypeScript 配置
```

## 技术栈

- **前端框架**: Next.js 15.3.4 (App Router)
- **UI 框架**: TailwindCSS 4.x
- **状态管理**: React Query (TanStack Query)
- **区块链交互**: 
  - wagmi 2.x
  - viem 2.x
  - Dynamic Labs SDK
- **Merkle 树处理**:
  - merkletreejs
  - keccak256

## 环境配置

1. 在项目根目录创建 `.env.local` 文件
2. 添加以下环境变量:
```
# 必需的环境变量
NEXT_PUBLIC_MERKLE_DISTRIBUTOR_ADDRESS=0xYourContractAddressHere

# Dynamic Labs 钱包连接 (可选)
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-dynamic-environment-id
```

## 开发指南

安装依赖:

```bash
pnpm install
```

运行开发服务器:

```bash
pnpm dev
```

构建生产版本:

```bash
pnpm build
```

## 智能合约交互

应用与 MerkleDistributor 合约交互，该合约支持批次化的 Merkle 树验证机制。主要使用的函数包括:

- `isClaimed(uint256 index)`: 检查指定索引的空投是否已被认领
- `claimFromBatch(uint256 index, uint256 batchIndex, address account, uint256 amount, bytes32[] calldata merkleProof)`: 从指定批次认领代币

合约示例:

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleDistributor {
    address public immutable token;
    bytes32 public immutable merkleRoot;
    mapping(uint256 => bytes32) public batchRoots;
    mapping(uint256 => uint256) private claimedBitMap;
    
    // ... 合约其他部分 ...
    
    function claimFromBatch(
        uint256 index,
        uint256 batchIndex,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        require(!isClaimed(index), "MerkleDistributor: Drop already claimed");
        
        // 使用批次根进行验证
        bytes32 batchRoot = batchRoots[batchIndex];
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(MerkleProof.verify(merkleProof, batchRoot, node), "MerkleDistributor: Invalid proof");
        
        _setClaimed(index);
        require(IERC20(token).transfer(account, amount), "MerkleDistributor: Transfer failed");
        emit Claimed(index, account, amount);
    }
}
```

## API 接口

### 获取 Merkle 证明

```
GET /api/merkle-proof?address={wallet_address}
```

响应示例:

```json
{
  "data": {
    "index": 4011773,
    "address": "0xbdd3203fed7bc268dc76bff731e78c73f76053c1",
    "amount": "3712930000000000000",
    "proof": [
      "0x79634713ed7737daff7f1ba5b4fce461cdafa75ae1d2c578834edbe1f762c4a6",
      "..."
    ],
    "amountInEther": "3.71293",
    "batchIndex": 8,
    "batchRoot": "0x7ac8748ea23f10a828dc4f9ce793c8ed2d73e5932a78db120ead8b030839091d"
  }
}
```

## 性能优化建议

对于大规模空投，建议实施以下优化:

1. **实现缓存机制**: 添加 Redis 或内存缓存，避免重复计算相同地址的证明
2. **预计算证明**: 提前计算所有证明并存储，而不是每次请求时重新计算
3. **数据库存储**: 将大型映射文件迁移到数据库中，提高查询效率
4. **CDN 分发**: 使用 CDN 分发预计算的证明数据
5. **批量处理**: 实现队列系统处理高峰期请求
6. **云函数部署**: 使用无服务器架构自动扩展处理能力

## 部署指南

### Vercel 部署

项目可以直接部署到 Vercel 平台:

```bash
vercel
```

### 自托管部署

1. 构建项目:
```bash
pnpm build
```

2. 启动生产服务器:
```bash
pnpm start
```

## 贡献指南

1. Fork 本仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

[MIT](LICENSE)

## 了解更多

- [Next.js 文档](https://nextjs.org/docs)
- [wagmi 文档](https://wagmi.sh/)
- [Dynamic Labs 文档](https://docs.dynamic.xyz/)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
