'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { StatusBadge } from '@/components/StatusBadge';
import { Invoice, Validation, PdfEdit, Annotation } from '@/types';
import { ROLE_TO_STATUS, ROLE_LABELS } from '@/lib/constants';
import {
  CheckCircle, XCircle, FileText, Download, ArrowLeft,
  Stamp, Type, ChevronDown, ChevronUp, History,
  AlertTriangle, Edit3
} from 'lucide-react';

interface InvoiceDetail {
  invoice: Invoice;
  validations: Validation[];
  pdfEdits: PdfEdit[];
}

export default function InvoiceDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<InvoiceDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotText, setAnnotText] = useState('');
  const [annotType, setAnnotType] = useState<'text' | 'stamp'>('stamp');
  const [annotColor, setAnnotColor] = useState('green');
  const [annotPage, setAnnotPage] = useState(0);
  const [savingPdf, setSavingPdf] = useState(false);
  const [savedEditId, setSavedEditId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  const fetchData = () => {
    fetch(`/api/invoices/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setPdfUrl(`/api/invoices/${id}/pdf?t=${Date.now()}`);
      })
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, id]);

  const canValidate = user && data && data.invoice.status === ROLE_TO_STATUS[user.role];

  const handleValidate = async (action: 'approved' | 'rejected') => {
    if (!canValidate) return;
    if (action === 'rejected' && !comment.trim()) {
      setError('Veuillez indiquer un motif de rejet');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = await fetch(`/api/invoices/${id}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comment, annotations: savedEditId ? { editId: savedEditId } : null }),
    });

    const result = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(result.error || 'Erreur lors de la validation');
      return;
    }

    fetchData();
    setComment('');
    setAnnotations([]);
    setSavedEditId(null);
  };

  const addAnnotation = () => {
    if (!annotText.trim()) return;
    setAnnotations(prev => [...prev, {
      type: annotType,
      page: annotPage,
      x: 50,
      y: 100 + prev.length * 60,
      text: annotText,
      color: annotType === 'text' ? annotColor : undefined,
      fontSize: annotType === 'stamp' ? 14 : 12,
    }]);
    setAnnotText('');
  };

  const savePdfWithAnnotations = async () => {
    if (annotations.length === 0) return;
    setSavingPdf(true);
    const res = await fetch(`/api/invoices/${id}/annotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annotations }),
    });
    const result = await res.json();
    setSavingPdf(false);
    if (res.ok) {
      setSavedEditId(result.editId);
      setPdfUrl(`/api/invoices/${id}/pdf?edit_id=${result.editId}&t=${Date.now()}`);
      setAnnotations([]);
      setShowAnnotator(false);
      fetchData();
    }
  };

  if (loading || fetching) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!data) return <div className="text-center py-16 text-gray-500">Facture non trouvée</div>;

  const { invoice, validations, pdfEdits } = data;
  const latestEdit = pdfEdits[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="mt-1 text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{invoice.supplier}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-gray-500 mt-1 text-sm">{invoice.original_name}</p>
          </div>
        </div>
        <a
          href={`/api/invoices/${id}/pdf${savedEditId ? `?edit_id=${savedEditId}` : ''}`}
          download
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <Download size={16} />
          Télécharger
        </a>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left: PDF viewer */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-medium text-sm text-gray-700 flex items-center gap-2">
                <FileText size={16} /> Aperçu PDF
                {latestEdit && <span className="text-xs text-amber-600">(version annotée)</span>}
              </span>
              {user?.role !== 'accountant' && (
                <button
                  onClick={() => setShowAnnotator(!showAnnotator)}
                  className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  <Edit3 size={15} />
                  {showAnnotator ? 'Masquer éditeur' : 'Annoter le PDF'}
                </button>
              )}
            </div>
            <div className="bg-gray-100 p-2" style={{ height: '600px' }}>
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full rounded border border-gray-200"
                  title="Aperçu facture"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <FileText size={48} className="opacity-40" />
                </div>
              )}
            </div>
          </div>

          {/* PDF Annotator */}
          {showAnnotator && user?.role !== 'accountant' && (
            <div className="bg-white rounded-xl border border-amber-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Edit3 size={16} className="text-amber-500" />
                Annoter le PDF
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAnnotType('stamp')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        annotType === 'stamp' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700 border-gray-300 hover:border-amber-300'
                      }`}
                    >
                      <Stamp size={14} className="inline mr-1" />
                      Tampon
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnnotType('text')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        annotType === 'text' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700 border-gray-300 hover:border-amber-300'
                      }`}
                    >
                      <Type size={14} className="inline mr-1" />
                      Texte
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Page (0 = première)</label>
                  <input
                    type="number"
                    min="0"
                    value={annotPage}
                    onChange={e => setAnnotPage(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {annotType === 'text' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Couleur du texte</label>
                  <div className="flex gap-2">
                    {['black', 'red', 'blue', 'green'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAnnotColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          annotColor === c ? 'scale-125 border-gray-800' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {annotType === 'stamp' ? 'Texte du tampon' : 'Texte à ajouter'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={annotText}
                    onChange={e => setAnnotText(e.target.value)}
                    placeholder={annotType === 'stamp' ? 'Ex: APPROUVÉ, BON À PAYER...' : 'Ex: À vérifier, OK comptabilité...'}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    onKeyDown={e => e.key === 'Enter' && addAnnotation()}
                  />
                  <button
                    type="button"
                    onClick={addAnnotation}
                    disabled={!annotText.trim()}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Pending annotations */}
              {annotations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">Annotations en attente ({annotations.length})</p>
                  {annotations.map((ann, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-sm">
                      <span>
                        <span className="font-medium capitalize">[{ann.type}]</span>{' '}
                        {ann.text} — page {ann.page + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAnnotations(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={savePdfWithAnnotations}
                    disabled={savingPdf}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                  >
                    {savingPdf ? 'Application en cours...' : 'Appliquer les annotations sur le PDF'}
                  </button>
                </div>
              )}

              {savedEditId && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle size={16} />
                  Annotations appliquées — le PDF a été mis à jour
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Info + validation */}
        <div className="xl:col-span-2 space-y-4">
          {/* Invoice info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Informations</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Fournisseur</dt>
                <dd className="text-sm font-medium text-gray-900">{invoice.supplier}</dd>
              </div>
              {invoice.amount != null && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Montant TTC</dt>
                  <dd className="text-sm font-bold text-gray-900">{invoice.amount.toFixed(2)} €</dd>
                </div>
              )}
              {invoice.invoice_date && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Date facture</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}
                  </dd>
                </div>
              )}
              {invoice.description && (
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Description</dt>
                  <dd className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{invoice.description}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Déposée par</dt>
                <dd className="text-sm font-medium text-gray-900">{invoice.uploader_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Date dépôt</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Workflow progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Circuit de validation</h2>
            <div className="space-y-3">
              {(['rose', 'owner', 'rajaa'] as const).map((step, idx) => {
                const stepValidation = validations.find(v => v.step === step);
                const statusMap: Record<string, string> = { rose: 'pending_rose', owner: 'pending_owner', rajaa: 'pending_rajaa' };
                const isCurrentStep = invoice.status === statusMap[step];
                const stepLabels: Record<string, string> = { rose: 'Rose', owner: 'Directeur', rajaa: 'Rajaa' };

                let stepStatus = 'waiting';
                if (stepValidation) stepStatus = stepValidation.action;
                else if (isCurrentStep) stepStatus = 'current';

                return (
                  <div key={step} className={`flex items-start gap-3 p-3 rounded-lg ${
                    stepStatus === 'current' ? 'bg-amber-50 border border-amber-200' :
                    stepStatus === 'approved' ? 'bg-green-50' :
                    stepStatus === 'rejected' ? 'bg-red-50' : 'bg-gray-50'
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                      stepStatus === 'approved' ? 'bg-green-500 text-white' :
                      stepStatus === 'rejected' ? 'bg-red-500 text-white' :
                      stepStatus === 'current' ? 'bg-amber-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {stepStatus === 'approved' ? '✓' :
                       stepStatus === 'rejected' ? '✗' :
                       idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">{stepLabels[step]}</p>
                      {stepValidation ? (
                        <>
                          <p className={`text-xs font-medium ${stepValidation.action === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                            {stepValidation.action === 'approved' ? 'Approuvée' : 'Rejetée'} le{' '}
                            {new Date(stepValidation.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          {stepValidation.comment && (
                            <p className="text-xs text-gray-500 mt-0.5 italic">&quot;{stepValidation.comment}&quot;</p>
                          )}
                        </>
                      ) : isCurrentStep ? (
                        <p className="text-xs text-amber-600 font-medium">En attente de validation</p>
                      ) : (
                        <p className="text-xs text-gray-400">En attente</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation action */}
          {canValidate && (
            <div className="bg-white rounded-xl border-2 border-amber-300 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <h2 className="font-semibold text-gray-900">Action requise</h2>
              </div>
              <p className="text-sm text-gray-500">
                Cette facture attend votre validation en tant que <strong>{ROLE_LABELS[user.role]}</strong>.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Commentaire {invoice.status === 'pending_rose' || invoice.status === 'pending_owner' || invoice.status === 'pending_rajaa' ? '(optionnel pour approbation)' : ''}
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  placeholder="Ajouter un commentaire ou motif de rejet..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleValidate('rejected')}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 hover:bg-red-50 py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
                >
                  <XCircle size={18} />
                  Rejeter
                </button>
                <button
                  onClick={() => handleValidate('approved')}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
                >
                  <CheckCircle size={18} />
                  Approuver
                </button>
              </div>
            </div>
          )}

          {/* PDF edit history */}
          {pdfEdits.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between px-5 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 flex items-center gap-2">
                  <History size={16} />
                  Historique annotations PDF ({pdfEdits.length})
                </span>
                {showHistory ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {showHistory && (
                <div className="divide-y divide-gray-50">
                  {pdfEdits.map(edit => (
                    <div key={edit.id} className="px-5 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{edit.editor_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(edit.created_at).toLocaleDateString('fr-FR')} à{' '}
                            {new Date(edit.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button
                          onClick={() => setPdfUrl(`/api/invoices/${id}/pdf?edit_id=${edit.id}&t=${Date.now()}`)}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Afficher
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
