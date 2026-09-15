# -*- coding: utf-8 -*-
"""
routes/editorial.py — Editorial workflow, peer review management, DOI minting, JATS export.
Moved from main.py via mechanical extraction; logic unchanged.
"""
from typing import Optional, List, Dict, Any, Tuple

from fastapi import APIRouter, HTTPException, status, Query, Body, Request, Response
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone

from routes.deps import (
    storage, editorial_engine, doi_service, jats_exporter,
    require_active_bearer, require_verified_orcid, require_editor_role,
    EditorialUser, Submission, PeerReview, EditorialDecision,
)

router = APIRouter()


# =====================================================================
# EDITORIAL WORKFLOW API — Peer Review, DOI, JATS, Decisions
# =====================================================================

class EditorialUserRequest(BaseModel):
    user_id: str
    orcid: str
    name: str
    email: str
    roles: List[str]
    expertise_areas: List[str] = []
    institution: str = ""
    h_index: int = 0

class SubmitManuscriptRequest(BaseModel):
    title: str
    abstract: str
    authors: List[Dict[str, str]]
    corresponding_author_orcid: str
    category: str
    keywords: List[str] = []
    funding_statement: str = ""
    data_availability: str = ""
    conflict_of_interest: str = ""
    ethical_approval: str = ""
    author_contribution: str = ""

class AssignReviewersRequest(BaseModel):
    reviewer_orcids: List[str]

class SubmitReviewRequest(BaseModel):
    reviewer_orcid: str
    recommendation: str
    confidence_level: int = 3
    summary: str
    strengths: List[str] = []
    weaknesses: List[str] = []
    detailed_comments: str = ""
    minor_comments: str = ""
    scores: Dict[str, int] = {}

class MakeDecisionRequest(BaseModel):
    editor_orcid: str
    decision: str
    rationale: str = ""
    editorial_comments: str = ""
    required_changes: List[str] = []
    deadline_days: int = 30

class PostPubCommentRequest(BaseModel):
    author_orcid: str
    content: str
    comment_type: str = "comment"
    parent_comment_id: Optional[str] = None


VALID_EDITORIAL_ROLES = {"author", "reviewer", "section_editor", "editor_in_chief", "production", "platform_admin"}
SELF_REG_ROLES = {"author", "reviewer"}

@router.post("/api/v1/editorial/register-user")
def register_editorial_user(request: Request, req: EditorialUserRequest):
    """Регистрация пользователя с editorial ролью.

    - Роли author/reviewer: self-registration, только для собственного ORCID (из JWT).
    - Привилегированные роли (section_editor, editor_in_chief, production, platform_admin):
      только действующий editor_in_chief / platform_admin, либо bootstrap-только-своя-роль
      через заголовок X-GS-Bootstrap-Secret = GS_EDITORIAL_BOOTSTRAP_SECRET (для первого админа).
    """
    granted = set(req.roles or [])
    invalid = granted - VALID_EDITORIAL_ROLES
    if invalid:
        raise HTTPException(status_code=422, detail=f"Недопустимые роли: {sorted(invalid)}")

    if granted.issubset(SELF_REG_ROLES):
        require_verified_orcid(request, req.orcid)
    else:
        bootstrap = os.environ.get("GS_EDITORIAL_BOOTSTRAP_SECRET", "")
        header_secret = request.headers.get("X-GS-Bootstrap-Secret", "")
        if bootstrap and header_secret and hmac.compare_digest(header_secret.encode(), bootstrap.encode()):
            require_verified_orcid(request, req.orcid)
        else:
            require_editor_role(request, "editor_in_chief", "platform_admin")
    user = EditorialUser(
        user_id=req.user_id,
        orcid=req.orcid,
        name=req.name,
        email=req.email,
        roles=req.roles,
        expertise_areas=req.expertise_areas,
        institution=req.institution,
        h_index=req.h_index,
    )
    return editorial_engine.register_user(user)


@router.post("/api/v1/editorial/submit")
def submit_manuscript(request: Request, req: SubmitManuscriptRequest):
    """Подача рукописи"""
    require_verified_orcid(request, req.corresponding_author_orcid)
    submission = Submission(
        submission_id=str(uuid.uuid4()),
        title=req.title,
        abstract=req.abstract,
        authors=req.authors,
        corresponding_author_orcid=req.corresponding_author_orcid,
        category=req.category,
        keywords=req.keywords,
        funding_statement=req.funding_statement,
        data_availability=req.data_availability,
        conflict_of_interest=req.conflict_of_interest,
        ethical_approval=req.ethical_approval,
        author_contribution=req.author_contribution,
    )
    return editorial_engine.submit_manuscript(submission)


@router.post("/api/v1/editorial/assign-editor/{submission_id}/{editor_id}")
def assign_editor(request: Request, submission_id: str, editor_id: str):
    """Назначение редактора секции"""
    require_editor_role(request, "section_editor", "editor_in_chief", "platform_admin")
    return editorial_engine.assign_editor(submission_id, editor_id)


@router.get("/api/v1/editorial/find-reviewers/{submission_id}")
def find_reviewers(request: Request, submission_id: str, n: int = 3):
    """Поиск подходящих рецензентов"""
    require_editor_role(request, "section_editor", "editor_in_chief", "platform_admin")
    reviewers = editorial_engine.find_reviewers(submission_id, n)
    return {"reviewers": reviewers, "count": len(reviewers)}


@router.post("/api/v1/editorial/assign-reviewers/{submission_id}")
def assign_reviewers(request: Request, submission_id: str, req: AssignReviewersRequest):
    """Назначение рецензентов"""
    require_editor_role(request, "section_editor", "editor_in_chief", "platform_admin")
    return editorial_engine.assign_reviewers(submission_id, req.reviewer_orcids)


@router.post("/api/v1/editorial/submit-review/{review_id}")
def submit_review(request: Request, review_id: str, req: SubmitReviewRequest):
    """Подача рецензии"""
    require_verified_orcid(request, req.reviewer_orcid, require_oauth=True)
    review = PeerReview(
        review_id=review_id,
        submission_id="",  # Will be filled from existing review
        reviewer_orcid=req.reviewer_orcid,
        recommendation=req.recommendation,
        confidence_level=req.confidence_level,
        summary=req.summary,
        strengths=req.strengths,
        weaknesses=req.weaknesses,
        detailed_comments=req.detailed_comments,
        minor_comments=req.minor_comments,
        scores=req.scores,
        status="completed",
    )
    return editorial_engine.submit_review(review_id, review)


@router.post("/api/v1/editorial/decision/{submission_id}")
def make_editorial_decision(request: Request, submission_id: str, req: MakeDecisionRequest):
    """Принятие решения по manuscript"""
    require_verified_orcid(request, req.editor_orcid)
    require_editor_role(request, "editor_in_chief", "platform_admin")
    return editorial_engine.make_decision(
        submission_id=submission_id,
        editor_orcid=req.editor_orcid,
        decision=req.decision,
        rationale=req.rationale,
        editorial_comments=req.editorial_comments,
        required_changes=req.required_changes,
        deadline_days=req.deadline_days,
    )


@router.get("/api/v1/editorial/submission/{submission_id}")
def get_submission_details(request: Request, submission_id: str):
    """Детали submission (reviewer_orcid/detailed_comments скрыты от не-редакторов)"""
    payload = require_active_bearer(request)
    viewer_orcid = payload.get("orcid", "")
    is_editor = any(u.orcid == viewer_orcid and u.is_active for u in editorial_engine.users.values())
    details = editorial_engine.get_submission_details(submission_id, viewer_orcid=viewer_orcid, is_editor=is_editor)
    if not details:
        raise HTTPException(status_code=404, detail="Submission not found")
    return details


@router.get("/api/v1/editorial/dashboard/{user_orcid}")
def get_user_dashboard(request: Request, user_orcid: str):
    """Дашборд пользователя (submissions + reviews)"""
    require_verified_orcid(request, user_orcid)
    return editorial_engine.get_user_dashboard(user_orcid)


@router.post("/api/v1/editorial/doi/mint/{submission_id}")
def mint_doi(request: Request, submission_id: str):
    """Минт DOI через CrossRef"""
    require_editor_role(request, "editor_in_chief", "production", "platform_admin")
    submission = editorial_engine.submissions.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission.doi = doi_service.generate_doi(submission_id, submission.current_version)
    deposit = doi_service.prepare_deposit(submission)
    
    return {
        "status": "ok",
        "doi": submission.doi,
        "deposit": deposit,
        "message": "DOI prepared for CrossRef deposit"
    }


@router.get("/api/v1/editorial/export/jats/{submission_id}")
def export_jats_xml(request: Request, submission_id: str):
    """Экспорт в JATS XML"""
    require_active_bearer(request)
    submission = editorial_engine.submissions.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if not submission.doi:
        submission.doi = doi_service.generate_doi(submission_id, submission.current_version)
    
    xml_content = jats_exporter.export_submission(submission, submission.doi)
    
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={"Content-Disposition": f"attachment; filename={submission_id}.xml"}
    )


@router.get("/api/v1/editorial/letter/{submission_id}")
def get_decision_letter(request: Request, submission_id: str):
    """Получение письма с решением"""
    require_active_bearer(request)
    submission = editorial_engine.submissions.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if not submission.decision_letter:
        raise HTTPException(status_code=404, detail="No decision letter yet")
    
    return {
        "submission_id": submission_id,
        "decision": submission.decision,
        "letter": submission.decision_letter,
    }


@router.post("/api/v1/editorial/post-pub-comment/{submission_id}")
def add_post_pub_comment(request: Request, submission_id: str, req: PostPubCommentRequest):
    """Добавление публичного комментария после публикации"""
    require_verified_orcid(request, req.author_orcid)
    return editorial_engine.add_post_pub_comment(
        submission_id=submission_id,
        author_orcid=req.author_orcid,
        content=req.content,
        comment_type=req.comment_type,
        parent_comment_id=req.parent_comment_id,
    )


@router.get("/api/v1/editorial/post-pub-comments/{submission_id}")
def get_post_pub_comments(submission_id: str):
    """Получение публичных комментариев"""
    comments = editorial_engine.get_post_pub_reviews(submission_id)
    return {"submission_id": submission_id, "comments": comments}


@router.get("/api/v1/editorial/stats")
def get_editorial_stats():
    """Статистика editorial workflow"""
    submissions = editorial_engine.submissions
    reviews = editorial_engine.reviews
    
    status_counts = {}
    for sub in submissions.values():
        status_counts[sub.status] = status_counts.get(sub.status, 0) + 1
    
    review_status_counts = {}
    for review in reviews.values():
        review_status_counts[review.status] = review_status_counts.get(review.status, 0) + 1
    
    return {
        "total_submissions": len(submissions),
        "submissions_by_status": status_counts,
        "total_reviews": len(reviews),
        "reviews_by_status": review_status_counts,
        "published": len([s for s in submissions.values() if s.status == "published"]),
        "avg_reviews_per_manuscript": round(len(reviews) / max(1, len(submissions)), 1),
    }


# =====================================================================
# PLAGIARISM DETECTION API
# =====================================================================

class PlagiarismCheckRequest(BaseModel):
    reference_texts: List[Dict[str, str]]  # [{title, text}]

@router.post("/api/v1/editorial/plagiarism-check/{submission_id}")
def check_plagiarism(request: Request, submission_id: str, req: PlagiarismCheckRequest):
    """Проверка manuscript на плагиат"""
    require_editor_role(request, "section_editor", "editor_in_chief", "production", "platform_admin")
    return editorial_engine.check_plagiarism(submission_id, req.reference_texts)


# =====================================================================
# PREPRINT BRIDGE API
# =====================================================================

class PreprintImportRequest(BaseModel):
    identifier: str  # arXiv ID, DOI, or URL

@router.post("/api/v1/editorial/import-preprint/{submission_id}")
def import_preprint(request: Request, submission_id: str, req: PreprintImportRequest):
    """Импорт препринта (arXiv, DOI, bioRxiv)"""
    require_editor_role(request, "section_editor", "editor_in_chief", "production", "platform_admin")
    return editorial_engine.import_preprint(submission_id, req.identifier)


@router.get("/api/v1/editorial/resolve-identifier/{identifier}")
def resolve_identifier(identifier: str):
    """Разрешение идентификатора (arXiv/DOI) в метаданные"""
    from gitscience_editorial import PreprintBridge
    return PreprintBridge.resolve_identifier(identifier)


# =====================================================================
# REVISION WORKFLOW API
# =====================================================================

class CreateRevisionRequest(BaseModel):
    required_changes: List[str]
    editor_comments: str = ""
    reviewer_comments: str = ""
    deadline_days: int = 30

class SubmitRevisionRequest(BaseModel):
    response_to_reviewers: str = ""
    version_files: List[Dict[str, str]] = []

@router.post("/api/v1/editorial/revision/create/{submission_id}")
def create_revision(request: Request, submission_id: str, req: CreateRevisionRequest):
    """Создание запроса на правки"""
    require_editor_role(request, "section_editor", "editor_in_chief", "production", "platform_admin")
    submission = editorial_engine.submissions.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    revision = editorial_engine.revision_manager.create_revision_request(
        submission_id=submission_id,
        revision_number=submission.current_version,
        required_changes=req.required_changes,
        editor_comments=req.editor_comments,
        reviewer_comments=req.reviewer_comments,
        deadline_days=req.deadline_days,
    )
    
    # Send notification to author
    if submission.authors:
        author_email = submission.authors[0].get("email", "")
        if author_email:
            editorial_engine.email_service.send_notification(
                "revision_request",
                author_email,
                author_name=submission.authors[0].get("name", "Author"),
                manuscript_title=submission.title,
                deadline=revision.due_date,
                revision_number=revision.revision_number,
                required_changes="\n".join(f"- {c}" for c in req.required_changes),
                editor_name="Editor-in-Chief",
            )
    
    return {
        "status": "ok",
        "revision_id": revision.revision_id,
        "due_date": revision.due_date,
        "revision_number": revision.revision_number,
    }


@router.post("/api/v1/editorial/revision/submit/{revision_id}")
def submit_revision(request: Request, revision_id: str, req: SubmitRevisionRequest):
    """Автор загружает правки"""
    require_active_bearer(request)
    return editorial_engine.revision_manager.submit_revision(
        revision_id=revision_id,
        response_to_reviewers=req.response_to_reviewers,
        version_files=req.version_files,
    )


@router.get("/api/v1/editorial/revision/overdue")
def get_overdue_revisions(request: Request):
    """Просроченные правки"""
    require_editor_role(request, "section_editor", "editor_in_chief", "production", "platform_admin")
    return {"overdue": editorial_engine.revision_manager.check_overdue_revisions()}


@router.get("/api/v1/editorial/revision/reminders")
def get_pending_reminders(request: Request):
    """Напоминания для отправки"""
    require_editor_role(request, "section_editor", "editor_in_chief", "production", "platform_admin")
    return {"reminders": editorial_engine.revision_manager.get_pending_reminders()}


@router.get("/api/v1/editorial/revision/timeline/{submission_id}")
def get_revision_timeline(request: Request, submission_id: str):
    """Timeline правок для submission"""
    require_active_bearer(request)
    return {"timeline": editorial_engine.revision_manager.get_revision_timeline(submission_id)}


# =====================================================================
# EMAIL NOTIFICATIONS API
# =====================================================================

@router.get("/api/v1/editorial/emails/history")
def get_email_history(request: Request, limit: int = 50):
    """История отправленных писем"""
    require_editor_role(request, "editor_in_chief", "production", "platform_admin")
    return {"emails": editorial_engine.email_service.get_email_history(limit)}


# =====================================================================
# EDITORIAL TASKS API
# =====================================================================

class CreateTaskRequest(BaseModel):
    title: str
    description: str = ""
    task_type: str = "general"
    assigned_to: Optional[str] = None
    assigned_role: Optional[str] = None
    due_date: Optional[str] = None
    priority: str = "normal"
    depends_on: List[str] = []

@router.post("/api/v1/editorial/tasks/create/{submission_id}")
def create_task(request: Request, submission_id: str, req: CreateTaskRequest):
    """Создание editorial задачи"""
    require_editor_role(request, "section_editor", "editor_in_chief", "production", "platform_admin")
    task = editorial_engine.task_manager.create_task(
        submission_id=submission_id,
        title=req.title,
        description=req.description,
        task_type=req.task_type,
        assigned_to=req.assigned_to,
        assigned_role=req.assigned_role,
        due_date=req.due_date,
        priority=req.priority,
        depends_on=req.depends_on,
    )
    return {"status": "ok", "task_id": task.task_id}


@router.post("/api/v1/editorial/tasks/complete/{task_id}")
def complete_task(request: Request, task_id: str):
    """Завершение задачи"""
    require_active_bearer(request)
    return editorial_engine.task_manager.complete_task(task_id)


@router.get("/api/v1/editorial/tasks/{submission_id}")
def get_submission_tasks(request: Request, submission_id: str):
    """Задачи для submission"""
    require_active_bearer(request)
    return {"tasks": editorial_engine.task_manager.get_submission_tasks(submission_id)}


@router.get("/api/v1/editorial/tasks/overdue")
def get_overdue_tasks(request: Request):
    """Просроченные задачи"""
    require_editor_role(request, "editor_in_chief", "production", "platform_admin")
    return {"overdue": editorial_engine.task_manager.get_overdue_tasks()}


# =====================================================================
# VERSION HISTORY API
# =====================================================================

@router.get("/api/v1/editorial/versions/{submission_id}")
def get_version_history(request: Request, submission_id: str):
    """История версий"""
    require_active_bearer(request)
    return {"versions": editorial_engine.version_tracker.get_version_history(submission_id)}


@router.get("/api/v1/editorial/versions/{submission_id}/diff")
def get_version_diff(request: Request, submission_id: str, v1: int = 1, v2: int = 2):
    """Сравнение версий"""
    require_active_bearer(request)
    return editorial_engine.version_tracker.get_version_diff(submission_id, v1, v2)


# =====================================================================
# SUBMISSION CHECKLIST API
# =====================================================================

@router.get("/api/v1/editorial/checklist/{submission_id}")
def get_checklist(request: Request, submission_id: str):
    """Получение чеклиста"""
    require_active_bearer(request)
    return editorial_engine.checklist_manager.get_checklist(submission_id)


@router.post("/api/v1/editorial/checklist/{submission_id}/complete/{item_id}")
def complete_checklist_item(request: Request, submission_id: str, item_id: str):
    """Отметка выполнения пункта чеклиста"""
    require_editor_role(request, "section_editor", "editor_in_chief", "production", "platform_admin")
    return editorial_engine.checklist_manager.complete_item(submission_id, item_id)


# =====================================================================
# ANALYTICS DASHBOARD API
# =====================================================================

@router.get("/api/v1/editorial/analytics/dashboard")
def get_analytics_dashboard(request: Request):
    """Дашборд аналитики"""
    require_editor_role(request, "section_editor", "editor_in_chief", "production", "platform_admin")
    return editorial_engine.analytics.get_analytics_dashboard()


@router.get("/api/v1/editorial/analytics/pipeline")
def get_pipeline_view(request: Request):
    """Pipeline view — все submissions по статусам"""
    require_editor_role(request, "section_editor", "editor_in_chief", "production", "platform_admin")
    submissions = editorial_engine.submissions
    
    pipeline = {
        "draft": [],
        "submitted": [],
        "editorial_check": [],
        "under_review": [],
        "revision_requested": [],
        "accepted": [],
        "rejected": [],
        "published": [],
    }
    
    for sub in submissions.values():
        status = sub.status
        if status in pipeline:
            pipeline[status].append({
                "submission_id": sub.submission_id,
                "title": sub.title,
                "submitted_at": sub.submitted_at,
                "last_updated": sub.last_updated,
                "authors": [a.get("name", "") for a in sub.authors[:3]],
            })
    
    return {
        "pipeline": pipeline,
        "summary": {status: len(items) for status, items in pipeline.items()},
    }


# =====================================================================
# AI MANUSCRIPT SCREENING API
# =====================================================================

@router.get("/api/v1/editorial/ai-screen/{submission_id}")
def ai_screen_manuscript(request: Request, submission_id: str):
    """AI-powered предварительная проверка manuscript"""
    require_editor_role(request, "section_editor", "editor_in_chief", "platform_admin")
    submission = editorial_engine.submissions.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return editorial_engine.ai_screener.screen_manuscript(submission)


# =====================================================================
# CROSS-JOURNAL TRANSFER API
# =====================================================================

class TransferRequest(BaseModel):
    target_journal: str
    reason: str = ""

@router.post("/api/v1/editorial/transfer/{submission_id}")
def transfer_manuscript(request: Request, submission_id: str, req: TransferRequest):
    """Перенос manuscript в другой журнал"""
    require_editor_role(request, "editor_in_chief", "platform_admin")
    return editorial_engine.transfer_manuscript(submission_id, req.target_journal, req.reason)


@router.get("/api/v1/editorial/transfer/history/{submission_id}")
def get_transfer_history(request: Request, submission_id: str):
    """История переносов"""
    require_active_bearer(request)
    return {"transfers": editorial_engine.cross_journal_transfer.get_transfer_history(submission_id)}


# =====================================================================
# PREREGISTRATION API
# =====================================================================

class PreregistrationRequest(BaseModel):
    title: str
    hypothesis: str
    methods: str
    analysis_plan: str
    authors: List[Dict[str, str]] = []
    corresponding_author_orcid: str = ""

class AmendmentRequest(BaseModel):
    amendment_description: str
    changes: str

@router.post("/api/v1/editorial/preregistration/create")
def create_preregistration(request: Request, req: PreregistrationRequest):
    """Создание пререгистрации"""
    if req.corresponding_author_orcid:
        require_verified_orcid(request, req.corresponding_author_orcid)
    else:
        require_active_bearer(request)
    return editorial_engine.create_preregistration(
        title=req.title,
        hypothesis=req.hypothesis,
        methods=req.methods,
        analysis_plan=req.analysis_plan,
        authors=req.authors,
        corresponding_author_orcid=req.corresponding_author_orcid,
    )


@router.post("/api/v1/editorial/preregistration/register/{prereg_id}")
def register_preregistration(request: Request, prereg_id: str):
    """Регистрация пререгистрации (фиксация во времени)"""
    require_active_bearer(request)
    return editorial_engine.register_preregistration(prereg_id)


@router.get("/api/v1/editorial/preregistration/{prereg_id}")
def get_preregistration(prereg_id: str):
    """Получение пререгистрации"""
    prereg = editorial_engine.get_preregistration(prereg_id)
    if not prereg:
        raise HTTPException(status_code=404, detail="Preregistration not found")
    return prereg


@router.post("/api/v1/editorial/preregistration/{prereg_id}/amendment")
def add_preregistration_amendment(request: Request, prereg_id: str, req: AmendmentRequest):
    """Добавление поправки к пререгистрации"""
    require_active_bearer(request)
    return editorial_engine.prereg_manager.add_amendment(
        prereg_id=prereg_id,
        amendment_description=req.amendment_description,
        changes=req.changes,
    )


# =====================================================================
# GALLEY PRODUCTION API
# =====================================================================

@router.get("/api/v1/editorial/galley/{submission_id}")
def generate_galley(request: Request, submission_id: str, format: str = "jats"):
    """Генерация production-ready manuscript (JATS/HTML/PDF)"""
    require_editor_role(request, "production", "editor_in_chief", "platform_admin")
    return editorial_engine.generate_galley(submission_id, format)


# =====================================================================
# CLAIM GRAPH API
# =====================================================================

class ClaimRequest(BaseModel):
    statement: str
    claim_type: str = "contribution"
    evidence_refs: List[str] = []
    strength: str = "moderate"
    author_orcid: str = ""

class LinkClaimsRequest(BaseModel):
    claim_id_1: str
    claim_id_2: str
    relationship: str = "supports"

@router.post("/api/v1/editorial/claims/{submission_id}")
def add_claims(request: Request, submission_id: str, claims: List[ClaimRequest]):
    """Добавление claims к manuscript"""
    any_author_orcid = ""
    for c in claims:
        if c.author_orcid:
            any_author_orcid = c.author_orcid
            break
    if any_author_orcid:
        require_verified_orcid(request, any_author_orcid)
    else:
        require_active_bearer(request)
    return editorial_engine.add_manuscript_claims(
        submission_id,
        [c.model_dump() for c in claims],
    )


@router.get("/api/v1/editorial/claims/{submission_id}")
def get_claims(submission_id: str):
    """Получение claims manuscripts"""
    return editorial_engine.get_manuscript_claims(submission_id)


@router.post("/api/v1/editorial/claims/graph/link")
def link_claims(request: Request, req: LinkClaimsRequest):
    """Связь между claims"""
    require_active_bearer(request)
    return editorial_engine.claim_graph.link_claims(
        req.claim_id_1, req.claim_id_2, req.relationship
    )


@router.get("/api/v1/editorial/claims/graph/{submission_id}")
def get_claim_graph(submission_id: str):
    """Получение графа claims"""
    return editorial_engine.claim_graph.get_graph(submission_id)