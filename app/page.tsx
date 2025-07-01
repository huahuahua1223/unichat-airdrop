import Image from "next/image";
import { DynamicWidget } from "./providers";
import AirdropClaim from "./components/AirdropClaim";
import MerkleDataDownloader from "./components/MerkleDataDownloader";
import Card, { CardSection } from "./components/ui/Card";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-col items-center gap-8 text-center">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <h1 className="text-3xl font-bold">空投认领平台</h1>
      </header>

      <main className="flex flex-col gap-[32px] items-center justify-center w-full max-w-5xl mx-auto">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card title="连接钱包">
            <CardSection>
              <p className="text-sm opacity-70 mb-6">请先连接您的区块链钱包，以访问空投认领功能</p>
              <div className="flex justify-center">
                <DynamicWidget />
              </div>
            </CardSection>
          </Card>
          
          <AirdropClaim />
        </div>
        
        {/* <Card title="Merkle数据文件" className="w-full">
          <CardSection>
            <MerkleDataDownloader />
          </CardSection>
        </Card> */}

        <Card title="关于此项目" className="w-full">
          <CardSection>
            <h3 className="text-lg font-semibold mb-4">如何使用本平台领取空投</h3>
            <ol className="list-inside list-decimal text-sm/6 space-y-3">
              <li className="tracking-[-.01em]">
                连接您的钱包以查看您是否有可认领的空投代币。
              </li>
              <li className="tracking-[-.01em]">
                点击&ldquo;检查我的空投资格&rdquo;按钮查询您是否有资格认领。
              </li>
              <li className="tracking-[-.01em]">
                如果您有资格，点击&ldquo;认领代币&rdquo;按钮进行认领。
              </li>
            </ol>
          </CardSection>
          
          <CardSection className="mt-6">
            <h3 className="text-lg font-semibold mb-4">技术说明</h3>
            <p className="text-sm/6 mb-3">
              本平台使用Merkle树证明机制来验证您的空投资格。这是一种安全高效的方法，可以大规模验证用户的认领资格。
            </p>
            <p className="text-sm/6">
              交易完成后，您的代币将直接发送到您连接的钱包地址中。请确保您有足够的网络原生代币（如ETH）来支付交易gas费。
            </p>
          </CardSection>
        </Card>
      </main>

      <footer className="flex gap-[24px] flex-wrap items-center justify-center mt-8">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          项目文档
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          官方网站
        </a>
      </footer>
    </div>
  );
}
