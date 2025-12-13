import React from 'react';
import { X, Upload, Eye, History, Settings, CheckCircle } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Record<string, string>;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">📖</span>
            {t.tutorial || 'Tutorial'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

          {/* Quick Start */}
          <section>
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">1</span>
              {t.tutorialQuickStart || '快速开始'}
            </h3>
            <div className="space-y-2.5 ml-8">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <Settings className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-700 text-sm">{t.tutorialConfigApi || '配置 API 密钥'}</p>
                  <p className="text-xs text-slate-500 mt-1">{t.tutorialConfigApiDesc || '首次使用需要在设置中填入 API URL、API Key 和模型名称'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Basic Usage */}
          <section>
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">2</span>
              {t.tutorialBasicUsage || '基本使用'}
            </h3>
            <div className="space-y-2.5 ml-8">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <Upload className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-700 text-sm">{t.tutorialUpload || '上传图片'}</p>
                  <p className="text-xs text-slate-500 mt-1">{t.tutorialUploadDesc || '拖拽或点击上传区域，选择包含网格物体的图片（支持批量上传）'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <Eye className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-700 text-sm">{t.tutorialView || '查看结果'}</p>
                  <p className="text-xs text-slate-500 mt-1">{t.tutorialViewDesc || 'AI 会自动分析图片，标注异常位置，并显示置信度和详细说明'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <History className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-700 text-sm">{t.tutorialHistory || '历史记录'}</p>
                  <p className="text-xs text-slate-500 mt-1">{t.tutorialHistoryDesc || '点击左侧边栏按钮查看所有分析历史，随时切换查看之前的结果'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Image Requirements */}
          <section>
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">3</span>
              {t.tutorialImageReq || '图片要求'}
            </h3>
            <div className="ml-8 space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{t.tutorialReq1 || '网格排列清晰（如 3×3、4×5 等规则布局）'}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{t.tutorialReq2 || '光照均匀，物体边界清晰'}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{t.tutorialReq3 || '异常特征明显（颜色、形状、大小差异）'}</span>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-2">
              <span>💡</span>
              {t.tutorialTips || '使用技巧'}
            </h4>
            <ul className="space-y-1.5 text-xs text-amber-800">
              <li>• {t.tutorialTip1 || '支持批量上传多张图片，系统会自动排队处理'}</li>
              <li>• {t.tutorialTip2 || '检测结果包含位置坐标、置信度和异常原因分析'}</li>
              <li>• {t.tutorialTip3 || '历史记录保存在本地浏览器，刷新页面不会丢失'}</li>
            </ul>
          </section>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            {t.tutorialGotIt || '我知道了'}
          </button>
        </div>
      </div>
    </div>
  );
};
