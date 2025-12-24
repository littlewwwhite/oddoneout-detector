import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, Trash2, Plus, Upload, ArrowLeft, Eye } from 'lucide-react';
import { HistoryItem, LogEntry, Language } from '../types';
import { loadCustomRecords, saveCustomRecord, deleteCustomRecord } from '../services/customRecordStore';

interface CustomHistoryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

type ViewMode = 'list' | 'add' | 'view';

export const CustomHistoryViewModal: React.FC<CustomHistoryViewModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [records, setRecords] = useState<HistoryItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [viewingItem, setViewingItem] = useState<HistoryItem | null>(null);
  const [inputImage, setInputImage] = useState('');
  const [outputImage, setOutputImage] = useState('');
  const [zoomImage, setZoomImage] = useState('');
  const [found, setFound] = useState(true);
  const [reason, setReason] = useState('');
  const [confidence, setConfidence] = useState(0.95);
  const [suggestion, setSuggestion] = useState('');
  const [duration, setDuration] = useState(1500);
  const [logs, setLogs] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' }[]>([{ message: '', type: 'info' }]);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLInputElement>(null);
  const zoomRef = useRef<HTMLInputElement>(null);

  const isZh = lang === 'zh';

  useEffect(() => {
    if (isOpen) {
      loadCustomRecords().then(setRecords);
      setViewMode('list');
      setViewingItem(null);
    }
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setInputImage('');
    setOutputImage('');
    setZoomImage('');
    setFound(true);
    setReason('');
    setConfidence(0.95);
    setSuggestion('');
    setDuration(1500);
    setLogs([{ message: '', type: 'info' }]);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setViewingItem(null);
    resetForm();
  };

  const handleViewItem = (item: HistoryItem) => {
    setViewingItem(item);
    setViewMode('view');
  };

  const handleSave = async () => {
    if (!inputImage || !outputImage) return;

    const timestamp = Date.now();
    const customLogs: LogEntry[] = logs
      .filter(l => l.message.trim())
      .map((l, i) => ({
        id: `custom-${timestamp}-${i}`,
        message: l.message,
        timestamp: new Date(timestamp + i * 100).toISOString(),
        type: l.type,
      }));

    const item: HistoryItem = {
      id: `custom-${timestamp}`,
      timestamp,
      imageSrc: outputImage,
      originalImageSrc: inputImage,
      zoomImageSrc: zoomImage || undefined,
      status: 'success',
      duration,
      customLogs: customLogs.length > 0 ? customLogs : undefined,
      result: {
        found,
        gridSize: { rows: 3, cols: 3 },
        description: reason,
        reason,
        confidence,
        suggestion: suggestion || undefined,
      },
    };

    await saveCustomRecord(item);
    setRecords(prev => [item, ...prev]);
    resetForm();
    setViewMode('list');
  };

  const handleDelete = async (id: string) => {
    await deleteCustomRecord(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  if (!isOpen) return null;

  const renderHeader = () => (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
      <div className="flex items-center gap-3">
        {viewMode !== 'list' && (
          <button onClick={handleBackToList} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
        )}
        <h2 className="text-lg font-semibold text-slate-800">
          {viewMode === 'list' ? (isZh ? '自定义记录' : 'Custom Records') :
           viewMode === 'add' ? (isZh ? '添加记录' : 'Add Record') :
           (isZh ? '查看记录' : 'View Record')}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        {viewMode === 'list' && (
          <button
            onClick={() => setViewMode('add')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isZh ? '添加' : 'Add'}
          </button>
        )}
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>
    </div>
  );

  const renderViewMode = () => {
    if (!viewingItem) return null;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { src: viewingItem.originalImageSrc, label: isZh ? '输入图片' : 'Input' },
            { src: viewingItem.imageSrc, label: isZh ? '输出图片' : 'Output' },
            { src: viewingItem.zoomImageSrc, label: isZh ? '放大图' : 'Zoom' },
          ].map(({ src, label }) => (
            <div key={label}>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
              <div className="aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">{isZh ? '无' : 'N/A'}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{isZh ? '结果' : 'Result'}</label>
            <div className={`py-2 px-3 rounded-lg border text-sm ${viewingItem.result?.found ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700'}`}>
              {viewingItem.result?.found ? <><AlertCircle className="w-4 h-4 inline mr-1" />{isZh ? '异常' : 'Found'}</> : <><CheckCircle2 className="w-4 h-4 inline mr-1" />{isZh ? '正常' : 'Normal'}</>}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{isZh ? '置信度' : 'Confidence'}</label>
            <div className="py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm">{Math.round((viewingItem.result?.confidence || 0) * 100)}%</div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">{isZh ? '分析' : 'Analysis'}</label>
          <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 min-h-[60px]">{viewingItem.result?.reason || '-'}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{isZh ? '分析建议' : 'Suggestion'}</label>
            <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">{viewingItem.result?.suggestion || '-'}</div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{isZh ? '分析时长' : 'Duration'}</label>
            <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">{((viewingItem.duration || 0) / 1000).toFixed(1)}s</div>
          </div>
        </div>

        {viewingItem.customLogs && viewingItem.customLogs.length > 0 && (
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{isZh ? '日志' : 'Logs'}</label>
            <div className="space-y-1 p-2 border border-slate-200 rounded-lg bg-slate-50">
              {viewingItem.customLogs.map((log, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    log.type === 'error' ? 'bg-red-100 text-red-600' :
                    log.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                    log.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-200 text-slate-600'
                  }`}>{log.type}</span>
                  <span className="text-slate-600">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAddMode = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { ref: inputRef, value: inputImage, setter: setInputImage, label: isZh ? '输入图片 *' : 'Input *' },
          { ref: outputRef, value: outputImage, setter: setOutputImage, label: isZh ? '输出图片 *' : 'Output *' },
          { ref: zoomRef, value: zoomImage, setter: setZoomImage, label: isZh ? '放大图' : 'Zoom' },
        ].map(({ ref, value, setter, label }) => (
          <div key={label}>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setter)} />
            <div
              onClick={() => ref.current?.click()}
              className={`aspect-square rounded-lg border-2 border-dashed cursor-pointer flex items-center justify-center overflow-hidden ${
                value ? 'border-indigo-300' : 'border-slate-300 hover:border-indigo-400'
              }`}
            >
              {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <Upload className="w-6 h-6 text-slate-400" />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">{isZh ? '结果' : 'Result'}</label>
          <div className="flex gap-2">
            <button onClick={() => setFound(true)} className={`flex-1 py-2 rounded-lg border text-sm ${found ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200'}`}>
              <AlertCircle className="w-4 h-4 inline mr-1" />{isZh ? '异常' : 'Found'}
            </button>
            <button onClick={() => setFound(false)} className={`flex-1 py-2 rounded-lg border text-sm ${!found ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-200'}`}>
              <CheckCircle2 className="w-4 h-4 inline mr-1" />{isZh ? '正常' : 'Normal'}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">{isZh ? '置信度' : 'Confidence'}: {Math.round(confidence * 100)}%</label>
          <input type="range" min="0" max="100" value={confidence * 100} onChange={(e) => setConfidence(Number(e.target.value) / 100)} className="w-full h-2 bg-slate-200 rounded-lg accent-indigo-600" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">{isZh ? '分析' : 'Analysis'}</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={isZh ? '输入分析内容...' : 'Enter analysis...'} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none" rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">{isZh ? '分析建议' : 'Suggestion'}</label>
          <input value={suggestion} onChange={(e) => setSuggestion(e.target.value)} placeholder={isZh ? '输入建议...' : 'Enter suggestion...'} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">{isZh ? '分析时长' : 'Duration'}: {(duration / 1000).toFixed(1)}s</label>
          <input type="range" min="500" max="10000" step="100" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg accent-indigo-600" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-slate-600">{isZh ? '日志' : 'Logs'}</label>
          <button onClick={() => setLogs([...logs, { message: '', type: 'info' }])} className="text-xs text-indigo-600">+ {isZh ? '添加' : 'Add'}</button>
        </div>
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <select value={log.type} onChange={(e) => { const n = [...logs]; n[i].type = e.target.value as any; setLogs(n); }} className="px-2 py-1.5 border border-slate-300 rounded text-xs">
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <input value={log.message} onChange={(e) => { const n = [...logs]; n[i].message = e.target.value; setLogs(n); }} placeholder={isZh ? '日志内容...' : 'Log...'} className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-xs" />
              {logs.length > 1 && <button onClick={() => setLogs(logs.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={handleBackToList} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">{isZh ? '取消' : 'Cancel'}</button>
        <button onClick={handleSave} disabled={!inputImage || !outputImage} className={`px-4 py-2 text-sm text-white rounded-lg ${inputImage && outputImage ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300'}`}>{isZh ? '保存' : 'Save'}</button>
      </div>
    </div>
  );

  const renderListMode = () => (
    records.length === 0 ? (
      <div className="text-center py-12 text-slate-400">{isZh ? '暂无自定义记录' : 'No custom records yet'}</div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {records.map((item) => (
          <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:border-indigo-300 transition-colors group">
            <div className="aspect-square relative cursor-pointer" onClick={() => handleViewItem(item)}>
              <img src={item.imageSrc} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2">
                {item.result?.found ? (
                  <div className="bg-red-500 text-white p-1 rounded-full"><AlertCircle className="w-3 h-3" /></div>
                ) : (
                  <div className="bg-emerald-500 text-white p-1 rounded-full"><CheckCircle2 className="w-3 h-3" /></div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {item.result?.reason && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.result.reason}</p>}
            </div>
          </div>
        ))}
      </div>
    )
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {renderHeader()}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === 'list' && renderListMode()}
          {viewMode === 'add' && renderAddMode()}
          {viewMode === 'view' && renderViewMode()}
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-sm text-slate-500">{isZh ? `共 ${records.length} 条` : `${records.length} records`}</span>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg">{isZh ? '关闭' : 'Close'}</button>
        </div>
      </div>
    </div>
  );
};
