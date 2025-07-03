"use client";

import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { createConfig, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
// 只导入我们实际使用的链
import { 
//    mainnet,
//    sepolia, 
   arbitrum 
} from "viem/chains";
import { BitcoinWalletConnectors } from "@dynamic-labs/bitcoin";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import { SuiWalletConnectors } from "@dynamic-labs/sui";

// 严格定义我们仅使用的三条链
const chains = [
  // mainnet, 
  // sepolia, 
  arbitrum
] as const;

const config = createConfig({
  chains,
  // 关闭自动发现多注入提供者的功能
  multiInjectedProviderDiscovery: false,
  // 为每个链定义传输方式
  transports: {
    // [mainnet.id]: http(),
    // [sepolia.id]: http(),
    [arbitrum.id]: http(),
  },
});

// 创建一个查询客户端，设置较长的缓存时间
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1分钟
      retry: 0, // 禁用自动重试
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || "",
        walletConnectors: [
          BitcoinWalletConnectors,
          EthereumWalletConnectors,
          SolanaWalletConnectors,
          SuiWalletConnectors,
        ],
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            {children}
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}

export { DynamicWidget }; 