// Client-safe constants (no server imports)

export interface UserPayload {
  id: number;
  name: string;
  email: string;
  role: 'bureau' | 'poseur';
}

export const ROLE_LABELS: Record<string, string> = {
  bureau: 'Bureau',
  poseur: 'Poseur',
};

export const CHANTIER_STATUT_LABELS: Record<string, string> = {
  a_planifier: 'À planifier',
  planifie: 'Planifié',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
};

export const CHANTIER_STATUT_COLORS: Record<string, string> = {
  a_planifier: 'bg-gray-100 text-gray-800',
  planifie: 'bg-blue-100 text-blue-800',
  en_cours: 'bg-amber-100 text-amber-800',
  termine: 'bg-green-100 text-green-800',
  annule: 'bg-red-100 text-red-800',
};

export const INTERVENTION_TYPE_LABELS: Record<string, string> = {
  pose: 'Pose de centrale',
  maintenance: 'Maintenance',
  sav: 'SAV / Dépannage',
  autre: 'Autre',
};

export const INTERVENTION_TYPE_COLORS: Record<string, string> = {
  pose: 'bg-amber-100 text-amber-800',
  maintenance: 'bg-blue-100 text-blue-800',
  sav: 'bg-red-100 text-red-800',
  autre: 'bg-gray-100 text-gray-800',
};

export const INTERVENTION_STATUT_LABELS: Record<string, string> = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

export const INTERVENTION_STATUT_COLORS: Record<string, string> = {
  planifiee: 'bg-blue-100 text-blue-800',
  en_cours: 'bg-amber-100 text-amber-800',
  terminee: 'bg-green-100 text-green-800',
  annulee: 'bg-red-100 text-red-800',
};
