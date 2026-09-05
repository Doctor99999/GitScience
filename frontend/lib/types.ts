import type { TranslationDict } from "./translations";

export type { TranslationDict };

export type VampireSource = "all" | "openalex" | "arxiv" | "pubmed";

export interface ScholarProfile {
  orcid: string;
  name: string;
  institution?: string;
  discipline?: string;
  email?: string;
  access_token?: string;
  git_impact_score?: number;
  platform_tier?: string;
}

export interface PlatformStats {
  total_notarized_manuscripts: number;
  total_ledger_transactions: number;
  total_secured_scientific_value_usdt: number;
  total_court_arbitrations: number;
  blockchain_attestation_status: string;
}

export interface AstVerificationResult {
  status?: string;
  ast_merkle_digest?: string;
}

export interface AiAuditResult {
  dossier_id?: string;
  ai_composite_scores?: {
    composite_quality_index?: number;
    math_rigor_score?: number;
    methodology_score?: number;
    novelty_score?: number;
    bioethics_score?: number;
  };
}

export interface NotarySuccessResult {
  registration_code: string;
  sha256_hash?: string;
  git_commit_hash?: string;
}

export interface InspectedDoc {
  registration_code: string;
  title: string;
  author_name?: string;
  orcid?: string;
  category?: string;
  ipc_class?: string;
  license_type?: string;
  sha256_hash?: string;
  git_commit_hash?: string;
  ast_merkle_digest?: string;
  formula_math?: string;
}

export interface NotaryCertificateLayer {
  legal_layer?: {
    title?: string;
    primary_author?: string;
    orcid_id?: string;
    scientific_discipline?: string;
    wipo_ipc_class?: string;
    governing_license?: string;
  };
  cryptographic_layer?: {
    sha256_payload_hash?: string;
    git_commit_oid?: string;
  };
  executable_layer?: {
    ast_merkle_digest?: string;
    formula_source?: string;
  };
}

export interface IpNftResult {
  contract_standard?: string;
  founder_royalty_pct?: string;
}

export interface LibraryArticle {
  registration_code: string;
  title?: string;
  author_name?: string;
  orcid?: string;
  ipc_class?: string;
  license_type?: string;
  ipfs_cid?: string | null;
  source_archive?: string;
  download_url?: string;
}

export interface ZkCommitResult {
  commitment_id?: string;
  blind_commitment_hash?: string;
}

export interface ZkRevealResult {
  status?: string;
  is_authentic?: boolean;
}

export interface ReviewResult {
  review_id?: string;
  reviewer_reward_usdt?: number;
}

export interface FiatInvoiceResult {
  invoice_id?: string;
  hospital_name?: string;
  total_gross_invoice_fiat?: number;
}

export interface CourtCase {
  case_id: string;
  claimant_name: string;
  claimant_orcid: string;
  target_code: string;
  reason: string;
  evidence_hash?: string;
  status: string;
  votes_valid: number;
  votes_invalid: number;
  votes_abstain: number;
}

export interface VampireWork {
  source?: string;
  license?: string;
  title: string;
  authors?: string;
  author_name?: string;
  doi?: string;
}

export interface VampireDaemonStats {
  is_running?: boolean;
  total_harvested?: number;
  errors_count?: number;
  works_ingested?: number;
}