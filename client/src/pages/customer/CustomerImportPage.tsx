import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { settingsApi } from '@/api/settings.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CustomerImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importResult, setImportResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a valid CSV file');
      return;
    }

    setFile(selectedFile);
    setParsedData(null);
    setImportStatus('idle');
    setImportResult(null);
    parseFile(selectedFile);
  };

  const parseFile = (fileToParse: File) => {
    setIsParsing(true);
    Papa.parse(fileToParse, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedData(results.data);
        setIsParsing(false);
      },
      error: (error) => {
        toast.error('Failed to parse CSV', { description: error.message });
        setIsParsing(false);
      }
    });
  };

  const importMutation = useMutation({
    mutationFn: (rows: any[]) => settingsApi.importData(file!.name, rows),
    onSuccess: (data) => {
      setImportStatus('success');
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('Data imported successfully');
    },
    onError: (error: Error) => {
      setImportStatus('error');
      toast.error('Import failed', { description: error.message });
    }
  });

  const handleImport = () => {
    if (!parsedData || parsedData.length === 0) {
      toast.error('No data to import');
      return;
    }
    setImportStatus('importing');
    importMutation.mutate(parsedData);
  };

  const resetForm = () => {
    setFile(null);
    setParsedData(null);
    setImportStatus('idle');
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Import Data</h1>
        <p className="text-slate-500 mt-1">Upload properties and customer records via CSV for your account</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Data Upload</CardTitle>
            <CardDescription>
              Upload a CSV file containing property details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!file ? (
              <div 
                className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">Click to upload CSV</h3>
                <p className="text-slate-500 text-sm mb-4">Maximum file size 10MB</p>
                <Button variant="outline" size="sm">Select File</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded shadow-sm">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{file.name}</p>
                      <p className="text-sm text-slate-500">
                        {isParsing ? 'Parsing...' : parsedData ? `${parsedData.length} rows found` : 'Ready'}
                      </p>
                    </div>
                  </div>
                  {importStatus === 'idle' && (
                    <Button variant="ghost" size="sm" onClick={resetForm}>Change File</Button>
                  )}
                </div>

                {importStatus === 'idle' && parsedData && (
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleImport}
                    disabled={parsedData.length === 0}
                  >
                    Start Import
                  </Button>
                )}

                {importStatus === 'importing' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Importing data...
                      </span>
                      <span className="text-slate-500">Please wait</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                )}

                {importStatus === 'success' && importResult && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <h5 className="font-medium leading-none tracking-tight">Import Complete</h5>
                    </div>
                    <div className="text-sm text-emerald-700 mt-2">
                      Successfully imported {importResult.rowsImported} rows.
                      {importResult.errors?.length > 0 && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Some rows had errors:</p>
                          <ul className="list-disc list-inside mt-1 max-h-32 overflow-y-auto">
                            {importResult.errors.map((err: string, i: number) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" className="mt-4 border-emerald-200 text-emerald-800 hover:bg-emerald-100" onClick={resetForm}>
                      Import Another File
                    </Button>
                  </div>
                )}

                {importStatus === 'error' && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <h5 className="font-medium leading-none tracking-tight">Import Failed</h5>
                    </div>
                    <div className="text-sm text-red-700 mt-2">
                      There was a problem importing your data. Please check the file format and try again.
                    </div>
                    <Button variant="outline" className="mt-4 border-red-200 text-red-800 hover:bg-red-100" onClick={resetForm}>
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileSelect}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
