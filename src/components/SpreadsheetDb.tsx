import React, { useState, useEffect } from "react";
import { api, toast } from "../utils/api";
import { 
  FileSpreadsheet, 
  RotateCcw, 
  Save, 
  Table, 
  Settings, 
  FileJson,
  Upload,
  AlertCircle
} from "lucide-react";

export default function SpreadsheetDb() {
  const [dbData, setDbData] = useState<any>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>("siswa");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sheet Tabs
  const sheets = [
    { id: "users", label: "📄 Users" },
    { id: "guru", label: "🎓 Guru" },
    { id: "siswa", label: "👦 Siswa" },
    { id: "kelas", label: "🏫 Kelas" },
    { id: "absensi", label: "📝 Absensi" },
    { id: "pengumuman", label: "📢 Pengumuman" },
    { id: "kalender", label: "📅 Kalender" },
    { id: "settings", label: "⚙️ Settings" }
  ];

  useEffect(() => {
    fetchSpreadsheet();
  }, []);

  const fetchSpreadsheet = async () => {
    setLoading(true);
    try {
      const data = await api.get("/spreadsheet");
      setDbData(data);
    } catch (e) {
      toast.show("Gagal menyinkronkan data!", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update cell locally in table state
  const handleCellChange = (index: number, field: string, val: any) => {
    if (!dbData) return;
    
    setDbData((prev: any) => {
      const updatedTable = [...prev[selectedSheet]];
      updatedTable[index] = {
        ...updatedTable[index],
        [field]: val
      };
      return {
        ...prev,
        [selectedSheet]: updatedTable
      };
    });
  };

  // Add blank row to emulate inserting row in Google Sheets
  const handleAddRow = () => {
    if (!dbData || !dbData[selectedSheet]) return;
    const tableData = dbData[selectedSheet];
    const templateRow = tableData.length > 0 ? { ...tableData[0] } : {};
    
    // Clear fields
    Object.keys(templateRow).forEach((key) => {
      if (key === "id") {
        templateRow[key] = "ROW-" + Date.now();
      } else if (typeof templateRow[key] === "number") {
        templateRow[key] = 0;
      } else {
        templateRow[key] = "";
      }
    });

    setDbData((prev: any) => ({
      ...prev,
      [selectedSheet]: [...prev[selectedSheet], templateRow]
    }));
    toast.show("Baris kosong baru berhasil ditambahkan", "info");
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    if (!dbData) return;
    setDbData((prev: any) => {
      const updatedTable = [...prev[selectedSheet]];
      updatedTable.splice(index, 1);
      return {
        ...prev,
        [selectedSheet]: updatedTable
      };
    });
    toast.show("Baris terpilih berhasil dihapus", "info");
  };

  // Push updated table directly to Supabase (overwrite semua baris di tabel terpilih)
  const handleSaveSheet = async () => {
    setSaving(true);
    try {
      await api.put(`/spreadsheet/${selectedSheet}`, {
        rows: dbData[selectedSheet]
      });
      toast.show(`Data [ ${selectedSheet.toUpperCase()} ] berhasil disinkronkan!`, "success");
      fetchSpreadsheet();
    } catch (e: any) {
      toast.show(e.message || "Gagal memperbarui data!", "error");
    } finally {
      setSaving(false);
    }
  };

  // Render raw sheet columns as inputs dynamically
  const renderSheetGrid = () => {
    if (!dbData || !dbData[selectedSheet]) return null;

    const rows = dbData[selectedSheet];
    if (selectedSheet === "settings") {
      // Special handle single object settings
      const settingsObj = dbData.settings || {};
      return (
        <div className="p-6 max-w-xl space-y-4">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider border-b pb-2 mb-4">Pengaturan Variabel Spreadsheet (Global Settings)</h3>
          {Object.keys(settingsObj).map((key) => (
            <div key={key} className="grid grid-cols-3 gap-2 items-center">
              <span className="text-xs font-mono font-semibold text-slate-500 truncate">{key}</span>
              <input
                type="text"
                value={settingsObj[key] || ""}
                onChange={(e) => {
                  setDbData((prev: any) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      [key]: e.target.value
                    }
                  }));
                }}
                className="col-span-2 px-3 py-1.5 border border-slate-200 text-xs rounded-xl focus:ring-2 focus:ring-emerald-500/20 font-medium"
              />
            </div>
          ))}
          <div className="pt-4 flex justify-end">
            <button
              onClick={async () => {
                setSaving(true);
                try {
                  await api.put("/settings", dbData.settings);
                  toast.show("Pengaturan global berhasil disimpan!", "success");
                } catch(e) {
                  toast.show("Gagal menyimpan pengaturan!", "error");
                } finally { setSaving(false); }
              }}
              className="px-4 py-2 bg-emerald-600 text-xs font-bold text-white rounded-xl hover:bg-emerald-700 transition"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <div className="py-16 text-center text-slate-400">
          <AlertCircle size={24} className="mx-auto mb-2" />
          <p className="text-xs">Tab ini kosong. Klik tombol 'Sipkan Baris' untuk mengisi data.</p>
        </div>
      );
    }

    const columns = Object.keys(rows[0]);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <th className="p-2 border-r border-slate-200 text-center w-12">#</th>
              {columns.map((col) => (
                <th key={col} className="p-2.5 border-r border-slate-200 font-mono text-[10px] text-slate-600 bg-slate-50">
                  {col.toUpperCase()}
                </th>
              ))}
              <th className="p-2 text-center w-12">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {rows.map((row: any, rIdx: number) => (
              <tr key={row.id || rIdx} className="hover:bg-slate-50 transition">
                <td className="p-2 border-r border-slate-200 bg-slate-50 text-center text-[10px] font-bold text-slate-400">
                  {rIdx + 1}
                </td>
                {columns.map((col) => {
                  const val = row[col];
                  const isId = col === "id";
                  return (
                    <td key={col} className="p-1 border-r border-slate-200">
                      <input
                        type="text"
                        disabled={isId}
                        value={val !== null && val !== undefined ? String(val) : ""}
                        onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                        className={`w-full px-2 py-1 text-[11px] border-0 focus:ring-1 focus:ring-emerald-500 focus:bg-white bg-transparent rounded transition ${isId ? "text-slate-400 select-none cursor-not-allowed font-semibold" : "text-slate-800"}`}
                      />
                    </td>
                  );
                })}
                <td className="p-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(rIdx)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded transition"
                    title="Hapus baris"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header toolbar manajemen data */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden flex flex-col">
        {/* Real-time sync toolbar */}
        <div className="bg-emerald-800 text-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white text-emerald-800 flex items-center justify-center shadow-md">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight">SIA-MIS_data_master</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-[8px] font-bold tracking-wider uppercase border border-emerald-400">
                  Tersambung ✔️
                </span>
              </div>
              <p className="text-[10px] text-emerald-100 mt-0.5">Tampilan data langsung secara real-time</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAddRow}
              disabled={selectedSheet === "settings" || loading}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-[11px] font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
            >
              ➕ Sisipkan Baris
            </button>

            <button
              onClick={fetchSpreadsheet}
              disabled={loading}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-[11px] font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw size={12} />
              Segarkan
            </button>

            <button
              onClick={handleSaveSheet}
              disabled={loading || saving}
              className="px-4 py-1.5 bg-white text-emerald-900 hover:bg-emerald-50 text-[11px] font-bold rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <svg className="animate-spin h-3 w-3 text-emerald-900" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Save size={12} />
              )}
              Simpan & Sinkronkan
            </button>
          </div>
        </div>

        {/* Navigasi tab tabel data */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 py-1 flex gap-1 overflow-x-auto select-none shrink-0 scrollbar-none">
          {sheets.map((sheet) => {
            const isActive = selectedSheet === sheet.id;
            return (
              <button
                key={sheet.id}
                onClick={() => setSelectedSheet(sheet.id)}
                className={`px-4 py-1.5 rounded-t-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 ${isActive ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:bg-slate-200/50"}`}
              >
                {sheet.label}
              </button>
            );
          })}
        </div>

        {/* Spreadsheet main grid area */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-3 bg-white">
            <svg className="animate-spin h-8 w-8 text-emerald-800" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-400 text-xs font-semibold">Mengambil data terbaru...</p>
          </div>
        ) : (
          <div className="bg-white min-h-[300px]">
            {renderSheetGrid()}
          </div>
        )}
      </div>

      {/* Catatan penggunaan modul */}
      <div className="bg-slate-100 border border-slate-200/60 p-4 rounded-3xl text-xs text-slate-500 space-y-1">
        <h4 className="font-bold text-slate-700">💡 Mengenai "Manajemen Data"</h4>
        <p className="leading-relaxed">
          Modul ini memungkinkan administrator melihat dan menyunting data setiap tabel secara langsung layaknya lembar kerja. Melakukan kesalahan penulisan di sini dapat memicu inkonsistensi relasional data; gunakan secara bijak!
        </p>
      </div>
    </div>
  );
}
