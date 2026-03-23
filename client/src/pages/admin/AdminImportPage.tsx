import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useImportData, useImportHistory } from '@/hooks/useAdmin';
import { importRowSchema, type ImportRowData } from '@/schemas/import.schema';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import type { ImportStatus } from '@/types';

interface ParsedResult {
  validRows: ImportRowData[];
  errors: Array<{ row: number; message: string }>;
  headers: string[];
  preview: Record<string, unknown>[];
}

export function AdminImportPage() {
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const importData = useImportData();
  const { data: imports, isPending: historyLoading } = useImportHistory();

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const isCSV = file.name.endsWith('.csv');

    if (isCSV) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as Record<string, string>[];
          validateRows(rows);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) return;
        const worksheet = workbook.Sheets[firstSheet];
        if (!worksheet) return;
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);
        validateRows(rows);
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const validateRows = (rows: Record<string, unknown>[]) => {
    const validRows: ImportRowData[] = [];
    const errors: Array<{ row: number; message: string }> = [];
    const headers = rows.length > 0 ? Object.keys(rows[0] as Record<string, unknown>) : [];

    rows.forEach((row, index) => {
      const result = importRowSchema.safeParse(row);
      if (result.success) {
        validRows.push(result.data);
      } else {
        const errorMsgs = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        errors.push({ row: index + 1, message: errorMsgs });
      }
    });

    setParsedResult({
      validRows,
      errors,
      headers,
      preview: rows.slice(0, 5) as Record<string, unknown>[],
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirmImport = () => {
    if (!parsedResult || parsedResult.validRows.length === 0) return;
    importData.mutate(
      { filename: fileName, rows: parsedResult.validRows as unknown as Record<string, unknown>[] },
      {
        onSuccess: () => {
          setParsedResult(null);
          setFileName('');
        },
      }
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Data Import</h1>
        <p className="text-slate-500 mt-1">
          Upload an Excel (.xlsx) or CSV file exported from your management system.
          The portal will validate and import customer, property, and financial data automatically.
        </p>
      </div>

      {/* Upload area */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-2">
              Drag and drop your file here, or{' '}
              <label className="text-emerald-600 hover:underline cursor-pointer font-medium">
                browse
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-xs text-slate-400">Supports CSV and Excel (.xlsx) files</p>
          </div>
        </CardContent>
      </Card>

      {/* Preview & validation */}
      {parsedResult && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" /> {fileName}
              </CardTitle>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="h-4 w-4" /> {parsedResult.validRows.length} valid
                </span>
                {parsedResult.errors.length > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" /> {parsedResult.errors.length} errors
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Preview table */}
            {parsedResult.preview.length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      {parsedResult.headers.map((h) => (
                        <th key={h} className="py-2 px-3 text-xs font-medium text-slate-500 uppercase whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedResult.preview.map((row, i) => (
                      <tr key={i} className="border-b">
                        {parsedResult.headers.map((h) => (
                          <td key={h} className="py-2 px-3 text-slate-600 whitespace-nowrap">
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-slate-400 mt-2">Showing first 5 rows of {parsedResult.validRows.length + parsedResult.errors.length}</p>
              </div>
            )}

            {/* Errors */}
            {parsedResult.errors.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-4 max-h-48 overflow-y-auto">
                <h4 className="text-sm font-semibold text-red-700 mb-2">Row Errors</h4>
                {parsedResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">
                    Row {err.row}: {err.message}
                  </p>
                ))}
              </div>
            )}

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={parsedResult.validRows.length === 0 || importData.isPending}
              onClick={handleConfirmImport}
            >
              {importData.isPending
                ? 'Importing...'
                : `Confirm Import — ${parsedResult.validRows.length} rows`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Import history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Import History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading && <LoadingSkeleton rows={3} />}
          {imports && imports.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">No imports yet</p>
          )}
          {imports && imports.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="py-2 px-3 text-xs font-medium text-slate-500 uppercase">Filename</th>
                    <th className="py-2 px-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                    <th className="py-2 px-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="py-2 px-3 text-xs font-medium text-slate-500 uppercase">Rows</th>
                    <th className="py-2 px-3 text-xs font-medium text-slate-500 uppercase">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {imports.map((imp) => (
                    <tr key={imp.id} className="border-b hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-sm font-medium">{imp.filename}</td>
                      <td className="py-2.5 px-3 text-sm text-slate-500">
                        {new Date(imp.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={imp.status as ImportStatus} />
                      </td>
                      <td className="py-2.5 px-3 text-sm">{imp.row_count}</td>
                      <td className="py-2.5 px-3 text-sm text-slate-500">
                        {imp.error_log ? 'View' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
