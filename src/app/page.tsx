'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import {
  Plus, Trash2, FileDown, ArrowLeft, Calendar, RefreshCw,
  ArrowDownAZ, ArrowDown10
} from 'lucide-react';
import Link from 'next/link';

interface QR { text: string; url: string; }
interface Row { id: string; title: string; qrs: QR[]; }

export default function TablePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [globalDate, setGlobalDate] = useState('');
  const [useAlpha, setUseAlpha] = useState(true);

  // Default values — now EMPTY
  const [defaultProduct, setDefaultProduct] = useState('');
  const [defaultBatch, setDefaultBatch] = useState('');
  const [defaultMisc, setDefaultMisc] = useState('');

  useEffect(() => {
    setGlobalDate(new Date().toISOString().split('T')[0]);
  }, []);

  const generateSerial = () => {
    const d = new Date(globalDate);
    const yy = d.getFullYear().toString().slice(-2);
    const doy = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
      .toString().padStart(3, '0');
    const rand = useAlpha
      ? Math.random().toString(36).substring(2, 7).toUpperCase()
      : Math.floor(10000 + Math.random() * 90000).toString();
    return `${yy}${doy}${rand}`;
  };

  const addRow = () => {
    const serial = generateSerial();
    setRows(prev => [...prev, {
      id: Date.now().toString(),
      title: 'New Item',
      qrs: [
        { text: defaultProduct, url: '' },
        { text: serial, url: '' },
        { text: defaultBatch, url: '' },
        { text: defaultMisc, url: '' },
      ],
    }]);
  };

  const regenerateSerial = (rowId: string) => {
    const code = generateSerial();
    setRows(prev => prev.map(r => r.id === rowId
      ? { ...r, qrs: r.qrs.map((q, i) => i === 1 ? { ...q, text: code } : q) }
      : r
    ));
    setTimeout(() => generateQR(rowId, 1, code), 100);
  };

  const generateQR = async (rowId: string, i: number, text: string) => {
    if (!text.trim()) return;
    try {
      const url = await QRCode.toDataURL(text, {
        width: 128, margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      setRows(prev => prev.map(r => r.id === rowId
        ? { ...r, qrs: r.qrs.map((q, j) => j === i ? { ...q, url } : q) }
        : r
      ));
    } catch (e) { }
  };

  useEffect(() => {
    rows.forEach(r => r.qrs.forEach((q, i) => q.text && !q.url && generateQR(r.id, i, q.text)));
  }, [rows]);

  const updateText = (rowId: string, i: number, text: string) => {
    setRows(prev => prev.map(r => r.id === rowId
      ? { ...r, qrs: r.qrs.map((q, j) => j === i ? { ...q, text } : q) }
      : r
    ));
    if (i !== 1) setTimeout(() => generateQR(rowId, i, text), 100);
  };

  const deleteRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const w = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(16).setFont('helvetica', 'bold');
    doc.text('Product QR Codes', w / 2, y, { align: 'center' });
    y += 12;

    doc.setFontSize(10);
    y += 10;

    rows.forEach((row, idx) => {
      if (y > 250) { doc.addPage(); y = 20; }

      // TITLE FIRST (above QRs)
      doc.setFontSize(10).setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${row.title}`, 15, y);
      y += 8;

      // Then 4 QRs in a row
      row.qrs.forEach((qr, i) => {
        const x = 15 + i * 48;
        if (qr.url) {
          doc.addImage(qr.url, 'PNG', x, y, 36, 36);
          doc.setFontSize(7).setFont('helvetica', 'normal');
          doc.text(qr.text || '[empty]', x + 18, y + 40, { align: 'center', maxWidth: 36 });
        }
      });

      y += 52; // Space for QR + text + padding
    });

    doc.save(`Product_QRs_${globalDate}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 py-5 max-w-4xl">
        {/* HEADER */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Link>
              <div>
                <h1 className="font-bold text-gray-900">Product Serial Batch QR Generator</h1>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-700" />
                <input
                  type="date"
                  value={globalDate}
                  onChange={e => setGlobalDate(e.target.value)}
                  className="h-9 text-xs px-2.5 border border-gray-400 rounded-lg bg-white text-gray-800 font-medium focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="inline-flex rounded-lg shadow-sm" role="group">
                <button
                  onClick={() => setUseAlpha(true)}
                  className={`h-9 px-3 text-xs font-medium rounded-l-lg border border-gray-300 flex items-center gap-1 transition-all ${useAlpha ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  <ArrowDownAZ className="w-3.5 h-3.5" /> A-Z
                </button>
                <button
                  onClick={() => setUseAlpha(false)}
                  className={`h-9 px-3 text-xs font-medium rounded-r-lg border border-gray-300 flex items-center gap-1 transition-all ${!useAlpha ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  <ArrowDown10 className="w-3.5 h-3.5" /> 0-9
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={addRow} className="h-9 px-3 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Row
                </button>
                <button onClick={exportPDF} className="h-9 px-3 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 shadow-sm">
                  <FileDown className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DEFAULT VALUES BOX */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 mb-6 shadow-sm">
          <h3 className="text-sm font-bold text-blue-900 mb-3">Default Values</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Product</label>
              <input
                type="text"
                value={defaultProduct}
                onChange={e => setDefaultProduct(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-blue-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:border-blue-600 focus:outline-none"
                placeholder="e.g. Widget Pro or ABCZYX123"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Batch</label>
              <input
                type="text"
                value={defaultBatch}
                onChange={e => setDefaultBatch(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-blue-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:border-blue-600 focus:outline-none"
                placeholder="e.g. B2025"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1">Misc</label>
              <input
                type="text"
                value={defaultMisc}
                onChange={e => setDefaultMisc(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-blue-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:border-blue-600 focus:outline-none"
                placeholder="e.g. Notes, PO, Order etc."
              />
            </div>
          </div>
        </div>

        {/* ROWS */}
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.id} className="bg-white rounded-lg border border-gray-200 p-2.5 shadow-xs">
              <div className="flex justify-between items-center mb-2">
                <input
                  type="text"
                  value={row.title}
                  onChange={e => setRows(prev => prev.map(r => r.id === row.id ? { ...r, title: e.target.value } : r))}
                  className="text-xs font-bold text-gray-800 bg-transparent outline-none"
                  placeholder="Item name"
                />
                <button onClick={() => deleteRow(row.id)} className="p-1.5 hover:bg-red-50 rounded">
                  <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {['Product', 'Serial', 'Batch', 'Misc'].map((label, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="mb-1">
                      {row.qrs[i]?.url ? (
                        <img src={row.qrs[i].url} alt={label} className="w-28 h-28" />
                      ) : (
                        <div className="w-28 h-28 bg-gray-100 rounded animate-pulse" />
                      )}
                    </div>
                    <div className="w-full flex items-center gap-1">
                      <input
                        type="text"
                        value={row.qrs[i]?.text || ''}
                        onChange={e => updateText(row.id, i, e.target.value)}
                        readOnly={i === 1}
                        placeholder={i === 1 ? 'Auto' : label}
                        className={`w-full px-2 py-1 text-xs text-center font-mono border rounded bg-gray-50 text-gray-800 ${i === 1 ? 'cursor-not-allowed opacity-70' : 'focus:border-blue-500 focus:outline-none'}`}
                      />
                      {i === 1 && (
                        <button onClick={() => regenerateSerial(row.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {rows.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            Set defaults (or not) and a Add Row
          </div>
        )}
      </div>
    </div>
  );
}
