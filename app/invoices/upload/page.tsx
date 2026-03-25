'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

export default function UploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/');
    if (!loading && user && user.role !== 'rose') router.push('/dashboard');
  }, [user, loading, router]);

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 20 Mo');
      return;
    }
    setFile(f);
    setError('');
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !supplier.trim()) {
      setError('Veuillez sélectionner un fichier et indiquer le fournisseur');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('supplier', supplier);
    if (amount) formData.append('amount', amount);
    if (invoiceDate) formData.append('invoice_date', invoiceDate);
    if (description) formData.append('description', description);

    const res = await fetch('/api/invoices', { method: 'POST', body: formData });
    const data = await res.json();

    setUploading(false);

    if (!res.ok) {
      setError(data.error || 'Erreur lors du téléversement');
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push(`/invoices/${data.id}`), 1500);
  };

  if (loading) return null;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <CheckCircle size={48} className="text-green-500" />
        <p className="text-xl font-semibold text-gray-900">Facture déposée avec succès !</p>
        <p className="text-gray-500">Redirection vers le détail de la facture...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Déposer une facture</h1>
        <p className="text-gray-500 mt-1">La facture sera soumise au circuit de validation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* File drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            dragOver ? 'border-amber-400 bg-amber-50' :
            file ? 'border-green-400 bg-green-50' :
            'border-gray-300 hover:border-amber-400 hover:bg-amber-50'
          }`}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText size={32} className="text-green-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setFile(null); }}
                className="ml-2 text-gray-400 hover:text-red-500"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div>
              <Upload size={36} className="mx-auto mb-3 text-gray-400" />
              <p className="font-medium text-gray-700">Glissez-déposez votre PDF ici</p>
              <p className="text-sm text-gray-400 mt-1">ou cliquez pour sélectionner (max. 20 Mo)</p>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fournisseur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={supplier}
              onChange={e => setSupplier(e.target.value)}
              required
              placeholder="Ex: EDF Entreprises, Schneider Electric..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant TTC (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de la facture</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description / Objet</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Ex: Installation panneaux solaires chantier Lyon..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={uploading || !file}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Upload size={18} />
                Soumettre au circuit de validation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
