export type Role = 'bureau' | 'poseur';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export type ChantierStatut = 'a_planifier' | 'planifie' | 'en_cours' | 'termine' | 'annule';

export interface Chantier {
  id: number;
  nom: string;
  client_nom: string;
  client_telephone: string | null;
  client_email: string | null;
  adresse: string;
  puissance_kwc: number | null;
  nb_panneaux: number | null;
  puissance_panneau_wc: number | null;
  nb_onduleurs: number | null;
  puissance_onduleur_kw: number | null;
  ca_ht_prevu: number | null;
  facture: boolean;
  statut: ChantierStatut;
  notes: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export type InterventionType = 'pose' | 'maintenance' | 'sav' | 'autre';
export type InterventionStatut = 'planifiee' | 'en_cours' | 'terminee' | 'annulee';

export interface Intervention {
  id: number;
  chantier_id: number;
  chantier_nom: string;
  chantier_adresse: string;
  type: InterventionType;
  titre: string;
  date_debut: string;
  date_fin: string | null;
  poseur_id: number | null;
  poseur_nom: string | null;
  statut: InterventionStatut;
  ca_ht_prevu: number | null;
  facture: boolean;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface RapportPhoto {
  id: number;
  rapport_id: number;
  data: string;
  legende: string | null;
  created_at: string;
}

export interface Rapport {
  id: number;
  intervention_id: number;
  auteur_id: number;
  auteur_nom: string;
  contenu: string;
  created_at: string;
  photos: RapportPhoto[];
}

export interface ReceptionPhoto {
  id: number;
  reception_id: number;
  data: string;
  legende: string | null;
  created_at: string;
}

export interface Reception {
  id: number;
  chantier_id: number;
  chantier_nom: string;
  intervention_id: number | null;
  date: string;
  poseur_id: number | null;
  poseur_nom: string;
  poseur_signature: string;
  client_nom: string;
  client_signature: string;
  commentaires: string | null;
  created_at: string;
  photos: ReceptionPhoto[];
}
