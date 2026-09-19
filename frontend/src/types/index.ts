// ==== Users / Auth ====
export interface ResponseUser {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// ==== Companies ====
export interface CompanyResponse {
  id: number;
  company_name: string;
  company_description: string;
  created_at: string;
}

export interface CreateCompany {
  company_name: string;
  company_description: string;
}

export interface RenameCompany {
  company_name: string;
  company_description: string;
}

// ==== Filials ====
export interface FilialResponse {
  id: number;
  company_id: number;
  filial_name: string;
  filial_address: string | null;
  created_at: string;
}

export interface CreateFilial {
  company_id: number;
  filial_name: string;
  filial_address?: string;
}

export interface UpdateFilial {
  filial_name?: string | null;
  filial_address?: string | null;
}

// ==== Sources ====
export type SourcePlatform =
  | "yandex"
  | "2GIS"
  | "google_maps"
  | "wildberries"
  | "ozon"
  | "yandex_market"
  | "uzum";

export interface SourseResponse {
  id: number;
  filial_id: number;
  platform: string;
  platform_type: string;
  url: string | null;
  marketplace_shop_id_only: string | null;
  is_active: boolean;
  last_checked_at: string | null;
}

export interface CreateSource {
  filial_id: number;
  platform: SourcePlatform;
  url?: string | null;
  marketplace_shop_id_only?: string | null;
}

export interface UpdateSourse {
  url?: string | null;
  is_active?: boolean | null;
}

// ==== Credentials (marketplaces) ====
export type CredentialPlatform = "wildberries" | "ozon" | "yandex_market" | "uzum";

export interface CredentialResponse {
  id: number;
  company_id: number;
  platform: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateCredential {
  company_id: number;
  platform: CredentialPlatform;
  token: string;
  client_id?: string | null;
  campaign_id?: string | null;
  business_id?: string | null;
  shop_id?: string | null;
}

export interface UpdateCredential {
  token: string;
}

// ==== Reviews / Drafts ====
export interface DraftResponse {
  id: number;
  original_text: string;
  edited_text: string | null;
  status: string;
  tg_message_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewResponse {
  id: number;
  source_id: number;
  id_platform_review: string;
  author_name: string | null;
  rating: number;
  text_review: string | null;
  url_review: string | null;
  product_name: string | null;
  reviewed_at: string;
  created_at: string;
  is_notified: boolean;
  draft: DraftResponse | null;
}

export interface UpdateAIDraft {
  edited_text?: string | null;
  status?: "pending" | "approved" | "rejected" | null;
}

// ==== Errors ====
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}
