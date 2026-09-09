"""
GitScience Editorial Workflow Engine
Peer Review, DOI Minting, JATS XML, Decision Letters

Canonical consensus: 55/15/30 bps (5500/1500/3000), B2B Tax Gross-Up +20%
Standards: WIPO Prior Art (35 U.S.C. §102), ISO 14721 OAIS, RFC 3161 + OTS
"""

import json
import hashlib
import time
import uuid
import os
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Literal
from dataclasses import dataclass, asdict, field

# =====================================================================
# 1. EDITORIAL ROLES & RBAC
# =====================================================================

EditorialRole = Literal[
    "author",           # Податель статьи
    "reviewer",         # Рецензент
    "section_editor",   # Редактор секции
    "editor_in_chief",  # Главный редактор
    "production",       # Производственный редактор
    "platform_admin",   # Администратор платформы
]

SUBMISSION_STATUS = Literal[
    "draft",                # Черновик
    "submitted",            # Подана
    "editorial_check",      # Проверка редактором
    "under_review",         # На рецензии
    "revision_requested",   # Запрошены правки
    "revised",              # Правки внесены
    "accepted",             # Принята
    "rejected",             # Отклонена
    "in_production",        # В производстве
    "published",            # Опубликована
    "withdrawn",            # Отозвана
]

REVIEW_RECOMMENDATION = Literal[
    "strong_accept",
    "accept",
    "minor_revision",
    "major_revision",
    "reject",
    "strong_reject",
]


@dataclass
class EditorialUser:
    """Пользователь с editorial ролью"""
    user_id: str
    orcid: str
    name: str
    email: str
    roles: List[EditorialRole]
    expertise_areas: List[str] = field(default_factory=list)
    institution: str = ""
    h_index: int = 0
    total_reviews: int = 0
    avg_review_time_days: float = 0.0
    conflicts: List[str] = field(default_factory=list)  # user_ids конфликтов
    is_active: bool = True
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def has_role(self, role: EditorialRole) -> bool:
        return role in self.roles

    def can_assign_reviewer(self) -> bool:
        return self.has_role("section_editor") or self.has_role("editor_in_chief")

    def can_make_decision(self) -> bool:
        return self.has_role("editor_in_chief")

    def can_submit(self) -> bool:
        return self.has_role("author")


@dataclass
class Submission:
    """Поданная рукопись"""
    submission_id: str
    title: str
    abstract: str
    authors: List[Dict[str, str]]  # [{orcid, name, affiliation, role}]
    corresponding_author_orcid: str
    category: str  # IPC class / scientific field
    keywords: List[str] = field(default_factory=list)
    
    # Files
    manuscript_file_path: str = ""
    supplementary_files: List[str] = field(default_factory=list)
    
    # Status tracking
    status: str = "draft"
    current_version: int = 1
    submission_history: List[Dict[str, Any]] = field(default_factory=list)
    
    # Editorial assignment
    assigned_editor: Optional[str] = None
    assigned_reviewers: List[str] = field(default_factory=list)
    
    # Review tracking
    reviews: List[Dict[str, Any]] = field(default_factory=list)
    decision: Optional[str] = None
    decision_letter: Optional[str] = None
    
    # DOI & identifiers
    doi: Optional[str] = None
    preprint_doi: Optional[str] = None
    manuscript_code: Optional[str] = None  # GitScience registration code
    
    # Timestamps
    submitted_at: Optional[str] = None
    last_updated: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    published_at: Optional[str] = None
    
    # Metadata
    funding_statement: str = ""
    data_availability: str = ""
    conflict_of_interest: str = ""
    ethical_approval: str = ""
    author_contribution: str = ""
    
    # Blockchain anchoring
    git_commit_hash: Optional[str] = None
    ots_timestamp: Optional[str] = None
    ipfs_cid: Optional[str] = None


@dataclass
class PeerReview:
    """Рецензия"""
    review_id: str
    submission_id: str
    reviewer_orcid: str
    
    # Review content
    recommendation: str  # REVIEW_RECOMMENDATION
    confidence_level: int  # 1-5
    summary: str
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    detailed_comments: str = ""
    minor_comments: str = ""
    
    # Scoring
    scores: Dict[str, int] = field(default_factory=dict)
    # {methodology: 1-10, originality: 1-10, clarity: 1-10, significance: 1-10}
    
    # Metadata
    status: str = "invited"  # invited, accepted, completed, declined
    invited_at: Optional[str] = None
    accepted_at: Optional[str] = None
    completed_at: Optional[str] = None
    deadline: Optional[str] = None
    
    # Confidential
    is_blinded: bool = True  # Double-blind by default
    
    # Blockchain
    review_hash: Optional[str] = None
    ots_timestamp: Optional[str] = None


@dataclass
class EditorialDecision:
    """Решение редактора"""
    decision_id: str
    submission_id: str
    editor_orcid: str
    
    decision: str  # accept, reject, revise, minor_revision, major_revision
    rationale: str
    editorial_comments: str
    
    # Required revisions
    required_changes: List[str] = field(default_factory=list)
    revision_deadline_days: int = 30
    
    # Timestamps
    decided_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    
    # Next steps
    requires_revision: bool = False
    revision_number: int = 1


# =====================================================================
# 2. DOI MINTING (CrossRef API)
# =====================================================================

class DOIMintingService:
    """Регистрация DOI через CrossRef API"""
    
    CROSSREF_API_URL = "https://api.crossref.org"
    CROSSREF_DEPOSIT_URL = "https://doi.crossref.org/deposit"
    
    # GitScience prefix (получен при регистрации)
    DOI_PREFIX = "10.69624"  # Пример prefix
    
    def __init__(self, api_key: Optional[str] = None, member_id: Optional[str] = None):
        self.api_key = api_key
        self.member_id = member_id
    
    def generate_doi(self, submission_id: str, version: int = 1) -> str:
        """Генерация DOI для manuscipt"""
        return f"{self.DOI_PREFIX}/gitscience.{submission_id}.v{version}"
    
    def build_crossref_metadata(self, submission: Submission) -> Dict[str, Any]:
        """Формирование CrossRef metadata для депозита"""
        doi = self.generate_doi(submission.submission_id, submission.current_version)
        
        metadata = {
            "criteria": {
                "crossmark": True,
                "registration_agency": "crossref"
            },
            "timestamp": int(time.time() * 1000),
            "publisher": "GitScience Scuderia Protocol",
            "editor": [],
            "author": [],
            "title": submission.title,
            "original_title": submission.title,
            "type": "journal-article",
            "language": "en",
            "DOI": doi,
            "key": [submission.submission_id],
            "container_title": ["GitScience Open Repository"],
            "issn": ["2949-0000"],
            "group_title": ["Decentralized Science"],
            "resource": {
                "primary": {
                    "type": "text/html",
                    "URL": f"https://gitscience.org/manuscript/{submission.submission_code or submission.submission_id}"
                }
            },
            "link": [
                {
                    "URL": f"https://gitscience.org/api/v1/manuscript/export/pdf/{submission.submission_code}",
                    "content-type": "application/pdf",
                    "content-version": "vor",
                    "intended-application": "text-mining"
                },
                {
                    "URL": f"https://gitscience.org/manuscript/{submission.submission_code}",
                    "content-type": "text/html",
                    "content-version": "vor",
                    "intended-application": "syndication"
                }
            ],
            "date": [
                {
                    "date-parts": [[datetime.now(timezone.utc).year, datetime.now(timezone.utc).month, datetime.now(timezone.utc).day]],
                    "date-time": datetime.now(timezone.utc).isoformat(),
                    "timestamp": int(time.time() * 1000),
                    "quality": "submitted"
                }
            ],
            "subject": submission.keywords[:5] if submission.keywords else [submission.category],
            "abstract": submission.abstract[:5000] if submission.abstract else "",
            "license": [
                {
                    "URL": "https://creativecommons.org/licenses/by/4.0/",
                    "content-version": "vor",
                    "delay-in-days": 0,
                    "start": {
                        "date-parts": [[datetime.now(timezone.utc).year, datetime.now(timezone.utc).month, datetime.now(timezone.utc).day]],
                        "date-time": datetime.now(timezone.utc).isoformat(),
                        "timestamp": int(time.time() * 1000)
                    }
                }
            ],
            "funder": self._extract_funders(submission.funding_statement),
            "assertion": [
                {
                    "group": {
                        "label": "Ethics",
                        "name": "ethics"
                    },
                    "label": "Ethical Approval",
                    "name": "ethics_approval",
                    "value": submission.ethical_approval or "Not specified"
                },
                {
                    "group": {
                        "label": "Data",
                        "name": "data"
                    },
                    "label": "Data Availability",
                    "name": "data_availability",
                    "value": submission.data_availability or "Data available upon request"
                }
            ]
        }
        
        # Authors
        for author in submission.authors:
            author_meta = {
                "given": author.get("name", "").split()[-1] if author.get("name") else "",
                "family": author.get("name", "").split()[0] if author.get("name") else "",
                "name": author.get("name", ""),
                "affiliation": [{"name": author.get("institution", "")}],
                "ORCID": author.get("orcid", ""),
                "sequence": "first" if author.get("orcid") == submission.corresponding_author_orcid else "additional"
            }
            metadata["author"].append(author_meta)
        
        return metadata
    
    def _extract_funders(self, funding_statement: str) -> List[Dict[str, Any]]:
        """Извлечение информации о грантодателях"""
        if not funding_statement:
            return []
        return [{
            "name": funding_statement[:200],
            "award": []
        }]
    
    def prepare_deposit(self, submission: Submission) -> Dict[str, Any]:
        """Подготовка депозита для CrossRef"""
        metadata = self.build_crossref_metadata(submission)
        
        return {
            "batch_id": str(uuid.uuid4()),
            "status": "unknown",
            "submitter": {
                "email": "deposit@gitscience.org",
                "name": "GitScience Auto-Deposit"
            },
            "deposit": {
                "doi_data": {
                    "doi": metadata["DOI"],
                    "key": metadata["key"],
                    "resource": metadata["resource"]
                },
                "journal_article": metadata
            }
        }


# =====================================================================
# 3. JATS XML EXPORT
# =====================================================================

class JATSXMLExporter:
    """Экспорт в JATS XML (PubMed, DOAJ, Scopus совместимый)"""
    
    def export_submission(self, submission: Submission, doi: str) -> str:
        """Генерация JATS XML для submission"""
        now = datetime.now(timezone.utc)
        
        authors_xml = ""
        for i, author in enumerate(submission.authors):
            orcid_attr = f' orcid="{author.get("orcid", "")}"' if author.get("orcid") else ""
            aff_id = f' aff{i+1}'
            authors_xml += f"""
    <contrib contrib-type="author"{orcid_attr}>
      <name>
        <surname>{author.get('name', '').split()[0] if author.get('name') else ''}</surname>
        <given-names>{author.get('name', '').split()[-1] if author.get('name') else ''}</given-names>
      </name>
      <xref ref-type="aff" rid="aff{i+1}"/>
    </contrib>"""
        
        affiliations_xml = ""
        for i, author in enumerate(submission.authors):
            if author.get("institution"):
                affiliations_xml += f"""
    <aff id="aff{i+1}">
      <label>{i+1}</label>
      <institution>{author['institution']}</institution>
    </aff>"""
        
        keywords_xml = ""
        for kw in submission.keywords[:10]:
            keywords_xml += f'\n      <kwd>{kw}</kwd>'
        
        article_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.2 20190208//EN" "JATS-archivearticle1-mathml3.dtd">
<article article-type="research-article" xml:lang="en">
  <front>
    <journal-meta>
      <journal-id journal-id-type="nlm-ta">GitSci Open Repos</journal-id>
      <journal-title-group>
        <journal-title>GitScience Open Repository</journal-title>
      </journal-title-group>
      <issn pub-type="epub">2949-0000</issn>
      <publisher>
        <publisher-name>GitScience Scuderia Protocol</publisher-name>
      </publisher>
    </journal-meta>
    <article-meta>
      <article-id pub-id-type="doi">{doi}</article-id>
      <article-categories>
        <subj-group subj-group-type="heading">
          <subject>{submission.category}</subject>
        </subj-group>
      </article-categories>
      <title-group>
        <article-title>{self._escape_xml(submission.title)}</article-title>
      </title-group>
      <contrib-group>{authors_xml}
      </contrib-group>{affiliations_xml}
      <abstract>
        <p>{self._escape_xml(submission.abstract)}</p>
      </abstract>
      <kwd-group>{keywords_xml}
      </kwd-group>
      <pub-date pub-type="epub">
        <day>{now.day:02d}</day>
        <month>{now.month:02d}</month>
        <year>{now.year}</year>
      </pub-date>
      <volume>1</volume>
      <issue>1</issue>
      <fpage>1</fpage>
      <lpage>10</lpage>
      <history>
        <date date-type="received">
          <day>{now.day:02d}</day>
          <month>{now.month:02d}</month>
          <year>{now.year}</year>
        </date>
      </history>
      <permissions>
        <copyright-statement>Copyright (c) {now.year} GitScience Scuderia Protocol</copyright-statement>
        <copyright-year>{now.year}</copyright-year>
        <license license-type="open-access" href="https://creativecommons.org/licenses/by/4.0/">
          <license-p>This is an open access article distributed under the terms of the Creative Commons Attribution License (CC BY 4.0).</license-p>
        </license>
      </permissions>
      <self-contributions>
        <contribution contrib-type="author">
          <role>data-curation</role>
        </contribution>
      </self-contributions>
    </article-meta>
  </front>
  <body>
    <sec>
      <title>Manuscript Content</title>
      <p>[Full text available at <ext-link ext-link-type="uri" href="https://gitscience.org/manuscript/{submission.submission_code or submission.submission_id}">GitScience Repository</ext-link>]</p>
    </sec>
  </body>
  <back>
    <notes-group>
      <notes note-type="data-availability">
        <title>Data Availability Statement</title>
        <p>{self._escape_xml(submission.data_availability) if submission.data_availability else 'Data available upon reasonable request.'}</p>
      </notes>
    </notes-group>
  </back>
</article>"""
        
        return article_xml
    
    def _escape_xml(self, text: str) -> str:
        """Экранирование XML special characters"""
        if not text:
            return ""
        return (text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace('"', "&quot;")
                .replace("'", "&apos;"))


# =====================================================================
# 4. DECISION LETTER TEMPLATES
# =====================================================================

class DecisionLetterGenerator:
    """Генерация писем с решением"""
    
    TEMPLATES = {
        "accept": """Subject: Decision on Manuscript {manuscript_code} — ACCEPTED

Dear {author_name},

We are pleased to inform you that your manuscript "{title}" has been accepted for publication in GitScience Open Repository.

Your manuscript has been assigned DOI: {doi}

Next Steps:
1. Your manuscript will enter the production phase
2. You will receive proofs for review within 5-7 business days
3. Final publication will be announced via ORCID and blockchain attestation

All blockchain anchors (Bitcoin OTS, Git commit) have been verified and are immutable.

Best regards,
{editor_name}
Editor-in-Chief, GitScience Open Repository
{timestamp}""",

        "minor_revision": """Subject: Decision on Manuscript {manuscript_code} — MINOR REVISION REQUIRED

Dear {author_name},

Thank you for submitting your manuscript "{title}" to GitScience Open Repository.

After peer review, we have determined that your manuscript requires minor revisions before acceptance. Please address the following points:

{required_changes}

Please submit your revised manuscript within {deadline_days} days. Include a point-by-point response to the reviewers' comments.

{editorial_comments}

Best regards,
{editor_name}
Editor-in-Chief, GitScience Open Repository
{timestamp}""",

        "major_revision": """Subject: Decision on Manuscript {manuscript_code} — MAJOR REVISION REQUIRED

Dear {author_name},

Thank you for submitting your manuscript "{title}" to GitScience Open Repository.

After careful peer review, we have determined that your manuscript requires major revisions. The reviewers have identified significant concerns that must be addressed:

{required_changes}

Please submit your revised manuscript within {deadline_days} days. We strongly recommend addressing all reviewer comments in detail.

{editorial_comments}

Best regards,
{editor_name}
Editor-in-Chief, GitScience Open Repository
{timestamp}""",

        "reject": """Subject: Decision on Manuscript {manuscript_code} — NOT ACCEPTED

Dear {author_name},

Thank you for submitting your manuscript "{title}" to GitScience Open Repository.

After peer review, we regret to inform you that your manuscript cannot be accepted for publication in its current form.

{rationale}

{editorial_comments}

We encourage you to address the reviewers' feedback and consider submitting a substantially revised version as a new submission.

Your blockchain-anchored timestamp (OTS) remains valid as proof of priority under 35 U.S.C. §102.

Best regards,
{editor_name}
Editor-in-Chief, GitScience Open Repository
{timestamp}""",
    }
    
    def generate(
        self,
        decision: str,
        submission: Submission,
        editor_name: str,
        required_changes: List[str] = None,
        editorial_comments: str = "",
        rationale: str = "",
        deadline_days: int = 30,
    ) -> str:
        template = self.TEMPLATES.get(decision, self.TEMPLATES["reject"])
        
        return template.format(
            manuscript_code=submission.submission_code or submission.submission_id,
            title=submission.title,
            author_name=submission.authors[0].get("name", "Author") if submission.authors else "Author",
            doi=submission.doi or "Pending",
            editor_name=editor_name,
            timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            required_changes="\n".join(f"  {i+1}. {c}" for i, c in enumerate(required_changes or [])),
            editorial_comments=editorial_comments,
            rationale=rationale,
            deadline_days=deadline_days,
        )


# =====================================================================
# 5. REVIEWER MATCHING (AI-Enhanced)
# =====================================================================

class ReviewerMatcher:
    """Умный подбор рецензентов"""
    
    def __init__(self, users_db: List[EditorialUser]):
        self.users = {u.user_id: u for u in users_db}
    
    def find_reviewers(
        self,
        submission: Submission,
        exclude_orcids: List[str] = None,
        n_reviewers: int = 3,
    ) -> List[Dict[str, Any]]:
        """Поиск подходящих рецензентов по expertise + availability + reputation"""
        exclude = set(exclude_orcids or [])
        exclude.add(submission.corresponding_author_orcid)
        
        # Also exclude all authors of the submission
        for author in submission.authors:
            exclude.add(author.get("orcid", ""))
        
        candidates = []
        submission_keywords = set(kw.lower() for kw in submission.keywords)
        submission_category = submission.category.lower()
        
        for uid, user in self.users.items():
            # Must be a reviewer
            if not user.has_role("reviewer"):
                continue
            
            # Must not be conflicted
            if user.orcid in exclude:
                continue
            
            if any(a.get("orcid") in user.conflicts for a in submission.authors):
                continue
            
            # Calculate expertise score
            expertise_score = self._calculate_expertise_score(
                user, submission_keywords, submission_category
            )
            
            if expertise_score < 0.2:
                continue
            
            # Calculate availability score (fewer active reviews = more available)
            availability_score = max(0, 1.0 - (user.total_reviews * 0.1))
            
            # Calculate reputation score
            reputation_score = min(1.0, user.h_index / 50) if user.h_index > 0 else 0.3
            
            # Composite score
            composite = (
                expertise_score * 0.5 +
                availability_score * 0.25 +
                reputation_score * 0.25
            )
            
            candidates.append({
                "user_id": uid,
                "orcid": user.orcid,
                "name": user.name,
                "institution": user.institution,
                "h_index": user.h_index,
                "expertise_areas": user.expertise_areas,
                "total_reviews": user.total_reviews,
                "avg_review_time_days": user.avg_review_time_days,
                "expertise_score": round(expertise_score, 3),
                "availability_score": round(availability_score, 3),
                "reputation_score": round(reputation_score, 3),
                "composite_score": round(composite, 3),
            })
        
        # Sort by composite score descending
        candidates.sort(key=lambda x: x["composite_score"], reverse=True)
        
        return candidates[:n_reviewers]
    
    def _calculate_expertise_score(
        self,
        user: EditorialUser,
        submission_keywords: set,
        submission_category: str,
    ) -> float:
        """Расчёт соответствия экспертизы"""
        if not user.expertise_areas:
            return 0.3  # Default for users without declared expertise
        
        user_expertise = set(e.lower() for e in user.expertise_areas)
        
        # Direct category match
        category_match = 1.0 if submission_category in user_expertise else 0.0
        
        # Keyword overlap
        if submission_keywords and user_expertise:
            overlap = len(submission_keywords & user_expertise)
            keyword_score = min(1.0, overlap / max(1, len(submission_keywords) * 0.3))
        else:
            keyword_score = 0.0
        
        return max(category_match, keyword_score)


# =====================================================================
# 6. POST-PUBLICATION REVIEW
# =====================================================================

@dataclass
class PostPubReview:
    """Публичный комментарий после публикации"""
    comment_id: str
    submission_id: str
    author_orcid: str
    content: str
    comment_type: str  # "comment", "correction", "replication", "critique"
    parent_comment_id: Optional[str] = None  # Для ответов
    
    # Scoring
    upvotes: int = 0
    downvotes: int = 0
    
    # Blockchain
    comment_hash: Optional[str] = None
    ots_timestamp: Optional[str] = None
    
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# =====================================================================
# 7. DATA AVAILABILITY STATEMENT
# =====================================================================

@dataclass
class DataAvailabilityStatement:
    """Заявление о доступности данных"""
    statement_id: str
    submission_id: str
    
    # Statement type
    statement_type: str  # "available_on_request", "public_repository", "supplementary", "not_applicable"
    
    # Details
    repository_name: str = ""
    repository_url: str = ""
    dataset_doi: str = ""
    license: str = ""
    
    # FAIR compliance
    fair_score: Optional[float] = None  # 0-1
    findable: bool = False
    accessible: bool = False
    interoperable: bool = False
    reusable: bool = False
    
    # Blockchain attestation
    statement_hash: Optional[str] = None


# =====================================================================
# 8. REPRODUCIBILITY BADGE
# =====================================================================

@dataclass
class ReproducibilityBadge:
    """Бейдж воспроизводимости"""
    badge_id: str
    submission_id: str
    
    # Verification status
    status: str = "pending"  # pending, verified, failed, partial
    
    # Verification details
    code_available: bool = False
    data_available: bool = False
    environment_specified: bool = False
    results_replicated: bool = False
    
    # Verification
    verified_by: Optional[str] = None  # user_id
    verification_method: str = ""  # "automated", "manual", "community"
    
    # Scoring
    reproducibility_score: float = 0.0  # 0-100
    
    # Blockchain
    badge_hash: Optional[str] = None
    ots_timestamp: Optional[str] = None
    
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# =====================================================================
# 9. MAIN EDITORIAL ENGINE
# =====================================================================

class EditorialEngine:
    """Главный движок editorial workflow"""
    
    def __init__(self, storage_dir: Optional[str] = None):
        self.submissions: Dict[str, Submission] = {}
        self.reviews: Dict[str, PeerReview] = {}
        self.users: Dict[str, EditorialUser] = {}
        self.decisions: Dict[str, EditorialDecision] = {}
        self.post_pub_reviews: Dict[str, PostPubReview] = {}
        self.data_statements: Dict[str, DataAvailabilityStatement] = {}
        self.reproducibility_badges: Dict[str, ReproducibilityBadge] = {}
        
        self.doi_service = DOIMintingService()
        self.jats_exporter = JATSXMLExporter()
        self.letter_generator = DecisionLetterGenerator()
        self.reviewer_matcher = ReviewerMatcher([])
        
        # Persistence
        self._storage_dir = storage_dir or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "gitscience_data", "editorial"
        )
        self._storage_file = os.path.join(self._storage_dir, "editorial_state.json")
        self._ensure_storage_dir()
        self._load_state()
    
    def _ensure_storage_dir(self):
        """Создание директории для хранения"""
        os.makedirs(self._storage_dir, exist_ok=True)
    
    def _save_state(self):
        """Сохранение состояния в JSON файл"""
        state = {
            "submissions": {
                k: asdict(v) for k, v in self.submissions.items()
            },
            "reviews": {
                k: asdict(v) for k, v in self.reviews.items()
            },
            "users": {
                k: asdict(v) for k, v in self.users.items()
            },
            "decisions": {
                k: asdict(v) for k, v in self.decisions.items()
            },
            "post_pub_reviews": {
                k: asdict(v) for k, v in self.post_pub_reviews.items()
            },
            "data_statements": {
                k: asdict(v) for k, v in self.data_statements.items()
            },
            "reproducibility_badges": {
                k: asdict(v) for k, v in self.reproducibility_badges.items()
            },
            "saved_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            with open(self._storage_file, "w", encoding="utf-8") as f:
                json.dump(state, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[EditorialEngine] Warning: failed to save state: {e}")
    
    def _load_state(self):
        """Загрузка состояния из JSON файла"""
        if not os.path.exists(self._storage_file):
            return
        
        try:
            with open(self._storage_file, "r", encoding="utf-8") as f:
                state = json.load(f)
            
            for k, v in state.get("submissions", {}).items():
                self.submissions[k] = Submission(**v)
            
            for k, v in state.get("reviews", {}).items():
                self.reviews[k] = PeerReview(**v)
            
            for k, v in state.get("users", {}).items():
                self.users[k] = EditorialUser(**v)
            
            for k, v in state.get("decisions", {}).items():
                self.decisions[k] = EditorialDecision(**v)
            
            for k, v in state.get("post_pub_reviews", {}).items():
                self.post_pub_reviews[k] = PostPubReview(**v)
            
            for k, v in state.get("data_statements", {}).items():
                self.data_statements[k] = DataAvailabilityStatement(**v)
            
            for k, v in state.get("reproducibility_badges", {}).items():
                self.reproducibility_badges[k] = ReproducibilityBadge(**v)
            
            self.reviewer_matcher = ReviewerMatcher(list(self.users.values()))
            
            print(f"[EditorialEngine] Loaded {len(self.submissions)} submissions, "
                  f"{len(self.reviews)} reviews, {len(self.users)} users from disk")
        except Exception as e:
            print(f"[EditorialEngine] Warning: failed to load state: {e}")
    
    def register_user(self, user: EditorialUser) -> Dict[str, Any]:
        """Регистрация пользователя с editorial ролью"""
        self.users[user.user_id] = user
        self.reviewer_matcher = ReviewerMatcher(list(self.users.values()))
        self._save_state()
        return {"status": "ok", "user_id": user.user_id, "roles": user.roles}
    
    def submit_manuscript(self, submission: Submission) -> Dict[str, Any]:
        """Подача рукописи"""
        submission.submission_id = submission.submission_id or str(uuid.uuid4())
        submission.status = "submitted"
        submission.submitted_at = datetime.now(timezone.utc).isoformat()
        submission.submission_history.append({
            "action": "submitted",
            "timestamp": submission.submitted_at,
            "by": submission.corresponding_author_orcid,
        })
        
        self.submissions[submission.submission_id] = submission
        self._save_state()
        
        return {
            "status": "ok",
            "submission_id": submission.submission_id,
            "submitted_at": submission.submitted_at,
            "message": "Manuscript submitted successfully"
        }
    
    def assign_editor(self, submission_id: str, editor_id: str) -> Dict[str, Any]:
        """Назначение редактора секции"""
        submission = self.submissions.get(submission_id)
        if not submission:
            return {"status": "error", "message": "Submission not found"}
        
        editor = self.users.get(editor_id)
        if not editor or not editor.can_assign_reviewer():
            return {"status": "error", "message": "User cannot assign editors"}
        
        submission.assigned_editor = editor_id
        submission.status = "editorial_check"
        submission.submission_history.append({
            "action": "editor_assigned",
            "editor": editor_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        
        self._save_state()
        return {"status": "ok", "assigned_editor": editor_id}
    
    def find_reviewers(self, submission_id: str, n: int = 3) -> List[Dict[str, Any]]:
        """Поиск подходящих рецензентов"""
        submission = self.submissions.get(submission_id)
        if not submission:
            return []
        
        exclude = [r.get("reviewer_orcid") for r in submission.reviews]
        return self.reviewer_matcher.find_reviewers(submission, exclude, n)
    
    def assign_reviewers(self, submission_id: str, reviewer_orcids: List[str]) -> Dict[str, Any]:
        """Назначение рецензентов"""
        submission = self.submissions.get(submission_id)
        if not submission:
            return {"status": "error", "message": "Submission not found"}
        
        submission.assigned_reviewers = reviewer_orcids
        submission.status = "under_review"
        
        # Create review invitations
        created_reviews = []
        for orcid in reviewer_orcids:
            review = PeerReview(
                review_id=str(uuid.uuid4()),
                submission_id=submission_id,
                reviewer_orcid=orcid,
                recommendation="",
                confidence_level=3,
                summary="",
                status="invited",
                invited_at=datetime.now(timezone.utc).isoformat(),
                deadline=(datetime.now(timezone.utc) + timedelta(days=21)).isoformat(),
            )
            self.reviews[review.review_id] = review
            created_reviews.append(review.review_id)
        
        submission.submission_history.append({
            "action": "reviewers_assigned",
            "reviewers": reviewer_orcids,
            "review_ids": created_reviews,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        
        self._save_state()
        return {"status": "ok", "review_ids": created_reviews}
    
    def submit_review(self, review_id: str, review: PeerReview) -> Dict[str, Any]:
        """Подача рецензии"""
        existing = self.reviews.get(review_id)
        if not existing:
            return {"status": "error", "message": "Review not found"}
        
        review.review_id = review_id
        review.status = "completed"
        review.completed_at = datetime.now(timezone.utc).isoformat()
        
        # Calculate review hash for blockchain
        review_text = json.dumps({
            "submission_id": review.submission_id,
            "recommendation": review.recommendation,
            "summary": review.summary,
            "scores": review.scores,
        }, sort_keys=True)
        review.review_hash = hashlib.sha256(review_text.encode()).hexdigest()
        
        self.reviews[review_id] = review
        
        # Update submission
        submission = self.submissions.get(review.submission_id)
        if submission:
            submission.reviews.append({
                "review_id": review_id,
                "reviewer_orcid": review.reviewer_orcid,
                "recommendation": review.recommendation,
                "completed_at": review.completed_at,
            })
            
            # Check if all reviews are in
            all_reviews = [r for r in self.reviews.values() 
                          if r.submission_id == review.submission_id and r.status == "completed"]
            
            if len(all_reviews) >= len(submission.assigned_reviewers):
                submission.submission_history.append({
                    "action": "all_reviews_completed",
                    "review_count": len(all_reviews),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
        
        self._save_state()
        return {"status": "ok", "review_id": review_id, "hash": review.review_hash}
    
    def make_decision(
        self,
        submission_id: str,
        editor_orcid: str,
        decision: str,
        rationale: str = "",
        editorial_comments: str = "",
        required_changes: List[str] = None,
        deadline_days: int = 30,
    ) -> Dict[str, Any]:
        """Принятие решения по manuscript"""
        submission = self.submissions.get(submission_id)
        if not submission:
            return {"status": "error", "message": "Submission not found"}
        
        editor = None
        for u in self.users.values():
            if u.orcid == editor_orcid and u.can_make_decision():
                editor = u
                break
        
        if not editor:
            return {"status": "error", "message": "Editor not authorized"}
        
        # Create decision
        ed_decision = EditorialDecision(
            decision_id=str(uuid.uuid4()),
            submission_id=submission_id,
            editor_orcid=editor_orcid,
            decision=decision,
            rationale=rationale,
            editorial_comments=editorial_comments,
            required_changes=required_changes or [],
            revision_deadline_days=deadline_days,
            requires_revision=decision in ("minor_revision", "major_revision"),
        )
        
        self.decisions[ed_decision.decision_id] = ed_decision
        
        # Update submission
        submission.decision = decision
        submission.decision_letter = self.letter_generator.generate(
            decision=decision,
            submission=submission,
            editor_name=editor.name,
            required_changes=required_changes,
            editorial_comments=editorial_comments,
            rationale=rationale,
            deadline_days=deadline_days,
        )
        
        if decision == "accepted":
            submission.status = "accepted"
            submission.published_at = datetime.now(timezone.utc).isoformat()
            # Mint DOI
            submission.doi = self.doi_service.generate_doi(submission.submission_id)
        elif decision in ("minor_revision", "major_revision"):
            submission.status = "revision_requested"
            submission.current_version += 1
        elif decision == "reject":
            submission.status = "rejected"
        
        submission.submission_history.append({
            "action": "decision_made",
            "decision": decision,
            "editor": editor_orcid,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        
        self._save_state()
        return {
            "status": "ok",
            "decision_id": ed_decision.decision_id,
            "decision": decision,
            "doi": submission.doi,
            "letter": submission.decision_letter,
        }
    
    def get_submission_details(self, submission_id: str) -> Optional[Dict[str, Any]]:
        """Получение деталей submission"""
        submission = self.submissions.get(submission_id)
        if not submission:
            return None
        
        details = asdict(submission)
        details["reviews_detail"] = []
        for review_id, review in self.reviews.items():
            if review.submission_id == submission_id:
                details["reviews_detail"].append(asdict(review))
        
        return details
    
    def get_user_dashboard(self, user_orcid: str) -> Dict[str, Any]:
        """Дашборд пользователя"""
        user_submissions = []
        user_reviews = []
        
        for sub in self.submissions.values():
            for author in sub.authors:
                if author.get("orcid") == user_orcid:
                    user_submissions.append({
                        "submission_id": sub.submission_id,
                        "title": sub.title,
                        "status": sub.status,
                        "submitted_at": sub.submitted_at,
                        "decision": sub.decision,
                        "doi": sub.doi,
                    })
                    break
        
        for review in self.reviews.values():
            if review.reviewer_orcid == user_orcid:
                sub = self.submissions.get(review.submission_id)
                user_reviews.append({
                    "review_id": review.review_id,
                    "submission_id": review.submission_id,
                    "title": sub.title if sub else "Unknown",
                    "status": review.status,
                    "deadline": review.deadline,
                    "recommendation": review.recommendation,
                })
        
        return {
            "orcid": user_orcid,
            "submissions": user_submissions,
            "reviews": user_reviews,
            "stats": {
                "total_submissions": len(user_submissions),
                "published": len([s for s in user_submissions if s["status"] == "published"]),
                "under_review": len([s for s in user_submissions if s["status"] == "under_review"]),
                "pending_reviews": len([r for r in user_reviews if r["status"] in ("invited", "accepted")]),
                "completed_reviews": len([r for r in user_reviews if r["status"] == "completed"]),
            }
        }
    
    def add_post_pub_comment(
        self,
        submission_id: str,
        author_orcid: str,
        content: str,
        comment_type: str = "comment",
        parent_comment_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Добавление публичного комментария"""
        submission = self.submissions.get(submission_id)
        if not submission or submission.status != "published":
            return {"status": "error", "message": "Manuscript not published"}
        
        comment = PostPubReview(
            comment_id=str(uuid.uuid4()),
            submission_id=submission_id,
            author_orcid=author_orcid,
            content=content,
            comment_type=comment_type,
            parent_comment_id=parent_comment_id,
        )
        
        # Hash for blockchain
        comment_text = json.dumps({
            "submission_id": submission_id,
            "content": content,
            "type": comment_type,
        }, sort_keys=True)
        comment.comment_hash = hashlib.sha256(comment_text.encode()).hexdigest()
        
        self.post_pub_reviews[comment.comment_id] = comment
        
        return {"status": "ok", "comment_id": comment.comment_id, "hash": comment.comment_hash}
    
    def get_post_pub_reviews(self, submission_id: str) -> List[Dict[str, Any]]:
        """Получение публичных комментариев"""
        comments = []
        for comment in self.post_pub_reviews.values():
            if comment.submission_id == submission_id:
                comments.append(asdict(comment))
        return comments


# =====================================================================
# 10. PLAGIARISM DETECTION ( text similarity )
# =====================================================================

class PlagiarismDetector:
    """Базовый детектор плагиата на основе текстового сходства"""
    
    @staticmethod
    def extract_ngrams(text: str, n: int = 3) -> set:
        """Извлечение n-грамм из текста"""
        words = text.lower().split()
        if len(words) < n:
            return {text.lower()}
        return {" ".join(words[i:i+n]) for i in range(len(words) - n + 1)}
    
    @staticmethod
    def jaccard_similarity(set1: set, set2: set) -> float:
        """Коэффициент Жаккара между двумя множествами"""
        if not set1 or not set2:
            return 0.0
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        return intersection / union if union > 0 else 0.0
    
    def check_similarity(self, text1: str, text2: str) -> Dict[str, Any]:
        """Проверка сходства двух текстовых фрагментов"""
        ngrams1 = self.extract_ngrams(text1, n=3)
        ngrams2 = self.extract_ngrams(text2, n=3)
        
        similarity = self.jaccard_similarity(ngrams1, ngrams2)
        
        # Finding common phrases for evidence
        common = ngrams1 & ngrams2
        common_phrases = sorted(common, key=lambda x: len(x), reverse=True)[:10]
        
        return {
            "similarity_score": round(similarity * 100, 2),
            "is_suspicious": similarity > 0.3,
            "common_phrases_count": len(common),
            "top_common_phrases": common_phrases,
            "word_count_text1": len(text1.split()),
            "word_count_text2": len(text2.split()),
        }
    
    def check_manuscript(
        self,
        manuscript_text: str,
        reference_texts: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        """Проверка manuscript на плагиат по списку reference texts"""
        results = []
        max_similarity = 0.0
        most_similar_ref = None
        
        for ref in reference_texts:
            ref_text = ref.get("text", "")
            ref_title = ref.get("title", "Unknown")
            
            check = self.check_similarity(manuscript_text, ref_text)
            check["reference_title"] = ref_title
            
            if check["similarity_score"] > max_similarity:
                max_similarity = check["similarity_score"]
                most_similar_ref = ref_title
            
            results.append(check)
        
        return {
            "overall_similarity": round(max_similarity, 2),
            "is_plagiarism_suspected": max_similarity > 30.0,
            "is_critical": max_similarity > 50.0,
            "most_similar_reference": most_similar_ref,
            "references_checked": len(results),
            "detailed_results": results,
        }


# =====================================================================
# 11. PREPRINT BRIDGE (arXiv, DOI import)
# =====================================================================

class PreprintBridge:
    """Импорт существующих препринтов (arXiv, DOI, bioRxiv)"""
    
    @staticmethod
    def extract_arxiv_id(text: str) -> Optional[str]:
        """Извлечение arXiv ID из текста"""
        import re
        patterns = [
            r'arxiv\.org/abs/(\d{4}\.\d{4,5}(?:v\d+)?)',
            r'arXiv:(\d{4}\.\d{4,5}(?:v\d+)?)',
            r'(\d{4}\.\d{4,5}(?:v\d+)?)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        return None
    
    @staticmethod
    def extract_doi(text: str) -> Optional[str]:
        """Извлечение DOI из текста"""
        import re
        patterns = [
            r'doi\.org/(10\.\d{4,}/[^\s]+)',
            r'DOI:\s*(10\.\d{4,}/[^\s]+)',
            r'(10\.\d{4,}/[^\s]+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).rstrip('.')
        return None
    
    @staticmethod
    def resolve_identifier(identifier: str) -> Dict[str, Any]:
        """Разрешение идентификатора (arXiv/DOI) в метаданные"""
        bridge = PreprintBridge()
        
        # Try arXiv
        arxiv_id = bridge.extract_arxiv_id(identifier)
        if arxiv_id:
            return {
                "type": "arxiv",
                "id": arxiv_id,
                "url": f"https://arxiv.org/abs/{arxiv_id}",
                "source": "arxiv",
                "status": "resolved",
            }
        
        # Try DOI
        doi = bridge.extract_doi(identifier)
        if doi:
            return {
                "type": "doi",
                "id": doi,
                "url": f"https://doi.org/{doi}",
                "source": "crossref",
                "status": "resolved",
            }
        
        # Try URL patterns
        import re
        bioRxiv = re.search(r'biorxiv\.org/content/([^/\s]+)', identifier)
        if bioRxiv:
            return {
                "type": "biorxiv",
                "id": bioRxiv.group(1),
                "url": identifier,
                "source": "biorxiv",
                "status": "resolved",
            }
        
        medRxiv = re.search(r'medrxiv\.org/content/([^/\s]+)', identifier)
        if medRxiv:
            return {
                "type": "medrxiv",
                "id": medRxiv.group(1),
                "url": identifier,
                "source": "medrxiv",
                "status": "resolved",
            }
        
        return {
            "type": "unknown",
            "id": identifier,
            "url": identifier,
            "source": "unknown",
            "status": "unresolved",
        }
    
    def import_preprint(
        self,
        identifier: str,
        submission: Submission,
    ) -> Dict[str, Any]:
        """Импорт препринта в submission"""
        resolved = self.resolve_identifier(identifier)
        
        if resolved["status"] == "unresolved":
            return {
                "status": "error",
                "message": f"Could not resolve identifier: {identifier}",
            }
        
        # Add preprint DOI to submission
        submission.preprint_doi = resolved["id"]
        
        # Add metadata
        submission.submission_history.append({
            "action": "preprint_imported",
            "source": resolved["source"],
            "identifier": resolved["id"],
            "url": resolved["url"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        
        self._save_state()
        return {
            "status": "ok",
            "source": resolved["source"],
            "identifier": resolved["id"],
            "url": resolved["url"],
            "message": f"Preprint from {resolved['source']} linked to submission",
        }


# =====================================================================
# 12. AI MANUSCRIPT SCREENING
# =====================================================================

class AIManuscriptScreener:
    """AI-powered предварительная проверка manuscripts"""
    
    # Quality indicators
    QUALITY_KEYWORDS = {
        "methodology": ["method", "methodology", "approach", "analysis", "statistical", "p-value", "confidence interval", "sample size", "control group"],
        "ethics": ["ethics", "IRB", "informed consent", "confidentiality", "hipaa", "declaration of helsinki"],
        "novelty": ["novel", "new", "first", "innovative", "unprecedented", "unique", "contribution"],
        "reproducibility": ["reproducib", "replicat", "code availability", "data availability", "open source", "github"],
        "clarity": ["abstract", "introduction", "conclusion", "discussion", "limitation", "future work"],
    }
    
    RED_FLAGS = {
        "potential_plagiarism": ["previously published", "already published", "submitted elsewhere"],
        "predatory_indicators": ["pay to publish", "guaranteed publication", "fast track"],
        "ethical_concerns": ["without consent", "retrospective waiver", "exempt from review"],
        "data_issues": ["fabricated", "simulated data", "synthetic participants"],
    }
    
    def screen_manuscript(self, submission: Submission) -> Dict[str, Any]:
        """Комплексная AI-проверка manuscript"""
        text = f"{submission.title}\n\n{submission.abstract}\n\n{' '.join(submission.keywords)}"
        
        # Quality analysis
        quality_scores = {}
        for category, keywords in self.QUALITY_KEYWORDS.items():
            matches = sum(1 for kw in keywords if kw.lower() in text.lower())
            quality_scores[category] = min(1.0, matches / max(1, len(keywords) * 0.3))
        
        # Red flag detection
        red_flags = []
        for flag_type, patterns in self.RED_FLAGS.items():
            for pattern in patterns:
                if pattern.lower() in text.lower():
                    red_flags.append({"type": flag_type, "pattern": pattern})
        
        # Completeness check
        completeness = {
            "has_title": bool(submission.title),
            "has_abstract": bool(submission.abstract and len(submission.abstract) > 50),
            "has_keywords": bool(submission.keywords and len(submission.keywords) >= 3),
            "has_authors": bool(submission.authors and len(submission.authors) >= 1),
            "has_category": bool(submission.category),
            "has_funding": bool(submission.funding_statement),
            "has_ethics": bool(submission.ethical_approval),
            "has_data_availability": bool(submission.data_availability),
            "has_coi_declaration": bool(submission.conflict_of_interest),
        }
        
        # Overall score
        avg_quality = sum(quality_scores.values()) / max(1, len(quality_scores))
        completeness_score = sum(completeness.values()) / max(1, len(completeness))
        red_flag_penalty = len(red_flags) * 0.15
        
        overall_score = max(0, min(10, (avg_quality * 5 + completeness_score * 5) * (1 - red_flag_penalty)))
        
        # Recommendation
        if overall_score >= 7:
            recommendation = "APPROVE_FOR_REVIEW"
        elif overall_score >= 5:
            recommendation = "REVIEW_WITH_CAUTION"
        elif overall_score >= 3:
            recommendation = "REQUIRES_REVISION_BEFORE_REVIEW"
        else:
            recommendation = "REJECT_SCREENING"
        
        return {
            "submission_id": submission.submission_id,
            "overall_score": round(overall_score, 2),
            "recommendation": recommendation,
            "quality_scores": {k: round(v, 2) for k, v in quality_scores.items()},
            "completeness": completeness,
            "completeness_score": round(completeness_score * 100, 1),
            "red_flags": red_flags,
            "red_flag_count": len(red_flags),
            "suggestions": self._generate_suggestions(quality_scores, completeness, red_flags),
        }
    
    def _generate_suggestions(
        self,
        quality_scores: Dict[str, float],
        completeness: Dict[str, bool],
        red_flags: List[Dict],
    ) -> List[str]:
        """Генерация рекомендаций"""
        suggestions = []
        
        if quality_scores.get("methodology", 0) < 0.3:
            suggestions.append("Consider strengthening the methodology section with more detailed descriptions")
        
        if quality_scores.get("ethics", 0) < 0.3:
            suggestions.append("Add explicit ethics approval and informed consent statements")
        
        if quality_scores.get("reproducibility", 0) < 0.3:
            suggestions.append("Consider adding data/code availability statements for reproducibility")
        
        if not completeness.get("has_data_availability"):
            suggestions.append("Add a data availability statement (required by many journals)")
        
        if not completeness.get("has_coi_declaration"):
            suggestions.append("Add a conflict of interest declaration")
        
        if red_flags:
            suggestions.append(f"Address {len(red_flags)} red flag(s) detected in the manuscript")
        
        return suggestions


# =====================================================================
# 13. EXTENDED EDITORIAL ENGINE (with new features)
# =====================================================================

class ExtendedEditorialEngine(EditorialEngine):
    """Расширенный editorial engine с плагиатом, импортом, revision workflow, tasks, email, AI screening"""
    
    def __init__(self, storage_dir: Optional[str] = None):
        super().__init__(storage_dir=storage_dir)
        self.plagiarism_detector = PlagiarismDetector()
        self.preprint_bridge = PreprintBridge()
        self.revision_manager = RevisionWorkflowManager()
        self.email_service = EmailNotificationService()
        self.task_manager = EditorialTaskManager()
        self.version_tracker = VersionHistoryTracker()
        self.checklist_manager = SubmissionChecklistManager()
        self.analytics = EditorialAnalytics(self)
        self.ai_screener = AIManuscriptScreener()
    
    def check_plagiarism(
        self,
        submission_id: str,
        reference_texts: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        """Проверка submission на плагиат"""
        submission = self.submissions.get(submission_id)
        if not submission:
            return {"status": "error", "message": "Submission not found"}
        
        manuscript_text = f"{submission.title}\n\n{submission.abstract}"
        
        return self.plagiarism_detector.check_manuscript(
            manuscript_text, reference_texts
        )
    
    def import_preprint(
        self,
        submission_id: str,
        identifier: str,
    ) -> Dict[str, Any]:
        """Импорт препринта"""
        submission = self.submissions.get(submission_id)
        if not submission:
            return {"status": "error", "message": "Submission not found"}
        
        return self.preprint_bridge.import_preprint(identifier, submission)


# =====================================================================
# 13. REVISION WORKFLOW (due dates, reminders, version tracking)
# =====================================================================

@dataclass
class RevisionRequest:
    """Запрос на правки"""
    revision_id: str
    submission_id: str
    revision_number: int
    
    # Deadline
    due_date: str  # ISO datetime
    reminder_days: List[int] = field(default_factory=lambda: [7, 3, 1])  # Days before due
    
    # Required changes
    required_changes: List[str] = field(default_factory=list)
    reviewer_comments: str = ""
    editor_comments: str = ""
    
    # Status
    status: str = "pending"  # pending, in_progress, submitted, overdue, completed
    submitted_at: Optional[str] = None
    completed_at: Optional[str] = None
    
    # Version tracking
    version_files: List[Dict[str, str]] = field(default_factory=list)  # [{filename, path, hash}]
    response_to_reviewers: str = ""
    
    # Reminders sent
    reminders_sent: List[str] = field(default_factory=list)
    
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class EditorialTask:
    """Задача editorial workflow"""
    task_id: str
    submission_id: str
    
    # Task details
    title: str
    description: str = ""
    task_type: str = "general"  # general, checklist, review, copyedit, production
    
    # Assignment
    assigned_to: Optional[str] = None  # user_id or orcid
    assigned_role: Optional[str] = None  # section_editor, reviewer, production
    
    # Timing
    due_date: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    
    # Status
    status: str = "pending"  # pending, in_progress, completed, blocked
    priority: str = "normal"  # low, normal, high, urgent
    
    # Dependencies
    depends_on: List[str] = field(default_factory=list)  # task_ids
    blocks: List[str] = field(default_factory=list)  # task_ids this task blocks


class RevisionWorkflowManager:
    """Управление процессом правок"""
    
    def __init__(self):
        self.revisions: Dict[str, RevisionRequest] = {}
    
    def create_revision_request(
        self,
        submission_id: str,
        revision_number: int,
        required_changes: List[str],
        editor_comments: str = "",
        reviewer_comments: str = "",
        deadline_days: int = 30,
    ) -> RevisionRequest:
        """Создание запроса на правки"""
        due_date = (datetime.now(timezone.utc) + timedelta(days=deadline_days)).isoformat()
        
        revision = RevisionRequest(
            revision_id=str(uuid.uuid4()),
            submission_id=submission_id,
            revision_number=revision_number,
            due_date=due_date,
            required_changes=required_changes,
            editor_comments=editor_comments,
            reviewer_comments=reviewer_comments,
        )
        
        self.revisions[revision.revision_id] = revision
        return revision
    
    def submit_revision(
        self,
        revision_id: str,
        response_to_reviewers: str = "",
        version_files: List[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Автор загружает правки"""
        revision = self.revisions.get(revision_id)
        if not revision:
            return {"status": "error", "message": "Revision not found"}
        
        revision.status = "submitted"
        revision.submitted_at = datetime.now(timezone.utc).isoformat()
        revision.response_to_reviewers = response_to_reviewers
        revision.version_files = version_files or []
        
        return {"status": "ok", "revision_id": revision_id}
    
    def check_overdue_revisions(self) -> List[Dict[str, Any]]:
        """Проверка просроченных правок"""
        now = datetime.now(timezone.utc)
        overdue = []
        
        for rev in self.revisions.values():
            if rev.status in ("pending", "in_progress"):
                due = datetime.fromisoformat(rev.due_date.replace('Z', '+00:00'))
                if now > due:
                    rev.status = "overdue"
                    overdue.append({
                        "revision_id": rev.revision_id,
                        "submission_id": rev.submission_id,
                        "revision_number": rev.revision_number,
                        "due_date": rev.due_date,
                        "days_overdue": (now - due).days,
                    })
        
        return overdue
    
    def get_pending_reminders(self) -> List[Dict[str, Any]]:
        """Получение напоминаний, которые нужно отправить"""
        now = datetime.now(timezone.utc)
        reminders = []
        
        for rev in self.revisions.values():
            if rev.status not in ("pending", "in_progress"):
                continue
            
            due = datetime.fromisoformat(rev.due_date.replace('Z', '+00:00'))
            days_until_due = (due - now).days
            
            for days in rev.reminder_days:
                if days_until_due <= days and f"day_{days}" not in rev.reminders_sent:
                    reminders.append({
                        "revision_id": rev.revision_id,
                        "submission_id": rev.submission_id,
                        "revision_number": rev.revision_number,
                        "due_date": rev.due_date,
                        "days_until_due": days_until_due,
                        "reminder_type": f"day_{days}",
                    })
        
        return reminders
    
    def get_revision_timeline(self, submission_id: str) -> List[Dict[str, Any]]:
        """Timeline всех правок для submission"""
        revisions = [
            r for r in self.revisions.values()
            if r.submission_id == submission_id
        ]
        revisions.sort(key=lambda x: x.revision_number)
        
        return [
            {
                "revision_id": r.revision_id,
                "revision_number": r.revision_number,
                "status": r.status,
                "due_date": r.due_date,
                "submitted_at": r.submitted_at,
                "created_at": r.created_at,
            }
            for r in revisions
        ]


# =====================================================================
# 14. EMAIL NOTIFICATION SERVICE
# =====================================================================

class EmailNotificationService:
    """Сервис email-уведомлений (заглушка для SMTP интеграции)"""
    
    TEMPLATES = {
        "reviewer_invitation": {
            "subject": "Invitation to Review: {manuscript_title}",
            "body": """Dear {reviewer_name},

You have been invited to review the manuscript "{manuscript_title}" submitted to GitScience Open Repository.

Submission ID: {submission_id}
Category: {category}

Please respond to this invitation within 7 days.

Best regards,
GitScience Editorial Team"""
        },
        "revision_request": {
            "subject": "Revision Required: {manuscript_title}",
            "body": """Dear {author_name},

Your manuscript "{manuscript_title}" requires revisions before acceptance.

Deadline: {deadline}
Revision Number: {revision_number}

Required Changes:
{required_changes}

Please submit your revised manuscript by the deadline.

Best regards,
{editor_name}
Editor-in-Chief, GitScience Open Repository"""
        },
        "decision_accept": {
            "subject": "Manuscript Accepted: {manuscript_title}",
            "body": """Dear {author_name},

We are pleased to inform you that your manuscript "{manuscript_title}" has been accepted for publication.

DOI: {doi}
Registration Code: {registration_code}

Your manuscript will enter the production phase.

Best regards,
{editor_name}"""
        },
        "decision_reject": {
            "subject": "Manuscript Decision: {manuscript_title}",
            "body": """Dear {author_name},

Thank you for submitting your manuscript "{manuscript_title}".

After peer review, we regret to inform you that your manuscript cannot be accepted in its current form.

{rationale}

Your blockchain-anchored timestamp remains valid as proof of priority.

Best regards,
{editor_name}"""
        },
        "reminder_overdue": {
            "subject": "OVERDUE: Revision Required - {manuscript_title}",
            "body": """Dear {author_name},

This is a reminder that the revision for your manuscript "{manuscript_title}" is now overdue.

Original Deadline: {deadline}
Days Overdue: {days_overdue}

Please submit your revision as soon as possible.

Best regards,
GitScience Editorial Team"""
        },
        "reviewer_deadline_reminder": {
            "subject": "Review Deadline Reminder: {manuscript_title}",
            "body": """Dear {reviewer_name},

This is a reminder that your review for "{manuscript_title}" is due in {days_until_due} days.

Deadline: {deadline}

Please complete your review by the deadline.

Best regards,
GitScience Editorial Team"""
        },
    }
    
    def __init__(self):
        self.sent_emails: List[Dict[str, Any]] = []
    
    def send_notification(
        self,
        template_key: str,
        to_email: str,
        **kwargs,
    ) -> Dict[str, Any]:
        """Отправка уведомления (в реальности — SMTP/SendGrid)"""
        template = self.TEMPLATES.get(template_key)
        if not template:
            return {"status": "error", "message": f"Template '{template_key}' not found"}
        
        subject = template["subject"].format(**kwargs)
        body = template["body"].format(**kwargs)
        
        # В реальности здесь была бы SMTP отправка
        email_record = {
            "email_id": str(uuid.uuid4()),
            "template": template_key,
            "to": to_email,
            "subject": subject,
            "body_preview": body[:200],
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "status": "sent",  # В реальности: queued, sent, delivered, failed
        }
        
        self.sent_emails.append(email_record)
        
        return {
            "status": "ok",
            "email_id": email_record["email_id"],
            "template": template_key,
            "to": to_email,
            "subject": subject,
        }
    
    def get_email_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """История отправленных писем"""
        return self.sent_emails[-limit:]


# =====================================================================
# 15. EDITORIAL TASK MANAGER
# =====================================================================

class EditorialTaskManager:
    """Управление задачами editorial workflow"""
    
    def __init__(self):
        self.tasks: Dict[str, EditorialTask] = {}
    
    def create_task(
        self,
        submission_id: str,
        title: str,
        description: str = "",
        task_type: str = "general",
        assigned_to: Optional[str] = None,
        assigned_role: Optional[str] = None,
        due_date: Optional[str] = None,
        priority: str = "normal",
        depends_on: List[str] = None,
    ) -> EditorialTask:
        """Создание задачи"""
        task = EditorialTask(
            task_id=str(uuid.uuid4()),
            submission_id=submission_id,
            title=title,
            description=description,
            task_type=task_type,
            assigned_to=assigned_to,
            assigned_role=assigned_role,
            due_date=due_date,
            priority=priority,
            depends_on=depends_on or [],
        )
        
        self.tasks[task.task_id] = task
        return task
    
    def complete_task(self, task_id: str) -> Dict[str, Any]:
        """Завершение задачи"""
        task = self.tasks.get(task_id)
        if not task:
            return {"status": "error", "message": "Task not found"}
        
        task.status = "completed"
        task.completed_at = datetime.now(timezone.utc).isoformat()
        
        # Unblock dependent tasks
        for other_task in self.tasks.values():
            if task_id in other_task.depends_on:
                other_task.depends_on.remove(task_id)
                if not other_task.depends_on:
                    other_task.status = "pending"
        
        return {"status": "ok", "task_id": task_id}
    
    def get_submission_tasks(self, submission_id: str) -> List[Dict[str, Any]]:
        """Задачи для конкретной submission"""
        tasks = [
            t for t in self.tasks.values()
            if t.submission_id == submission_id
        ]
        tasks.sort(key=lambda x: (
            {"urgent": 0, "high": 1, "normal": 2, "low": 3}.get(x.priority, 2),
            x.due_date or "9999-12-31"
        ))
        
        return [
            {
                "task_id": t.task_id,
                "title": t.title,
                "description": t.description,
                "task_type": t.task_type,
                "assigned_to": t.assigned_to,
                "assigned_role": t.assigned_role,
                "due_date": t.due_date,
                "status": t.status,
                "priority": t.priority,
                "depends_on": t.depends_on,
                "created_at": t.created_at,
                "completed_at": t.completed_at,
            }
            for t in tasks
        ]
    
    def get_overdue_tasks(self) -> List[Dict[str, Any]]:
        """Просроченные задачи"""
        now = datetime.now(timezone.utc)
        overdue = []
        
        for task in self.tasks.values():
            if task.status in ("pending", "in_progress") and task.due_date:
                due = datetime.fromisoformat(task.due_date.replace('Z', '+00:00'))
                if now > due:
                    overdue.append({
                        "task_id": task.task_id,
                        "submission_id": task.submission_id,
                        "title": task.title,
                        "assigned_to": task.assigned_to,
                        "due_date": task.due_date,
                        "days_overdue": (now - due).days,
                        "priority": task.priority,
                    })
        
        return overdue


# =====================================================================
# 16. VERSION HISTORY TRACKER
# =====================================================================

@dataclass
class VersionSnapshot:
    """Снимок версии manuscript"""
    version_id: str
    submission_id: str
    version_number: int
    
    # Content
    title: str
    abstract: str
    authors: List[Dict[str, str]]
    
    # Files
    files: List[Dict[str, str]]  # [{filename, path, hash, size}]
    
    # Changes
    change_summary: str = ""
    changes_from_previous: List[str] = field(default_factory=list)
    
    # Blockchain
    git_commit_hash: Optional[str] = None
    ots_timestamp: Optional[str] = None
    ipfs_cid: Optional[str] = None
    
    # Metadata
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: str = ""  # orcid


class VersionHistoryTracker:
    """Отслеживание версий manuscript"""
    
    def __init__(self):
        self.versions: Dict[str, List[VersionSnapshot]] = {}  # submission_id -> versions
    
    def create_snapshot(
        self,
        submission: Submission,
        change_summary: str = "",
        changes_from_previous: List[str] = None,
        created_by: str = "",
    ) -> VersionSnapshot:
        """Создание снимка версии"""
        submission_versions = self.versions.get(submission.submission_id, [])
        version_number = len(submission_versions) + 1
        
        snapshot = VersionSnapshot(
            version_id=str(uuid.uuid4()),
            submission_id=submission.submission_id,
            version_number=version_number,
            title=submission.title,
            abstract=submission.abstract,
            authors=submission.authors,
            files=[],  # Would be populated from actual file uploads
            change_summary=change_summary,
            changes_from_previous=changes_from_previous or [],
            git_commit_hash=submission.git_commit_hash,
            ots_timestamp=submission.ots_timestamp,
            created_by=created_by,
        )
        
        if submission.submission_id not in self.versions:
            self.versions[submission.submission_id] = []
        self.versions[submission.submission_id].append(snapshot)
        
        return snapshot
    
    def get_version_history(self, submission_id: str) -> List[Dict[str, Any]]:
        """История версий"""
        versions = self.versions.get(submission_id, [])
        return [
            {
                "version_id": v.version_id,
                "version_number": v.version_number,
                "title": v.title,
                "change_summary": v.change_summary,
                "changes_from_previous": v.changes_from_previous,
                "git_commit_hash": v.git_commit_hash,
                "ots_timestamp": v.ots_timestamp,
                "created_at": v.created_at,
                "created_by": v.created_by,
            }
            for v in versions
        ]
    
    def get_version_diff(self, submission_id: str, v1: int, v2: int) -> Dict[str, Any]:
        """Сравнение двух версий"""
        versions = self.versions.get(submission_id, [])
        
        version_1 = next((v for v in versions if v.version_number == v1), None)
        version_2 = next((v for v in versions if v.version_number == v2), None)
        
        if not version_1 or not version_2:
            return {"status": "error", "message": "Version not found"}
        
        # Simple diff of titles and abstracts
        title_changed = version_1.title != version_2.title
        abstract_changed = version_1.abstract != version_2.abstract
        authors_changed = version_1.authors != version_2.authors
        
        return {
            "status": "ok",
            "version_1": v1,
            "version_2": v2,
            "title_changed": title_changed,
            "abstract_changed": abstract_changed,
            "authors_changed": authors_changed,
            "title_v1": version_1.title,
            "title_v2": version_2.title,
            "abstract_v1_length": len(version_1.abstract),
            "abstract_v2_length": len(version_2.abstract),
        }


# =====================================================================
# 17. SUBMISSION CHECKLIST MANAGER
# =====================================================================

class SubmissionChecklistManager:
    """Управление чеклистом подачи"""
    
    DEFAULT_CHECKLIST = [
        {"id": "title", "label": "Title is clear and concise", "required": True, "category": "metadata"},
        {"id": "abstract", "label": "Abstract provided (150-300 words)", "required": True, "category": "metadata"},
        {"id": "authors", "label": "All authors listed with ORCID", "required": True, "category": "metadata"},
        {"id": "keywords", "label": "Keywords provided (3-10)", "required": True, "category": "metadata"},
        {"id": "category", "label": "Scientific category selected", "required": True, "category": "metadata"},
        {"id": "manuscript_file", "label": "Manuscript file uploaded", "required": True, "category": "files"},
        {"id": "figures", "label": "Figures uploaded (if applicable)", "required": False, "category": "files"},
        {"id": "supplementary", "label": "Supplementary materials (if applicable)", "required": False, "category": "files"},
        {"id": "ethics_approval", "label": "Ethics approval stated (if applicable)", "required": False, "category": "compliance"},
        {"id": "conflict_of_interest", "label": "Conflict of interest declared", "required": True, "category": "compliance"},
        {"id": "funding", "label": "Funding sources declared", "required": False, "category": "compliance"},
        {"id": "data_availability", "label": "Data availability statement", "required": True, "category": "compliance"},
        {"id": "author_contribution", "label": "Author contributions (CRediT)", "required": False, "category": "compliance"},
        {"id": "references", "label": "References formatted correctly", "required": True, "category": "formatting"},
    ]
    
    def __init__(self):
        self.checklists: Dict[str, List[Dict[str, Any]]] = {}
    
    def get_checklist(self, submission_id: str) -> Dict[str, Any]:
        """Получение чеклиста для submission"""
        if submission_id not in self.checklists:
            self.checklists[submission_id] = [
                {**item, "completed": False, "completed_at": None}
                for item in self.DEFAULT_CHECKLIST
            ]
        
        checklist = self.checklists[submission_id]
        total = len(checklist)
        completed = sum(1 for item in checklist if item["completed"])
        required = sum(1 for item in checklist if item["required"])
        required_completed = sum(1 for item in checklist if item["required"] and item["completed"])
        
        return {
            "submission_id": submission_id,
            "checklist": checklist,
            "progress": {
                "total": total,
                "completed": completed,
                "required": required,
                "required_completed": required_completed,
                "percentage": round(completed / total * 100, 1) if total > 0 else 0,
                "all_required_met": required_completed == required,
            }
        }
    
    def complete_item(
        self,
        submission_id: str,
        item_id: str,
    ) -> Dict[str, Any]:
        """Отметка выполнения пункта чеклиста"""
        checklist = self.checklists.get(submission_id, [])
        
        for item in checklist:
            if item["id"] == item_id:
                item["completed"] = True
                item["completed_at"] = datetime.now(timezone.utc).isoformat()
                return {"status": "ok", "item_id": item_id}
        
        return {"status": "error", "message": f"Checklist item '{item_id}' not found"}


# =====================================================================
# 18. ANALYTICS DASHBOARD
# =====================================================================

class EditorialAnalytics:
    """Аналитика editorial workflow"""
    
    def __init__(self, engine: 'EditorialEngine'):
        self.engine = engine
    
    def get_analytics_dashboard(self) -> Dict[str, Any]:
        """Главный дашборд аналитики"""
        submissions = list(self.engine.submissions.values())
        reviews = list(self.engine.reviews.values())
        
        # Time to decision
        decision_times = []
        for sub in submissions:
            if sub.submitted_at and sub.decision in ("accepted", "rejected"):
                submitted = datetime.fromisoformat(sub.submitted_at.replace('Z', '+00:00'))
                updated = datetime.fromisoformat(sub.last_updated.replace('Z', '+00:00'))
                decision_times.append((updated - submitted).days)
        
        # Review turnaround
        review_times = []
        for review in reviews:
            if review.invited_at and review.completed_at:
                invited = datetime.fromisoformat(review.invited_at.replace('Z', '+00:00'))
                completed = datetime.fromisoformat(review.completed_at.replace('Z', '+00:00'))
                review_times.append((completed - invited).days)
        
        # Status distribution
        status_counts = {}
        for sub in submissions:
            status_counts[sub.status] = status_counts.get(sub.status, 0) + 1
        
        # Review recommendations
        rec_counts = {}
        for review in reviews:
            if review.recommendation:
                rec_counts[review.recommendation] = rec_counts.get(review.recommendation, 0) + 1
        
        return {
            "overview": {
                "total_submissions": len(submissions),
                "total_reviews": len(reviews),
                "published": status_counts.get("published", 0),
                "under_review": status_counts.get("under_review", 0),
                "pending_decision": len([s for s in submissions if s.status == "under_review" and len([r for r in reviews if r.submission_id == s.submission_id and r.status == "completed"]) >= 2]),
            },
            "timing": {
                "avg_days_to_decision": round(sum(decision_times) / len(decision_times), 1) if decision_times else 0,
                "median_days_to_decision": sorted(decision_times)[len(decision_times) // 2] if decision_times else 0,
                "avg_days_review_turnaround": round(sum(review_times) / len(review_times), 1) if review_times else 0,
            },
            "distribution": {
                "submissions_by_status": status_counts,
                "reviews_by_recommendation": rec_counts,
            },
            "acceptance_rate": round(
                status_counts.get("published", 0) / max(1, len(submissions)) * 100, 1
            ),
        }


# =====================================================================
# 19. CROSS-JOURNAL TRANSFER
# =====================================================================

class CrossJournalTransfer:
    """Перенос submissions между журналами"""
    
    def __init__(self):
        self.transfers: List[Dict[str, Any]] = []
    
    def transfer_manuscript(
        self,
        submission: Submission,
        target_journal: str,
        reason: str = "",
        transfer_notes: str = "",
    ) -> Dict[str, Any]:
        """Перенос manuscript в другой журнал"""
        transfer_id = str(uuid.uuid4())
        
        transfer_record = {
            "transfer_id": transfer_id,
            "submission_id": submission.submission_id,
            "source_manuscript_code": submission.submission_code,
            "target_journal": target_journal,
            "reason": reason,
            "transfer_notes": transfer_notes,
            "transferred_at": datetime.now(timezone.utc).isoformat(),
            "status": "transferred",
        }
        
        self.transfers.append(transfer_record)
        
        # Update submission history
        submission.submission_history.append({
            "action": "transferred",
            "transfer_id": transfer_id,
            "target_journal": target_journal,
            "reason": reason,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        
        return {
            "status": "ok",
            "transfer_id": transfer_id,
            "target_journal": target_journal,
            "message": f"Manuscript transferred to {target_journal}",
        }
    
    def get_transfer_history(self, submission_id: str) -> List[Dict[str, Any]]:
        """История переносов"""
        return [
            t for t in self.transfers
            if t["submission_id"] == submission_id
        ]


# =====================================================================
# 20. PREREGISTRATION
# =====================================================================

@dataclass
class Preregistration:
    """Пререгистрация исследования"""
    prereg_id: str
    title: str
    hypothesis: str
    methods: str
    analysis_plan: str
    
    # Authors
    authors: List[Dict[str, str]] = field(default_factory=list)
    corresponding_author_orcid: str = ""
    
    # Status
    status: str = "draft"  # draft, submitted, registered, archived
    registered_at: Optional[str] = None
    
    # Versioning
    version: int = 1
    amendments: List[Dict[str, Any]] = field(default_factory=list)
    
    # Blockchain anchoring
    git_commit_hash: Optional[str] = None
    ots_timestamp: Optional[str] = None
    
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PreregistrationManager:
    """Управление пререгистрациями"""
    
    def __init__(self):
        self.preregistrations: Dict[str, Preregistration] = {}
    
    def create_preregistration(
        self,
        title: str,
        hypothesis: str,
        methods: str,
        analysis_plan: str,
        authors: List[Dict[str, str]] = None,
        corresponding_author_orcid: str = "",
    ) -> Preregistration:
        """Создание пререгистрации"""
        prereg = Preregistration(
            prereg_id=str(uuid.uuid4()),
            title=title,
            hypothesis=hypothesis,
            methods=methods,
            analysis_plan=analysis_plan,
            authors=authors or [],
            corresponding_author_orcid=corresponding_author_orcid,
        )
        
        self.preregistrations[prereg.prereg_id] = prereg
        return prereg
    
    def register_preregistration(self, prereg_id: str) -> Dict[str, Any]:
        """Регистрация (фиксация во времени)"""
        prereg = self.preregistrations.get(prereg_id)
        if not prereg:
            return {"status": "error", "message": "Preregistration not found"}
        
        prereg.status = "registered"
        prereg.registered_at = datetime.now(timezone.utc).isoformat()
        
        return {
            "status": "ok",
            "prereg_id": prereg_id,
            "registered_at": prereg.registered_at,
            "message": "Preregistration fixed in time — cannot be modified without amendment",
        }
    
    def add_amendment(
        self,
        prereg_id: str,
        amendment_description: str,
        changes: str,
    ) -> Dict[str, Any]:
        """Добавление поправки (с сохранением оригинала)"""
        prereg = self.preregistrations.get(prereg_id)
        if not prereg:
            return {"status": "error", "message": "Preregistration not found"}
        
        amendment = {
            "amendment_id": str(uuid.uuid4()),
            "version": prereg.version + 1,
            "description": amendment_description,
            "changes": changes,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        prereg.amendments.append(amendment)
        prereg.version += 1
        
        return {
            "status": "ok",
            "amendment_id": amendment["amendment_id"],
            "new_version": prereg.version,
        }
    
    def get_preregistration(self, prereg_id: str) -> Optional[Dict[str, Any]]:
        """Получение пререгистрации"""
        prereg = self.preregistrations.get(prereg_id)
        if not prereg:
            return None
        
        return {
            "prereg_id": prereg.prereg_id,
            "title": prereg.title,
            "hypothesis": prereg.hypothesis,
            "methods": prereg.methods,
            "analysis_plan": prereg.analysis_plan,
            "authors": prereg.authors,
            "status": prereg.status,
            "registered_at": prereg.registered_at,
            "version": prereg.version,
            "amendments": prereg.amendments,
            "created_at": prereg.created_at,
        }


# =====================================================================
# 21. FINAL EXTENDED ENGINE (all features)
# =====================================================================

class FinalEditorialEngine(ExtendedEditorialEngine):
    """Финальный editorial engine со всеми функциями"""
    
    def __init__(self, storage_dir: Optional[str] = None):
        super().__init__(storage_dir=storage_dir)
        self.cross_journal_transfer = CrossJournalTransfer()
        self.prereg_manager = PreregistrationManager()
        self.claim_graph = ClaimGraph()
    
    def transfer_manuscript(
        self,
        submission_id: str,
        target_journal: str,
        reason: str = "",
    ) -> Dict[str, Any]:
        """Перенос manuscript в другой журнал"""
        submission = self.submissions.get(submission_id)
        if not submission:
            return {"status": "error", "message": "Submission not found"}
        
        return self.cross_journal_transfer.transfer_manuscript(
            submission, target_journal, reason
        )
    
    def create_preregistration(self, **kwargs) -> Dict[str, Any]:
        """Создание пререгистрации"""
        prereg = self.prereg_manager.create_preregistration(**kwargs)
        return {
            "status": "ok",
            "prereg_id": prereg.prereg_id,
            "title": prereg.title,
        }
    
    def register_preregistration(self, prereg_id: str) -> Dict[str, Any]:
        """Регистрация пререгистрации"""
        return self.prereg_manager.register_preregistration(prereg_id)
    
    def get_preregistration(self, prereg_id: str) -> Optional[Dict[str, Any]]:
        """Получение пререгистрации"""
        return self.prereg_manager.get_preregistration(prereg_id)
    
    def generate_galley(
        self,
        submission_id: str,
        output_format: str = "pdf",
    ) -> Dict[str, Any]:
        """Генерация galley (production-ready manuscript)"""
        submission = self.submissions.get(submission_id)
        if not submission:
            return {"status": "error", "message": "Submission not found"}
        
        exporter = JATSXMLExporter()
        doi = submission.submission_code or submission_id
        
        if output_format == "jats":
            return {"jats_xml": exporter.export_submission(submission, doi)}
        
        if output_format == "html":
            jats_xml = exporter.export_submission(submission, doi)
            return {
                "html": f"<html><body>{jats_xml}</body></html>",
                "format": "html",
            }
        
        # PDF stub — render server would use puppeteer
        return {
            "status": "ok",
            "format": "pdf",
            "message": "PDF generation requires render service (puppeteer/chromium)",
            "jats_xml": exporter.export_submission(submission, doi),
        }
    
    def add_manuscript_claims(
        self,
        submission_id: str,
        claims: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Добавление claims к manuscript"""
        submission = self.submissions.get(submission_id)
        if not submission:
            return {"status": "error", "message": "Submission not found"}
        
        if not hasattr(submission, 'claims'):
            submission.claims = []
        
        for claim in claims:
            submission.claims.append({
                "claim_id": str(uuid.uuid4()),
                "statement": claim.get("statement", ""),
                "claim_type": claim.get("claim_type", "contribution"),
                "evidence_refs": claim.get("evidence_refs", []),
                "strength": claim.get("strength", "moderate"),
                "added_at": datetime.now(timezone.utc).isoformat(),
            })
        
        self._save_state()
        return {
            "status": "ok",
            "claim_count": len(submission.claims),
            "claims": submission.claims,
        }
    
    def get_manuscript_claims(self, submission_id: str) -> Dict[str, Any]:
        """Получение claims manuscripts"""
        submission = self.submissions.get(submission_id)
        if not submission:
            return {"status": "error", "message": "Submission not found"}
        
        return {
            "submission_id": submission_id,
            "claims": getattr(submission, 'claims', []),
        }


# =====================================================================
# 22. CLAIM GRAPH (structured contributions)
# =====================================================================

class ClaimGraph:
    """Граф claims для structured contribution tracking"""
    
    def __init__(self):
        self.claims: Dict[str, Dict[str, Any]] = {}
        self.relationships: List[Dict[str, str]] = []
    
    def add_claim(
        self,
        submission_id: str,
        statement: str,
        claim_type: str,
        evidence_refs: List[str] = None,
        strength: str = "moderate",
        author_orcid: str = "",
    ) -> Dict[str, Any]:
        """Добавление claim в граф"""
        claim_id = str(uuid.uuid4())
        
        self.claims[claim_id] = {
            "claim_id": claim_id,
            "submission_id": submission_id,
            "statement": statement,
            "claim_type": claim_type,
            "evidence_refs": evidence_refs or [],
            "strength": strength,
            "author_orcid": author_orcid,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        return {"claim_id": claim_id, "status": "ok"}
    
    def link_claims(
        self,
        claim_id_1: str,
        claim_id_2: str,
        relationship: str = "supports",
    ) -> Dict[str, Any]:
        """Связь между claims"""
        self.relationships.append({
            "source": claim_id_1,
            "target": claim_id_2,
            "relationship": relationship,
        })
        return {"status": "ok", "relationship": relationship}
    
    def get_graph(self, submission_id: str) -> Dict[str, Any]:
        """Получение графа claims для submission"""
        sub_claims = [
            c for c in self.claims.values()
            if c["submission_id"] == submission_id
        ]
        
        sub_claim_ids = {c["claim_id"] for c in sub_claims}
        sub_rels = [
            r for r in self.relationships
            if r["source"] in sub_claim_ids or r["target"] in sub_claim_ids
        ]
        
        return {
            "claims": sub_claims,
            "relationships": sub_rels,
            "claim_count": len(sub_claims),
            "relationship_count": len(sub_rels),
        }
