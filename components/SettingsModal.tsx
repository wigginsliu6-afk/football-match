
import React, { useState, useEffect } from 'react';
import { ApiSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: ApiSettings) => void;
  initialSettings: ApiSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings }) => {
  const [apiKey, setApiKey] = useState(initialSettings.apiKey);
  const [baseUrl, setBaseUrl] = useState(initialSettings.baseUrl);
  const [useSearchGrounding, setUseSearchGrounding] = useState(initialSettings.useSearchGrounding);

  useEffect(() => {
    if (isOpen) {
      setApiKey(initialSettings.apiKey);
      setBaseUrl(initialSettings.baseUrl);
      setUseSearchGrounding(initialSettings.useSearchGrounding);
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ apiKey, baseUrl, useSearchGrounding });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <i className="fas fa-cog"></i> 高级设置
          </h2>
          <button onClick={onClose} className="text-emerald-100 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              API Key <span className="text-slate-400 font-normal">(可选)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="覆盖默认的环境变量 Key"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-mono"
            />
            <p className="text-[10px] text-slate-400">
              如果默认 Key 失效，请在此处粘贴新的 Key。
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              API Base URL / 代理地址 <span className="text-slate-400 font-normal">(推荐)</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="例如: https://my-proxy.worker.dev"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-mono"
            />
            <p className="text-[10px] text-slate-400">
              微信/百度浏览器建议填写代理地址以绕过网络封锁。
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="block text-sm font-bold text-slate-700">启用 Google 搜索增强</span>
              <span className="text-[10px] text-slate-400">获取实时赛程数据</span>
            </div>
            <button
              onClick={() => setUseSearchGrounding(!useSearchGrounding)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useSearchGrounding ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${useSearchGrounding ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">
            取消
          </button>
          <button onClick={handleSave} className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors">
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
