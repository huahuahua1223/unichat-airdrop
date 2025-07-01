"use client";

import React, { useState } from 'react';

interface MerkleDataFile {
  name: string;
  size?: string;
}

// 这里列出所有需要下载的文件
const merkleFiles: MerkleDataFile[] = [
  { name: "batches/batch_0.json" },
  { name: "batches/batch_1.json" },
  { name: "batches/batch_2.json" },
  { name: "batches/batch_3.json" },
  { name: "batches/batch_4.json" },
  { name: "batches/batch_5.json" },
  { name: "batches/batch_6.json" },
  { name: "batches/batch_7.json" },
  { name: "batches/batch_8.json" },
  { name: "address_map.json" },
  { name: "merkle_data.json" },
  // 可以根据实际数据文件添加更多
];

export default function MerkleDataDownloader() {
  const [loading, setLoading] = useState<string | null>(null);

  const downloadFile = async (filename: string) => {
    try {
      setLoading(filename);
      
      // 获取预签名URL
      const response = await fetch('/api/merkle-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });
      
      if (!response.ok) {
        throw new Error('获取下载链接失败');
      }
      
      const { signedUrl } = await response.json();
      
      // 开始下载
      const fileResponse = await fetch(signedUrl);
      if (!fileResponse.ok) {
        throw new Error('下载文件失败');
      }
      
      const blob = await fileResponse.blob();
      const url = window.URL.createObjectURL(blob);
      
      // 创建下载链接并触发
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`下载文件出错 ${filename}:`, error);
      alert(`下载文件失败: ${filename}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Merkle 数据文件</h2>
      <div className="space-y-2">
        {merkleFiles.map((file) => (
          <div key={file.name} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
            <span>{file.name}</span>
            <button
              onClick={() => downloadFile(file.name)}
              disabled={loading === file.name}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading === file.name ? '下载中...' : '下载'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 