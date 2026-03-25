// Client-safe constants (no server imports)

export interface UserPayload {
  id: number;
  name: string;
  email: string;
  role: 'rose' | 'owner' | 'rajaa' | 'accountant';
}

export const ROLE_LABELS: Record<string, string> = {
  rose: 'Rose (Assistante)',
  owner: 'Directeur DI SOLAR',
  rajaa: 'Rajaa',
  accountant: 'Cabinet Comptable',
};

export const STATUS_LABELS: Record<string, string> = {
  pending_rose: 'En attente de Rose',
  pending_owner: 'En attente du Directeur',
  pending_rajaa: 'En attente de Rajaa',
  validated: 'Validée',
  rejected: 'Rejetée',
};

export const STATUS_COLORS: Record<string, string> = {
  pending_rose: 'bg-yellow-100 text-yellow-800',
  pending_owner: 'bg-blue-100 text-blue-800',
  pending_rajaa: 'bg-purple-100 text-purple-800',
  validated: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export const ROLE_TO_STEP: Record<string, string> = {
  rose: 'rose',
  owner: 'owner',
  rajaa: 'rajaa',
};

export const ROLE_TO_STATUS: Record<string, string> = {
  rose: 'pending_rose',
  owner: 'pending_owner',
  rajaa: 'pending_rajaa',
};

export const NEXT_STATUS: Record<string, string> = {
  rose: 'pending_owner',
  owner: 'pending_rajaa',
  rajaa: 'validated',
};
