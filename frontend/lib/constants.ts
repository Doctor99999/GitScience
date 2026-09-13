export const getApiBase = (): string => {
  if (typeof window !== "undefined") {
    const env = process.env.NEXT_PUBLIC_API_BASE?.trim();
    if (env) {
      if (
        env.startsWith("http://") ||
        env.startsWith("https://") ||
        env.startsWith("/")
      ) {
        return env;
      }
      return `https://${env}`;
    }
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://127.0.0.1:8000";
    }
    // Fail-closed: без явного NEXT_PUBLIC_API_BASE в production идём на относительный
    // /api (nginx reverse-proxy / Vercel Rewrite). Тихий fallback на боевой API убран.
    return "/api";
  }
  return "/api";
};

export const CREDIT_14_ROLES = [
  "Conceptualization",
  "Methodology",
  "Software",
  "Validation",
  "Formal Analysis",
  "Investigation",
  "Resources",
  "Data Curation",
  "Writing - Original Draft",
  "Writing - Review & Editing",
  "Visualization",
  "Supervision",
  "Project Administration",
  "Funding Acquisition",
];

export const IPC_CLASSES = [
  { code: "All", name_kz: "Барлық сыныптар", name_ru: "Все классы", name_en: "All Classes" },
  { code: "A61B", name_kz: "A61B: Диагностика & Онкохирургия", name_ru: "A61B: Диагностика & Онкохирургия", name_en: "A61B: Diagnostics & Surgery" },
  { code: "C12Q", name_kz: "C12Q: Молекулалық биология", name_ru: "C12Q: Молекулярная биология", name_en: "C12Q: Molecular Biology" },
  { code: "G16H", name_kz: "G16H: Медициналық информатика & AI", name_ru: "G16H: Медицинская информатика & AI", name_en: "G16H: Healthcare AI" },
  { code: "G06F", name_kz: "G06F: Алгоритмдер & AST", name_ru: "G06F: Алгоритмы & AST", name_en: "G06F: Algorithms & AST" },
];

export const DEFAULT_FOUNDER_PROFILE = {
  orcid: "0009-0003-3929-3605",
  name: "Salauat Abiltayevich Yeshimov",
  institution: "National Scientific Oncology Center",
  discipline: "Clinical Oncology & Surgery",
  email: "s.yeshimov@gitscience.org",
  git_impact_score: 184.0,
  platform_tier: "Protocol Architect & Surgical Oncologist",
};

// Контакты для фидбэка (низ футера, Apple-стиль)
export const CONTACTS = [
  {
    label: "Protocol & Feedback",
    email: "protocol@gitscience.org",
    icon: "forum",
  },
  {
    label: "Deposit & Finance",
    email: "deposit@gitscience.org",
    icon: "account_balance",
  },
  {
    label: "Founder",
    email: "s.yeshimov@gitscience.org",
    icon: "psychology",
  },
];

export const GITHUB_REPO_URL = "https://github.com/Doctor99999/GitScience";
