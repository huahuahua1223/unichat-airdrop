"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useChainId } from "wagmi";
import Button from "./ui/Button";
import Card, { CardSection, CardFooter } from "./ui/Card";
import { AirdropData, getUserAirdropData, formatTokenAmount } from "../utils/airdrop";
import { getMerkleDistributorAddress, MERKLE_DISTRIBUTOR_ABI } from "../utils/contracts";

export default function AirdropClaim() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId(); // 获取当前连接的链ID
  
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [airdropData, setAirdropData] = useState<AirdropData | null>(null);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const [showDetails, setShowDetails] = useState(false); // 添加显示详细信息的状态
  
  // 合约地址
  const contractAddress = getMerkleDistributorAddress() as `0x${string}`;

  // 避免水合错误：在客户端挂载后检查网络
  useEffect(() => {
    // 只有当chainId有值且不是主网或Sepolia时才显示警告
    if (chainId && chainId !== 1 && chainId !== 11155111 && chainId !== 42161) {
      setShowNetworkWarning(true);
    } else {
      setShowNetworkWarning(false);
    }
  }, [chainId]);

  // 如果环境变量未设置，提示用户
  useEffect(() => {
    if (!contractAddress || contractAddress === '0x') {
      setError('请设置NEXT_PUBLIC_MERKLE_DISTRIBUTOR_ADDRESS环境变量');
    }
  }, [contractAddress]);

  // 调试chainId
  useEffect(() => {
    console.log('当前链ID:', chainId);
  }, [chainId]);
  
  // 使用useWriteContract hook来写入合约
  const { writeContract, isPending: isClaimPending, isSuccess: isClaimSuccess } = useWriteContract();
  
  // 使用useReadContract hook来判断是否已被领取
  const { 
    data: isClaimedData, 
    refetch: refetchIsClaimed,
    error: readContractError,
    isLoading: isReadLoading,
  } = useReadContract({
    address: contractAddress,
    abi: MERKLE_DISTRIBUTOR_ABI,
    functionName: 'isClaimed',
    args: airdropData ? [BigInt(airdropData.index)] : undefined,
    query: {
      enabled: !!contractAddress && !!airdropData && isConnected, // 仅在地址有效、有空投数据且已连接钱包时启用查询
    }
  });
  
  // 读合约错误处理
  useEffect(() => {
    if (readContractError) {
      console.error('读取合约错误:', readContractError);
      setError(`读取合约错误: ${readContractError.message}`);
    }
  }, [readContractError]);
  
  // 检查是否已领取
  const alreadyClaimed = !!isClaimedData;
  
  // 当认领成功后，重新检查领取状态
  useEffect(() => {
    if (isClaimSuccess && airdropData) {
      refetchIsClaimed();
      setSuccess(true);
    }
  }, [isClaimSuccess, airdropData, refetchIsClaimed]);

  // 当用户连接钱包时，检查他们是否有资格获得空投
  const checkEligibility = async () => {
    if (!address) return;
    
    try {
      setCheckingEligibility(true);
      setError(null);
      
      // 获取用户的空投数据
      const data = await getUserAirdropData(address);
      
      if (data) {
        console.log('获取到的空投数据:', data);
        setAirdropData(data);
        // 获取数据后立即刷新领取状态
        setTimeout(() => refetchIsClaimed(), 500);
      } else {
        setError("您没有资格获得空投");
      }
    } catch (err: Error | unknown) {
      console.error("获取空投数据失败:", err);
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(`获取空投数据失败: ${errorMessage}`);
    } finally {
      setCheckingEligibility(false);
    }
  };

  // 认领代币
  const claimAirdrop = async () => {
    if (!address || !airdropData) return;
    
    try {
      setError(null);
      setSuccess(false);
      
      // 使用useWriteContract hook的writeContract函数
      writeContract({
        address: contractAddress,
        abi: MERKLE_DISTRIBUTOR_ABI,
        functionName: "claimFromBatch",
        args: [
          BigInt(airdropData.index),
          BigInt(airdropData.batchIndex || 0),
          address,
          BigInt(airdropData.amount),
          airdropData.proof
        ]
      });
      
    } catch (err: Error | unknown) {
      console.error("认领失败:", err);
      const errorMessage = err instanceof Error ? err.message : '认领失败';
      setError(errorMessage);
    }
  };

  // 切换显示详细信息
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <Card title="代币空投认领" className="max-w-md mx-auto">
      {showNetworkWarning && (
        <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-md text-center text-yellow-800 dark:text-yellow-200 mb-4">
          警告：您当前连接的网络ID为{chainId}，可能不是主网、Sepolia测试网或Arbitrum。请切换到正确的网络。
        </div>
      )}
      
      {!contractAddress || contractAddress === '0x' ? (
        <CardSection>
          <p className="text-center text-red-500 mb-4">未设置合约地址，请先设置NEXT_PUBLIC_MERKLE_DISTRIBUTOR_ADDRESS环境变量</p>
        </CardSection>
      ) : !address ? (
        <CardSection>
          <p className="text-center text-amber-500 mb-4">请先连接钱包</p>
        </CardSection>
      ) : !airdropData ? (
        <CardSection>
          <p className="mb-4">连接钱包成功，点击下方按钮检查您是否有资格获得空投。</p>
          <Button 
            onClick={checkEligibility}
            isLoading={checkingEligibility}
            fullWidth
          >
            {checkingEligibility ? "检查中..." : "检查我的空投资格"}
          </Button>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </CardSection>
      ) : (
        <>
          <CardSection className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">钱包地址:</span>
              <span className="font-mono text-sm truncate max-w-[200px]">{address}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">空投索引:</span>
              <span>{airdropData.index}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">可获得数量:</span>
              <span className="font-semibold text-lg">
                {airdropData.amountInEther || formatTokenAmount(airdropData.amount)} 代币
              </span>
            </div>

            {airdropData.batchIndex !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">批次索引:</span>
                <span>{airdropData.batchIndex}</span>
              </div>
            )}

            {airdropData.proof && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">证明长度:</span>
                <span>{airdropData.proof.length} 个哈希值</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">合约地址:</span>
              <span className="font-mono text-sm truncate max-w-[200px]">{contractAddress}</span>
            </div>
            
            {/* 显示详细信息的按钮 */}
            <button 
              onClick={toggleDetails} 
              className="text-blue-600 dark:text-blue-400 text-sm w-full text-center mt-2"
            >
              {showDetails ? "隐藏详细信息" : "显示详细信息"}
            </button>
            
            {/* 详细技术信息 */}
            {showDetails && (
              <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs">
                <h4 className="text-sm font-semibold mb-1">技术详情</h4>
                <div className="grid grid-cols-1 gap-1">
                  {airdropData.batchRoot && (
                    <div className="flex flex-col">
                      <span className="font-semibold">批次根:</span> 
                      <span className="font-mono break-all">{airdropData.batchRoot}</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-semibold">证明:</span>
                    <div className="font-mono break-all max-h-32 overflow-y-auto text-[10px]">
                      {airdropData.proof.map((p, i) => (
                        <div key={i} className="mb-1">{i+1}. {p}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isReadLoading && (
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-md text-center text-blue-800 dark:text-blue-200 mt-4">
                正在检查领取状态...
              </div>
            )}
            
            {alreadyClaimed && (
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-md text-center text-yellow-800 dark:text-yellow-200 mt-4">
                您已经领取了空投
              </div>
            )}
          </CardSection>
          
          <CardFooter>
            <Button
              onClick={claimAirdrop}
              variant="success"
              isLoading={isClaimPending}
              disabled={alreadyClaimed || isClaimPending || isReadLoading}
              fullWidth
            >
              {isClaimPending ? "处理中..." : alreadyClaimed ? "已领取" : "认领代币"}
            </Button>
            
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            {success && <p className="text-green-500 text-center mt-4">认领成功！交易已提交。</p>}
          </CardFooter>
        </>
      )}
    </Card>
  );
} 