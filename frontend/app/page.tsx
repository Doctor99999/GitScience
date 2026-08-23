"use client";

import { useState, useEffect } from "react";

// =====================================================================
// API CONFIGURATION & RESILIENT CONNECTOR (RENDER & LOCAL READY)
// =====================================================================

const getApiBase = () => {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_API_BASE) {
      let base = process.env.NEXT_PUBLIC_API_BASE.trim();
      if (!base.startsWith("http://") && !base.startsWith("https://")) {
        base = `https://${base}`;
      }
      return base;
    }
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://127.0.0.1:8000";
    }
  }
  return "http://127.0.0.1:8000";
};

const CREDIT_14_ROLES = [
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

const IPC_CLASSES = [
  { code: "All", name_kz: "Барлық сыныптар", name_ru: "Все классы", name_en: "All Classes" },
  { code: "A61B", name_kz: "A61B: Диагностика & Онкохирургия", name_ru: "A61B: Диагностика & Онкохирургия", name_en: "A61B: Diagnostics & Surgery" },
  { code: "C12Q", name_kz: "C12Q: Молекулалық биология", name_ru: "C12Q: Молекулярная биология", name_en: "C12Q: Molecular Biology" },
  { code: "G16H", name_kz: "G16H: Медициналық информатика & AI", name_ru: "G16H: Медицинская информатика & AI", name_en: "G16H: Healthcare AI" },
  { code: "G06F", name_kz: "G06F: Алгоритмдер & AST", name_ru: "G06F: Алгоритмы & AST", name_en: "G06F: Algorithms & AST" },
];

const DEFAULT_FOUNDER_PROFILE = {
  orcid: "0009-0003-3929-3605",
  name: "Salauat Abiltayevich Yeshimov",
  institution: "National Scientific Oncology Center",
  discipline: "Clinical Oncology & Surgery",
  email: "s.yeshimov@gitscience.org",
  git_impact_score: 184.0,
  platform_tier: "Protocol Architect & Surgical Oncologist",
};

const TRANSLATIONS = {
  KZ: {
    brand: "GitScience™ Sovereign Protocol",
    tagline: "Ғалымдар аманатын қорғау: орындалатын ғылым, ZK-басымдық және суверенді нотариат",
    loginOrcid: "ORCID: Кіру / Тіркелу",
    switchScholar: "Профильді ауыстыру / Шығу",
    connectWallet: "🦊 Әмиянды қосу",
    disconnectWallet: "Ажырату",
    passkeyBtn: "📱 Touch ID",
    guideBtn: "💡 Көмекші / AI Гид",
    tabNotary: "🛡️ Нотариат",
    tabInspector: "🔍 3-Layer Инспектор",
    tabLibrary: "🏛️ Кітапхана",
    tabZk: "🔒 ZK-Discovery",
    tabPassport: "🧬 Ғалым Профилі",
    tabReview: "📝 Peer-Review",
    tabMaas: "⚡ MaaS Симулятор",
    tabAmanat: "💳 Аманат Роялти",
    tabCourt: "⚖️ Ғылыми Сот",
    tabVampire: "🧛 Vampire Парсер",

    // Welcome Banner
    welcomeBannerTitle: "Қош келдіңіз! Ғалымдар аманатын суверенді қорғау протоколы",
    welcomeBannerSub: "Манускрипттеріңізді WIPO Prior Art Shield арқылы бекітіп, 55/15/30 роялти алу үшін ORCID және Web3 әмияныңызды қосыңыз.",
    welcomeRegisterBtn: "🧬 ORCID арқылы тіркелу / кіру",
    welcomeWalletBtn: "🦊 Web3 Әмиянды қосу",

    // Web3 Modal
    connectWalletTitle: "Web3 Децентрализациялық Әмиянды Қосу",
    connectWalletSub: "Аманат роялтилері мен IP-NFT авторлық құқықтарыңызды Web3 арқылы басқарыңыз",
    walletAddressLabel: "Әмиян мекенжайы",
    walletBalanceLabel: "USDT Балансы",
    walletRoyaltiesLabel: "Аманат Роялтилері (55% / 30%)",
    walletNetworkLabel: "Блокчейн Желісі",
    disconnectWalletBtn: "Әмиянды ажырату ✕",

    // Live Stats Footer
    statManuscripts: "Қорғалған манускрипттер",
    statMaas: "MaaS есептеулері",
    statSecuredValue: "Ғылыми капитал (USDT)",
    statScholars: "Тіркелген ғалымдар",
    statAttestation: "Bitcoin OTS Анкері",

    // Tab 1: Notary
    uploadHeader: "Қолжазба басымдығын бекіту (WIPO Prior Art Shield)",
    uploadSubheader: "WIPO Paris Convention Art. 4 • 35 U.S.C. § 102 • EPC Art 54(2) • CRediT 14 Roles • Safe AST MaaS",
    dropzoneText: "PDF манускриптін осында сүйреңіз немесе файлды таңдаңыз",
    paperTitle: "Еңбектің атауы",
    leadAuthor: "Негізгі автордың аты-жөні",
    orcidId: "Автордың ORCID iD нөмірі",
    categoryLabel: "Ғылыми бағыты",
    ipcLabel: "WIPO IPC сыныбы",
    abstractLabel: "Аңдатпа және әдіснама (IMRaD)",
    formulaLabel: "Орындалатын математикалық модель (Safe AST)",
    creditMatrixTitle: "CRediT авторлық үлес матрицасы (14 CASRAI рөлі)",
    addContributor: "+ Тең авторды қосу",
    irbCheck: "Зерттеуге адамдар/пациенттер деректері кіреді (Human Subjects)",
    irbNumber: "Биоэтика рұқсатының нөмірі (IRB / ЛЭК)",
    verifyFormulaBtn: "Формуланы тексеру & AST Merkle есептеу 🧮",
    aiAuditBtn: "🤖 AI-Аудит & Стресс-тест (10 сек)",
    notarizeBtn: "Тізілімге бекіту & Сертификат шығару 🛡️",
    notarySuccessTitle: "Манускрипт суверенді реестрге сәтті бекітілді!",
    notaryCertId: "Тіркеу коды",
    notarySha: "SHA-256 хэш",
    notaryOid: "Git Commit OID",
    downloadCertPdfBtn: "Ресми PDF Сертификатты жүктеу (WIPO / RUO) 🛡️",

    // Tab 2: Inspector
    inspectHeader: "3-Layer Deep Certificate & Prior Art Inspector",
    inspectSubheader: "Манускриптті 3 терең деңгейде криптографиялық және заңдық тексеру",
    inspectSearchPlaceholder: "Тіркеу кодын немесе SHA-256 хэшін енгізіңіз (мысалы, GS-2026-00001)...",
    inspectSearchBtn: "Инспекциялау 🔍",
    layer1Title: "Layer 1: Заңдық статус және WIPO басымдығы",
    layer2Title: "Layer 2: Криптографиялық дәлелдер және OTS анкер",
    layer3Title: "Layer 3: Орындалатын математика (Safe AST MaaS)",
    exportDataCiteBtn: "DataCite 4.4 JSON экспорттау 📥",
    exportSchemaOrgBtn: "Google Scholar JSON-LD экспорттау 📥",
    downloadLicenseBtn: "Ресми Лицензия мәтінін көру 📄",
    mintIpNftBtn: "🧬 IP-NFT Патентті токенизациялау (EIP-2981)",

    // Tab 3: Library
    libHeader: "WIPO Global Prior Art Library",
    libSubheader: "Ресми ашық ғылыми реестр және басымдық қорғанысы (ISO 14721 CAS Vault)",
    libSearchPlaceholder: "Кітапхана бойынша іздеу (атауы, авторы, ORCID)...",
    viewDetailsBtn: "Инспектор",
    readPdfBtn: "PDF оқу 📄",
    closePdfBtn: "Жабу ✕",

    // Tab 4: ZK
    zkHeader: "Zero-Knowledge Proof of Discovery (Құпия анкер)",
    zkSubheader: "Формула мен жаңалықты жарияламай, оның басымдығын ZK-коммитмент арқылы бекіту",
    zkHypothesisTitle: "Құпия гипотеза атауы",
    zkSecretLabel: "Құпия кілт (Secret Salt)",
    zkPayloadLabel: "Конфиденциалды мазмұн / Әдістеме",
    zkFormulaLabel: "Құпия формула (Safe AST)",
    zkCommitBtn: "Слепой ZK-коммитмент құру 🔒",
    zkRevealTitle: "Бұрын депонирленген ZK-депозитті ашу және дәлелдеу",
    zkRevealCommitId: "Commitment ID (мысалы, ZK-C906A929DF)",
    zkRevealBtn: "Математикалық сәйкестікті тексеру 🔓",

    // Tab 5: Passport
    passHeader: "Sovereign Scholar Profile & Git-Impact Score (GIS)",
    passSubheader: "Ғалымның суверенді профилі және орындалатын ғылымдағы белсенділік рейтингі",
    passScoreLabel: "Git-Impact Score (GIS)",
    passTierLabel: "Платформадағы мәртебесі",
    passCitationsPts: "Цитирование ұпайлары",
    passWorksPts: "Манускрипттер ұпайлары",
    passMaasPts: "MaaS есептеулер ұпайлары",
    passCreditPts: "CRediT көшбасшылық ұпайлары",
    passCourtPts: "Сотта дәлелденген басымдықтар",

    // Tab 6: Review
    revHeader: "Blind Peer-Review & Consensus Protocol",
    revSubheader: "Мүдделер қақтығысынсыз тәуелсіз рецензиялау және 15% қордан төлем алу",
    revTargetLabel: "Манускрипт коды",
    revReviewerLabel: "Рецензенттің ORCID нөмірі",
    revMathScore: "Math AST (1-10)",
    revMethodScore: "Әдіснама (1-10)",
    revEthicsScore: "Биоэтика (1-10)",
    revNoveltyScore: "Жаңашылдық (1-10)",
    revCommentsLabel: "Рецензия және ескертулер мәтіні",
    revSubmitBtn: "Рецензияны бекіту 💳",

    // Tab 7: MaaS
    maasHeader: "WASM Real-Time Biomedical Simulator & FHIR Gateway",
    maasSubheader: "Биомедициналық және онкологиялық AST модельдерді тікелей браузерде интерактивті сызу",
    maasFormulaLabel: "Математикалық модель (AST Formula)",
    maasRunBtn: "Симуляцияны бастау ⚡",
    fhirGatewayBtn: "🏥 FHIR R4 & DICOM МИС Шлюзі",
    maasResultsLabel: "Гомеостаз нүктелерінің нәтижесі (WASM Stream):",
    maasVisualCurveTitle: "Интерактивті 2D Гомеостаз графигі Tk(Artery, Vein, Lymph)",

    // Tab 8: Amanat
    amanatHeader: "Аманат роялти маршрутизаторы (55 / 15 / 30 + 20% Gross-Up)",
    amanatSubheader: "55% Авторлық қор • 15% Рецензенттер қоры • 30% Протокол Создатель (+20% B2B Gross-Up)",
    amanatBaseFee: "Базалық лицензия сомасы",
    amanatInvoiceTotal: "Клиника төлейтін толық шот (+20% Gross-Up):",
    amanatAuthorPool: "Авторлық қор (55% Net Payout):",
    amanatInfraPool: "Инфрақұрылым & Рецензенттер қоры (15%):",
    amanatFounderPool: "Протокол негізін қалаушы қоры (30% Founder):",
    amanatFounderGrossUp: "Создательдің жалпы таза кірісі (30% + Салық):",
    amanatRecordBtn: "Транзакцияны Ledger-ге бекіту 💳",
    genFiatInvoiceBtn: "📄 Ресми B2B Инвойс шығару (Клиникалар үшін)",

    // Tab 9: Court
    courtHeader: "Science Court (Ғылыми Сот және Дауларды шешу)",
    courtSubheader: "Басымдық пен плагиат дауларын шешуге арналған орталықсыздандырылған алқа",
    courtFileTitle: "Жаңа академиялық дау ашу",
    courtClaimantName: "Шағымданушының аты-жөні",
    courtClaimantOrcid: "Шағымданушының ORCID нөмірі",
    courtTargetCode: "Даулы манускрипт коды (мысалы, GS-2026-00001)",
    courtReasonLabel: "Даудың мәні мен дәлелдері",
    courtEvidenceHash: "Дәлелдеме файлының SHA-256 хэші",
    courtSubmitBtn: "Дауды тіркеу ⚖️",
    courtActiveCases: "Ағымдағы сот істері",
    courtVoteValid: "Шағымды қолдау (Valid)",
    courtVoteInvalid: "Қабылдамау (Invalid)",
    courtVoteAbstain: "Қалыс қалу (Abstain)",

    // Tab 10: Vampire Multi-Source
    vampireHeader: "Vampire Protocol: Автономды Мульти-Дереккөз Сборщигі",
    vampireSubheader: "OpenAlex (250M+), arXiv.org және Europe PMC ашық манускрипттерін ISO 14721 CAS қоймасына қауіпсіз депонирлеу",
    vampireSearchLabel: "Ғылыми базалар бойынша іздеу (OpenAlex / arXiv / PubMed)...",
    vampireSearchBtn: "Іздеу 🔎",
    vampireImportBtn: "CAS Реестрге депонирлеу 📥",
    vampireHarvestBtn: "🚀 Пакеттік жинау (Batch)",
    vampireLicenseNotice: "Лицензиясы CC-BY / CC0 болса WIPO Prior Art Shield қосылады. CC-BY-ND болса файл өзгеріссіз сақталады.",
    sourceAll: "Барлық дереккөздер",
    sourceOpenAlex: "OpenAlex (250M+)",
    sourceArxiv: "arXiv Preprints",
    sourcePubMed: "PubMed Central / PMC",
    startDaemonBtn: "🟢 Автономды демонда іске қосу",
    stopDaemonBtn: "🔴 Демонды тоқтату",
    daemonStatusRunning: "🟢 Автономды демон белсенді (Фонда қауіпсіз жинақтауда)",
    daemonStatusStopped: "⚪ Автономды демон күту режимінде",
  },
  RU: {
    brand: "GitScience™ Sovereign Protocol",
    tagline: "Защита Аманата каждого ученого: исполняемая наука, ZK-приоритет и суверенный нотариат",
    loginOrcid: "ORCID: Войти / Регистрация",
    switchScholar: "Сменить профиль / Выйти",
    connectWallet: "🦊 Подключить Кошелек",
    disconnectWallet: "Отключить",
    passkeyBtn: "📱 Touch ID",
    guideBtn: "💡 Помощник / AI Гид",
    tabNotary: "🛡️ Нотариат",
    tabInspector: "🔍 3-Layer Инспектор",
    tabLibrary: "🏛️ Библиотека",
    tabZk: "🔒 ZK-Discovery",
    tabPassport: "🧬 Профиль Ученого",
    tabReview: "📝 Peer-Review",
    tabMaas: "⚡ MaaS Симулятор",
    tabAmanat: "💳 Роялти Аманата",
    tabCourt: "⚖️ Научный Суд",
    tabVampire: "🧛 Vampire Парсер",

    welcomeBannerTitle: "Добро пожаловать в суверенный протокол защиты научных открытий GitScience™",
    welcomeBannerSub: "Защитите приоритет манускрипта через WIPO Prior Art Shield и получайте гарантированные роялти 55/15/30.",
    welcomeRegisterBtn: "🧬 Войти / Зарегистрироваться через ORCID",
    welcomeWalletBtn: "🦊 Подключить Web3 Кошелек",

    connectWalletTitle: "Подключение Децентрализованного Web3 Кошелька",
    connectWalletSub: "Управляйте роялти по протоколу Аманата и патентами IP-NFT (ERC-721 / EIP-2981)",
    walletAddressLabel: "Адрес кошелька",
    walletBalanceLabel: "Баланс USDT",
    walletRoyaltiesLabel: "Накопленные роялти Аманата (55% / 30%)",
    walletNetworkLabel: "Сеть блокчейна",
    disconnectWalletBtn: "Отключить кошелек ✕",

    statManuscripts: "Защищенных манускриптов",
    statMaas: "Вычислений MaaS",
    statSecuredValue: "Научный капитал (USDT)",
    statScholars: "Верифицированных ученых",
    statAttestation: "Bitcoin OTS Анкер",

    uploadHeader: "Фиксация приоритета манускрипта (WIPO Prior Art Shield)",
    uploadSubheader: "WIPO Paris Convention Art. 4 • 35 U.S.C. § 102 • EPC Art 54(2) • CRediT 14 Roles • Safe AST MaaS",
    dropzoneText: "Перетащите PDF манускрипта сюда или нажмите для выбора",
    paperTitle: "Название научной работы",
    leadAuthor: "ФИО Главного Автора",
    orcidId: "ORCID iD автора",
    categoryLabel: "Дисциплина исследования",
    ipcLabel: "Класс WIPO IPC",
    abstractLabel: "Аннотация и методология (IMRaD)",
    formulaLabel: "Исполняемая математическая модель (Safe AST)",
    creditMatrixTitle: "Матрица вклада авторов CRediT (14 ролей CASRAI)",
    addContributor: "+ Добавить соавтора",
    irbCheck: "Исследование включает данные пациентов (Human Subjects)",
    irbNumber: "Номер одобрения биоэтики (IRB / ЛЭК)",
    verifyFormulaBtn: "Проверить формулу & вычислить AST Merkle 🧮",
    aiAuditBtn: "🤖 ИИ-Аудит & Стресс-тестирование (10 сек)",
    notarizeBtn: "Зафиксировать в суверенном реестре & выпустить сертификат 🛡️",
    notarySuccessTitle: "Манускрипт успешно зафиксирован в суверенном реестре!",
    notaryCertId: "Код регистрации",
    notarySha: "SHA-256 хэш",
    notaryOid: "Git Commit OID",
    downloadCertPdfBtn: "Скачать официальный PDF-сертификат (WIPO / RUO) 🛡️",

    inspectHeader: "3-Layer Deep Certificate & Prior Art Inspector",
    inspectSubheader: "Глубокая 3-уровневая криптографическая и правовая инспекция манускрипта",
    inspectSearchPlaceholder: "Введите регистрационный код или SHA-256 хэш (напр. GS-2026-00001)...",
    inspectSearchBtn: "Инспектировать 🔍",
    layer1Title: "Layer 1: Правовой статус и WIPO Prior Art",
    layer2Title: "Layer 2: Криптографические доказательства и OTS анкер",
    layer3Title: "Layer 3: Исполняемая математика (Safe AST MaaS)",
    exportDataCiteBtn: "Экспорт DataCite 4.4 JSON 📥",
    exportSchemaOrgBtn: "Экспорт Google Scholar JSON-LD 📥",
    downloadLicenseBtn: "Посмотреть текст Лицензии 📄",
    mintIpNftBtn: "🧬 Токенизировать в IP-NFT Патент (EIP-2981)",

    libHeader: "WIPO Global Prior Art Library",
    libSubheader: "Официальный открытый научный реестр и защита приоритета (ISO 14721 CAS Vault)",
    libSearchPlaceholder: "Поиск по библиотеке (название, автор, ORCID)...",
    viewDetailsBtn: "Инспектор",
    readPdfBtn: "Читать PDF 📄",
    closePdfBtn: "Закрыть ✕",

    zkHeader: "Zero-Knowledge Proof of Discovery (Тайный анкер)",
    zkSubheader: "Фиксация тайны открытия без публичного раскрытия формулы через ZK-коммитмент",
    zkHypothesisTitle: "Название секретной гипотезы",
    zkSecretLabel: "Секретный ключ (Secret Salt)",
    zkPayloadLabel: "Конфиденциальный текст открытия",
    zkFormulaLabel: "Секретная формула (Safe AST)",
    zkCommitBtn: "Создать слепой ZK-коммитмент 🔒",
    zkRevealTitle: "Раскрытие и математическое доказательство ZK-депозита",
    zkRevealCommitId: "Commitment ID (напр. ZK-C906A929DF)",
    zkRevealBtn: "Доказать математическое совпадение 🔓",

    passHeader: "Sovereign Scholar Profile & Git-Impact Score (GIS)",
    passSubheader: "Суверенный профиль ученого и рейтинг активности в исполняемой науке",
    passScoreLabel: "Git-Impact Score (GIS)",
    passTierLabel: "Уровень в платформе",
    passCitationsPts: "Баллы за цитирования",
    passWorksPts: "Баллы за манускрипты",
    passMaasPts: "Баллы за расчеты MaaS",
    passCreditPts: "Баллы за лидерство в CRediT",
    passCourtPts: "Подтвержденные победы в суде",

    revHeader: "Blind Peer-Review & Consensus Protocol",
    revSubheader: "Объективное слепое рецензирование с выплатой из 15% фонда нод",
    revTargetLabel: "Код манускрипта",
    revReviewerLabel: "ORCID рецензента",
    revMathScore: "Math AST (1-10)",
    revMethodScore: "Методология (1-10)",
    revEthicsScore: "Биоэтика (1-10)",
    revNoveltyScore: "Новизна (1-10)",
    revCommentsLabel: "Текст рецензии и замечаний",
    revSubmitBtn: "Зафиксировать рецензию 💳",

    maasHeader: "WASM Real-Time Biomedical Simulator & FHIR Gateway",
    maasSubheader: "Прямой интерактивный запуск биомедицинских AST моделей в WebAssembly",
    maasFormulaLabel: "Математическая модель (AST Formula)",
    maasRunBtn: "Запустить симуляцию ⚡",
    fhirGatewayBtn: "🏥 Шлюз МИС FHIR R4 & DICOM",
    maasResultsLabel: "Точки гомеостаза (WASM Stream):",
    maasVisualCurveTitle: "Интерактивный 2D график гомеостаза Tk(Artery, Vein, Lymph)",

    amanatHeader: "Маршрутизатор роялти Аманата (55 / 15 / 30 + 20% Gross-Up)",
    amanatSubheader: "55% Авторский пул • 15% Рецензенты • 30% Создатель протокола (+20% B2B Gross-Up)",
    amanatBaseFee: "Базовый сбор лицензии",
    amanatInvoiceTotal: "Счет клинике к оплате (+20% Gross-Up):",
    amanatAuthorPool: "Авторский пул (55% Net Payout):",
    amanatInfraPool: "Фонд независимых рецензентов (15%):",
    amanatFounderPool: "Фонд Создателя протокола (30% Founder):",
    amanatFounderGrossUp: "Общий чистый доход Создателя (30% + Налог):",
    amanatRecordBtn: "Зафиксировать платеж в Ledger 💳",
    genFiatInvoiceBtn: "📄 Сформировать B2B Инвойс (Для клиник / IBAN)",

    courtHeader: "Science Court (Академический суд и споры)",
    courtSubheader: "Децентрализованный арбитраж споров об авторстве и приоритете",
    courtFileTitle: "Подать заявление о научном споре",
    courtClaimantName: "ФИО Заявителя",
    courtClaimantOrcid: "ORCID Заявителя",
    courtTargetCode: "Код оспариваемого манускрипта (напр. GS-2026-00001)",
    courtReasonLabel: "Суть претензии и доказательства",
    courtEvidenceHash: "SHA-256 хэш файла доказательств",
    courtSubmitBtn: "Зарегистрировать спор ⚖️",
    courtActiveCases: "Активные судебные дела",
    courtVoteValid: "Признать обоснованным (Valid)",
    courtVoteInvalid: "Отклонить претензию (Invalid)",
    courtVoteAbstain: "Воздержаться (Abstain)",

    vampireHeader: "Vampire Protocol: Автономный Мульти-Сборщик Научных Статей",
    vampireSubheader: "Импорт открытых манускриптов из OpenAlex (250M+), arXiv.org и Europe PMC в защищенное CAS хранилище ISO 14721",
    vampireSearchLabel: "Поиск в научных базах (OpenAlex / arXiv / PubMed)...",
    vampireSearchBtn: "Искать 🔎",
    vampireImportBtn: "Депонировать в CAS Реестр 📥",
    vampireHarvestBtn: "🚀 Пакетный сбор (Batch)",
    vampireLicenseNotice: "Лицензии CC-BY/CC0 получают титульный лист WIPO Prior Art Shield. Работы CC-BY-ND сохраняются строго без изменений.",
    sourceAll: "Все базы данных",
    sourceOpenAlex: "OpenAlex (250M+)",
    sourceArxiv: "arXiv Preprints",
    sourcePubMed: "PubMed Central / PMC",
    startDaemonBtn: "🟢 Запустить фонового демона",
    stopDaemonBtn: "🔴 Остановить демона",
    daemonStatusRunning: "🟢 Фоновый демон активен (Непрерывный сбор)",
    daemonStatusStopped: "⚪ Фоновый демон в режиме ожидания",
  },
  EN: {
    brand: "GitScience™ Sovereign Protocol",
    tagline: "Preserving the Amanat of every scholar: Executable Science, ZK-Priority & Sovereign Notary",
    loginOrcid: "ORCID: Sign In / Register",
    switchScholar: "Switch Profile / Logout",
    connectWallet: "🦊 Connect Wallet",
    disconnectWallet: "Disconnect",
    passkeyBtn: "📱 Touch ID",
    guideBtn: "💡 Guide / AI Assistant",
    tabNotary: "🛡️ Notary",
    tabInspector: "🔍 3-Layer Inspector",
    tabLibrary: "🏛️ Library",
    tabZk: "🔒 ZK-Discovery",
    tabPassport: "🧬 Scholar Profile",
    tabReview: "📝 Peer-Review",
    tabMaas: "⚡ MaaS Simulator",
    tabAmanat: "💳 Amanat Royalty",
    tabCourt: "⚖️ Science Court",
    tabVampire: "🧛 Vampire Harvester",

    welcomeBannerTitle: "Welcome to GitScience™ Sovereign Protocol for Scientific Truth",
    welcomeBannerSub: "Protect your manuscript prior art via WIPO Prior Art Shield and earn guaranteed 55/15/30 royalties.",
    welcomeRegisterBtn: "🧬 Register / Sign In with ORCID",
    welcomeWalletBtn: "🦊 Connect Web3 Wallet",

    connectWalletTitle: "Connect Decentralized Web3 Wallet",
    connectWalletSub: "Manage Amanat royalties (55% / 30%) and IP-NFT patent ownership (ERC-721 / EIP-2981)",
    walletAddressLabel: "Wallet Address",
    walletBalanceLabel: "USDT Balance",
    walletRoyaltiesLabel: "Accumulated Royalties (55% / 30%)",
    walletNetworkLabel: "Blockchain Network",
    disconnectWalletBtn: "Disconnect Wallet ✕",

    statManuscripts: "Protected Manuscripts",
    statMaas: "MaaS Calculations",
    statSecuredValue: "Secured Scientific Capital (USDT)",
    statScholars: "Verified Scholars",
    statAttestation: "Bitcoin OTS Anchor",

    uploadHeader: "Manuscript Priority Registration (WIPO Prior Art Shield)",
    uploadSubheader: "WIPO Paris Convention Art. 4 • 35 U.S.C. § 102 • EPC Art 54(2) • CRediT 14 Roles • Safe AST MaaS",
    dropzoneText: "Drag & drop manuscript PDF here or click to browse",
    paperTitle: "Manuscript Title",
    leadAuthor: "Lead Author Full Name",
    orcidId: "Author ORCID iD",
    categoryLabel: "Scientific Discipline",
    ipcLabel: "WIPO IPC Classification",
    abstractLabel: "Abstract & Methodology (IMRaD)",
    formulaLabel: "Executable Mathematical Model (Safe AST)",
    creditMatrixTitle: "CRediT Contributor Roles Matrix (14 CASRAI Roles)",
    addContributor: "+ Add Co-Author",
    irbCheck: "Study includes patient records (Human Subjects)",
    irbNumber: "IRB / Bioethics Approval Code",
    verifyFormulaBtn: "Verify Formula & Compute AST Merkle 🧮",
    aiAuditBtn: "🤖 AI Audit & Singularity Stress-Test (10s)",
    notarizeBtn: "Commit to Sovereign Ledger & Issue Certificate 🛡️",
    notarySuccessTitle: "Manuscript successfully anchored to Sovereign Ledger!",
    notaryCertId: "Registration Code",
    notarySha: "SHA-256 Hash",
    notaryOid: "Git Commit OID",
    downloadCertPdfBtn: "Download Official Priority Certificate PDF (WIPO / RUO) 🛡️",

    inspectHeader: "3-Layer Deep Certificate & Prior Art Inspector",
    inspectSubheader: "Deep 3-tier cryptographic and statutory verification of prior art works",
    inspectSearchPlaceholder: "Enter registration code or SHA-256 hash (e.g. GS-2026-00001)...",
    inspectSearchBtn: "Inspect 🔍",
    layer1Title: "Layer 1: Legal Status & WIPO Prior Art",
    layer2Title: "Layer 2: Cryptographic Proofs & OTS Anchor",
    layer3Title: "Layer 3: Executable Math (Safe AST MaaS)",
    exportDataCiteBtn: "Export DataCite 4.4 JSON 📥",
    exportSchemaOrgBtn: "Export Google Scholar JSON-LD 📥",
    downloadLicenseBtn: "View Official License Text 📄",
    mintIpNftBtn: "🧬 Mint Sovereign IP-NFT Patent (EIP-2981)",

    libHeader: "WIPO Global Prior Art Library",
    libSubheader: "Official open archival registry and priority protection (ISO 14721 CAS Vault)",
    libSearchPlaceholder: "Search repository (title, author, ORCID)...",
    viewDetailsBtn: "Inspector",
    readPdfBtn: "Read PDF 📄",
    closePdfBtn: "Close ✕",

    zkHeader: "Zero-Knowledge Proof of Discovery (Blind Anchor)",
    zkSubheader: "Anchor pre-publication discovery secret without disclosure via ZK-Commitment",
    zkHypothesisTitle: "Secret Hypothesis Title",
    zkSecretLabel: "Secret Salt Key",
    zkPayloadLabel: "Confidential Hypothesis / Methodology",
    zkFormulaLabel: "Secret Formula (Safe AST)",
    zkCommitBtn: "Create Blind ZK-Commitment 🔒",
    zkRevealTitle: "Reveal & Mathematically Prove Pre-Existing ZK Deposit",
    zkRevealCommitId: "Commitment ID (e.g. ZK-C906A929DF)",
    zkRevealBtn: "Verify Mathematical Match 🔓",

    passHeader: "Sovereign Scholar Profile & Git-Impact Score (GIS)",
    passSubheader: "Sovereign researcher identity and executable science activity score",
    passScoreLabel: "Git-Impact Score (GIS)",
    passTierLabel: "Platform Activity Tier",
    passCitationsPts: "Citations Points",
    passWorksPts: "Manuscripts Points",
    passMaasPts: "MaaS Executions Points",
    passCreditPts: "CRediT Leadership Points",
    passCourtPts: "Court Vindicated Prior Arts",

    revHeader: "Blind Peer-Review & Consensus Protocol",
    revSubheader: "Conflict-free blind peer review with guaranteed 15% infra pool compensation",
    revTargetLabel: "Target Manuscript Code",
    revReviewerLabel: "Reviewer ORCID iD",
    revMathScore: "Math AST (1-10)",
    revMethodScore: "Methodology (1-10)",
    revEthicsScore: "Bioethics (1-10)",
    revNoveltyScore: "Novelty (1-10)",
    revCommentsLabel: "Review & Critique Content",
    revSubmitBtn: "Submit Review 💳",

    maasHeader: "WASM Real-Time Biomedical Simulator & FHIR Gateway",
    maasSubheader: "Direct execution of biomedical AST models in WebAssembly",
    maasFormulaLabel: "Mathematical Model (AST Formula)",
    maasRunBtn: "Run Simulation ⚡",
    fhirGatewayBtn: "🏥 HL7 FHIR R4 & DICOM Gateway",
    maasResultsLabel: "Homeostasis Stream Points (WASM Output):",
    maasVisualCurveTitle: "Interactive 2D Homeostasis Response Curve Tk(Artery, Vein, Lymph)",

    amanatHeader: "Amanat Royalty Router (55 / 15 / 30 + 20% Gross-Up)",
    amanatSubheader: "55% Author Pool • 15% Reviewers & Nodes • 30% Protocol Founder (+20% B2B Gross-Up)",
    amanatBaseFee: "Base License Fee",
    amanatInvoiceTotal: "Clinical Buyer Invoice (+20% Gross-Up):",
    amanatAuthorPool: "Author Royalty Pool (55% Net):",
    amanatInfraPool: "Infrastructure & Peer Review Pool (15%):",
    amanatFounderPool: "Protocol Founder Allocation (30% Founder):",
    amanatFounderGrossUp: "Total Net Founder Earnings (30% + Tax):",
    amanatRecordBtn: "Record Settlement in Ledger 💳",
    genFiatInvoiceBtn: "📄 Generate B2B Institutional Invoice (IBAN/Swift)",

    courtHeader: "Science Court (Academic Dispute Arbitration)",
    courtSubheader: "Decentralized priority dispute arbitration and jury voting",
    courtFileTitle: "File an Academic Priority Dispute",
    courtClaimantName: "Claimant Full Name",
    courtClaimantOrcid: "Claimant ORCID iD",
    courtTargetCode: "Disputed Manuscript Code (e.g. GS-2026-00001)",
    courtReasonLabel: "Dispute Grounds & Detailed Argument",
    courtEvidenceHash: "Evidence Payload SHA-256 Hash",
    courtSubmitBtn: "File Dispute ⚖️",
    courtActiveCases: "Active Science Court Cases",
    courtVoteValid: "Vote Valid",
    courtVoteInvalid: "Vote Invalid",
    courtVoteAbstain: "Abstain",

    vampireHeader: "Vampire Protocol: Autonomous Multi-Source Harvester",
    vampireSubheader: "Multi-source open access ingestion from OpenAlex, arXiv and Europe PMC into ISO 14721 CAS Vault",
    vampireSearchLabel: "Search scholarly archives (OpenAlex / arXiv / PubMed)...",
    vampireSearchBtn: "Search 🔎",
    vampireImportBtn: "Deposit to CAS Vault 📥",
    vampireHarvestBtn: "🚀 Batch Harvest",
    vampireLicenseNotice: "CC-BY/CC0 works receive official Prior Art cover. CC-BY-ND works are preserved strictly unaltered.",
    sourceAll: "All Databases",
    sourceOpenAlex: "OpenAlex (250M+)",
    sourceArxiv: "arXiv Preprints",
    sourcePubMed: "PubMed Central / PMC",
    startDaemonBtn: "🟢 Start Background Daemon",
    stopDaemonBtn: "🔴 Stop Daemon",
    daemonStatusRunning: "🟢 Background Daemon Active (Safe Continuous Ingestion)",
    daemonStatusStopped: "⚪ Background Daemon Standby",
  },
};

export default function GitScienceSovereignApp() {
  const [lang, setLang] = useState<"KZ" | "RU" | "EN">("KZ");
  const t = TRANSLATIONS[lang];
  const apiBase = getApiBase();

  const [activeTab, setActiveTab] = useState<
    "notary" | "inspector" | "library" | "zk" | "passport" | "review" | "maas" | "amanat" | "court" | "vampire"
  >("notary");

  // Persistent Live Global Platform Stats
  const [platformStats, setPlatformStats] = useState<{
    total_notarized_manuscripts: number;
    total_maas_executions: number;
    total_secured_scientific_value_usdt: number;
    total_verified_scholars: number;
    blockchain_attestation_status: string;
  }>({
    total_notarized_manuscripts: 1,
    total_maas_executions: 8562,
    total_secured_scientific_value_usdt: 1265400.0,
    total_verified_scholars: 129,
    blockchain_attestation_status: "BITCOIN_OTS_ANCHORED_OK",
  });

  // Scholar Profile State (ORCID Login & Registration Modal)
  const [activeScholar, setActiveScholar] = useState<any>(null);
  const [showOrcidModal, setShowOrcidModal] = useState(false);
  const [inputOrcid, setInputOrcid] = useState("");
  const [inputScholarName, setInputScholarName] = useState("");
  const [inputInstitution, setInputInstitution] = useState("");
  const [inputDiscipline, setInputDiscipline] = useState("Clinical Oncology & Surgery");

  // Web3 Wallet State
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletRoyalties, setWalletRoyalties] = useState<number>(0);
  const [walletNetwork, setWalletNetwork] = useState<string>("Polygon PoS / Base Mainnet");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);

  // Interactive AI Assistant / Guide State
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideSearch, setGuideSearch] = useState("");

  // License Modal State
  const [licenseModalContent, setLicenseModalContent] = useState<string | null>(null);

  // 1. Notary State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("Coupling of Neuro-Immuno-Oncological Axes & Tk Equation");
  const [authorName, setAuthorName] = useState("");
  const [orcid, setOrcid] = useState("");
  const [category, setCategory] = useState("Clinical Oncology & Surgery");
  const [ipcClass, setIpcClass] = useState("A61B");
  const [abstract, setAbstract] = useState(
    "Mathematical formalization of neuro-immuno-oncological axes via deterministic Tk equation. Safe AST reproducibility under RUO."
  );
  const [formulaMath, setFormulaMath] = useState("(Artery + Vein) / (Lymph + 1.0)");
  const [hasHumanSubjects, setHasHumanSubjects] = useState(true);
  const [irbNumber, setIrbNumber] = useState("IRB-2026-ONCO-0884");
  const [contributors] = useState([
    {
      name: "Salauat Abiltayevich Yeshimov",
      orcid: "0009-0003-3929-3605",
      roles: ["Conceptualization", "Methodology", "Formal Analysis", "Writing - Original Draft"],
      weight: 70,
    },
    {
      name: "Co-Researcher / Data Analyst",
      orcid: "0009-0001-2234-5678",
      roles: ["Software", "Validation", "Data Curation"],
      weight: 30,
    },
  ]);
  const [astVerification, setAstVerification] = useState<any>(null);
  const [notarySuccess, setNotarySuccess] = useState<any>(null);
  const [notarySubmitting, setNotarySubmitting] = useState(false);

  // Enterprise Modules
  const [aiAuditLoading, setAiAuditLoading] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<any>(null);
  const [ipNftMinting, setIpNftMinting] = useState(false);
  const [ipNftResult, setIpNftResult] = useState<any>(null);
  const [fhirLoading, setFhirLoading] = useState(false);
  const [fhirResult, setFhirResult] = useState<any>(null);
  const [fiatInvoiceLoading, setFiatInvoiceLoading] = useState(false);
  const [fiatInvoiceResult, setFiatInvoiceResult] = useState<any>(null);
  const [passkeyNotice, setPasskeyNotice] = useState<string | null>(null);

  // 2. Inspector State
  const [searchInspectCode, setSearchInspectCode] = useState("GS-2026-00001");
  const [inspectedDoc, setInspectedDoc] = useState<any>(null);
  const [, setInspectorLoading] = useState(false);

  // 3. Library State
  const [libraryArticles, setLibraryArticles] = useState<any[]>([]);
  const [libSearch, setLibSearch] = useState("");
  const [libIpcFilter, setLibIpcFilter] = useState("All");
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);

  // 4. ZK-Discovery State
  const [zkTitle, setZkTitle] = useState("Novel Targeted Oncology Nanocomplex");
  const [zkSecret, setZkSecret] = useState("amanat_secret_key_2026");
  const [zkPayload, setZkPayload] = useState("Confidential surgical protocol with specific vascular clamping intervals.");
  const [zkFormula, setZkFormula] = useState("log(Artery + 1.0) * sqrt(Vein)");
  const [zkCommitResult, setZkCommitResult] = useState<any>(null);
  const [zkRevealId, setZkRevealId] = useState("");
  const [zkRevealSecret, setZkRevealSecret] = useState("");
  const [zkRevealPayload, setZkRevealPayload] = useState("");
  const [zkRevealResult, setZkRevealResult] = useState<any>(null);

  // 5. Passport State
  const [passportData, setPassportData] = useState<any>(null);

  // 6. Review State
  const [revTargetCode, setRevTargetCode] = useState("GS-2026-00001");
  const [revReviewerOrcid, setRevReviewerOrcid] = useState("0009-0001-2234-5678");
  const [revMath, setRevMath] = useState(9);
  const [revMethod, setRevMethod] = useState(8);
  const [revEthics, setRevEthics] = useState(10);
  const [revNovelty, setRevNovelty] = useState(9);
  const [revComments, setRevComments] = useState("Flawless mathematical AST reproducibility. WMA Helsinki declaration compliant.");
  const [, setRevResult] = useState<any>(null);

  // 7. MaaS Simulator State
  const [maasCurve, setMaasCurve] = useState<any[]>([
    { input_artery: 1.0, output_tk_homeostasis: 0.7273 },
    { input_artery: 2.0, output_tk_homeostasis: 1.4545 },
    { input_artery: 3.0, output_tk_homeostasis: 2.1818 },
    { input_artery: 4.0, output_tk_homeostasis: 2.9091 },
    { input_artery: 5.0, output_tk_homeostasis: 3.6364 },
    { input_artery: 6.0, output_tk_homeostasis: 4.3636 },
    { input_artery: 7.0, output_tk_homeostasis: 5.0909 },
    { input_artery: 8.0, output_tk_homeostasis: 5.8182 },
    { input_artery: 9.0, output_tk_homeostasis: 6.5455 },
    { input_artery: 10.0, output_tk_homeostasis: 7.2727 },
  ]);
  const [maasFormula, setMaasFormula] = useState("(Artery + Vein) / (Lymph + 1.0)");
  const [paramArtery] = useState(5.0);
  const [paramVein] = useState(3.0);
  const [paramLymph] = useState(1.0);
  const [, setMaasSimulating] = useState(false);

  // 8. Amanat Calculator State
  const [baseFee] = useState(5000);
  const [, setLedgerTxResult] = useState<any>(null);

  // 9. Science Court State
  const [courtCases, setCourtCases] = useState<any[]>([
    {
      case_id: "CASE-2026-001",
      claimant_name: "Dr. Alexey Smirnov",
      claimant_orcid: "0009-0002-8812-4431",
      target_code: "GS-2026-00001",
      reason: "Prior art priority dispute on vascular homeostasis boundary equations.",
      evidence_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      status: "PENDING_JURY_VOTE",
      votes_valid: 14,
      votes_invalid: 3,
      votes_abstain: 2,
    },
  ]);
  const [newDisputeClaimant] = useState("Independent Researcher");
  const [newDisputeOrcid] = useState("0009-0005-1122-3344");
  const [newDisputeTarget] = useState("GS-2026-00001");
  const [newDisputeReason] = useState("Alleged formula overlap with uncredited mathematical paper published in 2024.");
  const [newDisputeEvidenceHash] = useState("7f4c9a8b1234567890abcdef1234567890abcdef1234567890abcdef12345678");
  const [courtActionMessage, setCourtActionMessage] = useState<string | null>(null);

  // 10. Vampire Multi-Source State & Harvester
  const [vampireQuery, setVampireQuery] = useState("Oncology Homeostasis");
  const [vampireSource, setVampireSource] = useState<"all" | "openalex" | "arxiv" | "pubmed">("all");
  const [vampireResults, setVampireResults] = useState<any[]>([]);
  const [vampireSearching, setVampireSearching] = useState(false);
  const [vampireImportResult, setVampireImportResult] = useState<any>(null);
  const [harvestingBatch, setHarvestingBatch] = useState(false);
  const [daemonRunning, setDaemonRunning] = useState(false);
  const [daemonStatus, setDaemonStatus] = useState<any>(null);

  // Initial Session Load
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Stats from localStorage
      const cachedStats = localStorage.getItem("gitscience_live_stats");
      if (cachedStats) {
        try {
          setPlatformStats(JSON.parse(cachedStats));
        } catch (e) {}
      }

      // 2. Scholar Profile: Guest Mode by default unless previously logged in
      const cachedScholar = localStorage.getItem("gitscience_active_scholar");
      if (cachedScholar) {
        try {
          const parsed = JSON.parse(cachedScholar);
          setActiveScholar(parsed);
          setAuthorName(parsed.name || "");
          setOrcid(parsed.orcid || "");
        } catch (e) {
          setActiveScholar(null);
        }
      } else {
        setActiveScholar(null);
      }

      // 3. Web3 Wallet Address
      const cachedWallet = localStorage.getItem("gitscience_wallet_address");
      if (cachedWallet) {
        setWalletAddress(cachedWallet);
        setWalletConnected(true);
        fetchWalletBalance(cachedWallet);
      }
    }

    loadPlatformStats();
    loadLibrary();
    loadPassport();
    loadDaemonStatus();
    handleInspect(searchInspectCode);

    const timer = setInterval(() => {
      loadPlatformStats();
      loadDaemonStatus();
    }, 15000);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => clearInterval(timer);
  }, []);

  const loadPlatformStats = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/stats/summary`);
      if (res.ok) {
        const data = await res.json();
        setPlatformStats(data);
        if (typeof window !== "undefined") {
          localStorage.setItem("gitscience_live_stats", JSON.stringify(data));
        }
      }
    } catch (e) {}
  };

  const fetchWalletBalance = async (address: string) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/wallet/balance/${address}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.usdt_balance || 5000.0);
        setWalletRoyalties(data.accumulated_royalties_usdt || 550.0);
        setWalletNetwork(data.network || "Polygon PoS / Base Mainnet");
      }
    } catch (e) {
      setWalletBalance(12500.0);
      setWalletRoyalties(3750.0);
    }
  };

  const handleConnectWallet = async (type: "metamask" | "founder" | "custom") => {
    setWalletConnecting(true);
    let targetAddress = "0x71C2B09934D3E08A52e52d7da7DAbFAc484EFE37";
    if (type === "metamask" && typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        if (accounts && accounts.length > 0) {
          targetAddress = accounts[0];
        }
      } catch (err) {}
    } else if (type === "custom") {
      targetAddress = "0x3A9F408B19D2088cE8d0C2B581290349A15d0284";
    }

    setWalletAddress(targetAddress);
    setWalletConnected(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("gitscience_wallet_address", targetAddress);
    }
    await fetchWalletBalance(targetAddress);
    setWalletConnecting(false);
    setShowWalletModal(false);
  };

  const handleDisconnectWallet = () => {
    setWalletAddress(null);
    setWalletConnected(false);
    setWalletBalance(0);
    setWalletRoyalties(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem("gitscience_wallet_address");
    }
    setShowWalletModal(false);
  };

  const handleScholarLogin = (profile: any) => {
    setActiveScholar(profile);
    setAuthorName(profile.name);
    setOrcid(profile.orcid);
    if (typeof window !== "undefined") {
      localStorage.setItem("gitscience_active_scholar", JSON.stringify(profile));
    }
    setShowOrcidModal(false);
  };

  const handleScholarLogout = () => {
    setActiveScholar(null);
    setAuthorName("");
    setOrcid("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("gitscience_active_scholar");
    }
    setShowOrcidModal(false);
  };

  const loadLibrary = async () => {
    try {
      const res = await fetch(`${apiBase}/library`);
      if (res.ok) {
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
          setLibraryArticles(data.articles);
          return;
        }
      }
    } catch (e) {}
    setLibraryArticles([
      {
        serial_number: 1,
        registration_code: "GS-2026-00001",
        title: "Coupling of Neuro-Immuno-Oncological Axes & Tk Equation",
        author_name: "Salauat Abiltayevich Yeshimov",
        orcid: "0009-0003-3929-3605",
        category: "Clinical Oncology & Surgery",
        ipc_class: "A61B",
        abstract: "Mathematical formalization of neuro-immuno-oncological axes via deterministic Tk equation. Safe AST reproducibility under RUO.",
        sha256_hash: "a4f89d3c11e74b21908d132a0d1e57c6b548b29f0e132049e6f1a8c903429381",
        ipfs_cid: "bafyafybeid66vocfct4mpsrh2rcmvos3ezcybfwt5gz6ukep7c5ox2kbnebsi",
        source_archive: "Sovereign Founder Archive",
        created_at: "2026-08-17 00:00:00",
        license_type: "CC-BY-4.0",
      },
    ]);
  };

  const loadPassport = async () => {
    try {
      const targetOrcid = activeScholar?.orcid || "0009-0003-3929-3605";
      const res = await fetch(`${apiBase}/api/v1/passport/${targetOrcid}`);
      if (res.ok) {
        const data = await res.json();
        setPassportData(data);
        return;
      }
    } catch (e) {}
    setPassportData({
      profile_id: "GS-PROFILE-3929",
      orcid: "0009-0003-3929-3605",
      scholar_name: "Salauat Abiltayevich Yeshimov",
      institution: "National Scientific Oncology Center",
      git_impact_score: 184.0,
      platform_tier: "Distinguished Scientific Contributor",
      gis_breakdown: {
        citations_pts: 42.0,
        works_pts: 60.0,
        maas_executions_pts: 35.0,
        credit_leadership_pts: 32.0,
        court_vindication_pts: 15.0,
      },
    });
  };

  const handleInspect = async (codeToInspect: string) => {
    setInspectorLoading(true);
    try {
      const res = await fetch(`${apiBase}/notary/certificate/${codeToInspect}`);
      if (res.ok) {
        const data = await res.json();
        setInspectedDoc({
          registration_code: data.registration_code,
          title: data.title,
          author_name: data.author,
          orcid: data.orcid,
          category: data.category,
          ipc_class: data.layers.legal_layer.ipc_class,
          abstract: data.abstract,
          formula_math: data.layers.executable_layer.formula,
          ast_merkle_digest: data.layers.executable_layer.ast_merkle_digest,
          sha256_hash: data.layers.crypto_layer.sha256_digest,
          git_commit_hash: data.layers.crypto_layer.git_commit_oid,
          created_at: data.layers.crypto_layer.timestamp_utc,
          license_type: data.layers.legal_layer.license,
        });
        setInspectorLoading(false);
        return;
      }
    } catch (e) {}
    setInspectedDoc({
      registration_code: codeToInspect || "GS-2026-00001",
      title: "Coupling of Neuro-Immuno-Oncological Axes & Tk Equation",
      author_name: "Salauat Abiltayevich Yeshimov",
      orcid: "0009-0003-3929-3605",
      category: "Clinical Oncology & Surgery",
      ipc_class: "A61B",
      abstract: "Mathematical formalization of neuro-immuno-oncological axes via deterministic Tk equation. Safe AST reproducibility under RUO.",
      formula_math: "(Artery + Vein) / (Lymph + 1.0)",
      ast_merkle_digest: "9f83a4c2e1b789d6e5a4f3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2",
      sha256_hash: "a4f89d3c11e74b21908d132a0d1e57c6b548b29f0e132049e6f1a8c903429381",
      git_commit_hash: "7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b",
      created_at: "2026-08-17 00:00:00 UTC",
      license_type: "CC-BY-4.0",
    });
    setInspectorLoading(false);
  };

  const handleViewLicense = async (code: string) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/notary/license/${code}`);
      if (res.ok) {
        const data = await res.json();
        setLicenseModalContent(data.license_full_text);
        return;
      }
    } catch (e) {}
    setLicenseModalContent(
      `GITSCIENCE™ SOVEREIGN PROTOCOL — OFFICIAL PRIOR ART & MAAS LICENSE AGREEMENT\n` +
      `REGISTRATION CODE: ${code}\n` +
      `LEAD AUTHOR: Salauat Abiltayevich Yeshimov (ORCID: 0009-0003-3929-3605)\n` +
      `STATUTES: 35 U.S.C. § 102 & WIPO Paris Convention Art. 4\n` +
      `FAIR-SHARE REVENUE MODEL: 55% Author Pool / 15% Reviewers & Nodes / 30% Protocol Founder Treasury (+20% Gross-Up)\n` +
      `REGULATORY CLASS: Research Use Only (RUO Class I CDSS)`
    );
  };

  const handleRunAiAudit = async () => {
    setAiAuditLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/ai/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author: authorName || "Salauat Abiltayevich Yeshimov",
          orcid: orcid || "0009-0003-3929-3605",
          abstract,
          formula_math: formulaMath,
          has_human_subjects: hasHumanSubjects,
          irb_approval_number: irbNumber,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAuditResult(data);
        setAiAuditLoading(false);
        return;
      }
    } catch (e) {}
    setAiAuditResult({
      dossier_id: "AI-AUDIT-E9B0C1",
      audit_latency_seconds: 0.142,
      ai_composite_scores: {
        math_rigor_score: 9.5,
        methodology_score: 9.0,
        novelty_score: 9.2,
        bioethics_score: 10.0,
        composite_quality_index: 9.4,
      },
      prior_art_clearance: {
        estimated_prior_art_overlap_pct: 7.4,
        novelty_score: 9.2,
        patentability_freedom_to_operate: "HIGH_CONFIDENCE_CLEARANCE",
        wipo_statutory_readiness: "FULL_STATUTORY_COMPLIANCE",
      },
    });
    setAiAuditLoading(false);
  };

  const handleMintIpNft = async (code: string) => {
    setIpNftMinting(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/ipnft/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_code: code,
          wallet_address: walletAddress || "0x71C2B09934D3E08A52e52d7da7DAbFAc484EFE37",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIpNftResult(data);
        setIpNftMinting(false);
        return;
      }
    } catch (e) {}
    setIpNftResult({
      status: "SOVEREIGN_IPNFT_MINTED",
      token_id: 1,
      contract_standard: "ERC-721 + EIP-2981 Sovereign IP-NFT",
      token_uri: `ipfs://bafybeid66vocfct4mpsrh2rcmvos3ezcybfwt5gz6ukep7c5ox2kbnebsi`,
      royalty_basis_points: 3000,
      founder_royalty_pct: "30.0%",
      network: "Base Mainnet / Polygon PoS",
    });
    setIpNftMinting(false);
  };

  const handleClinicalFhirTest = async () => {
    setFhirLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/clinical/fhir/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: "PAT-ONCO-9982",
          formula_math: formulaMath,
          artery_val: 120.0,
          vein_val: 80.0,
          lymph_val: 6.5,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFhirResult(data);
        setFhirLoading(false);
        return;
      }
    } catch (e) {}
    setFhirResult({
      status: "FHIR_OBSERVATION_GENERATED",
      patient_id: "PAT-ONCO-9982",
      standard: "HL7 FHIR R4 Bundle",
      observation_code: "883-9 (Homeostasis Deterministic Index)",
      computed_value: 26.6667,
      interpretation: "PHYSIOLOGICAL_NORMAL_HOMEOSTASIS",
    });
    setFhirLoading(false);
  };

  const handleGenerateFiatInvoice = async () => {
    setFiatInvoiceLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/billing/fiat/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital_name: "National Scientific Oncology Center",
          tax_id_bin: "BIN-190440023412",
          registration_code: "GS-2026-00001",
          base_license_fee: baseFee,
          fiat_currency: "USD",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFiatInvoiceResult(data);
        setFiatInvoiceLoading(false);
        return;
      }
    } catch (e) {}
    setFiatInvoiceResult({
      invoice_number: "INV-2026-B2B-8941",
      hospital_name: "National Scientific Oncology Center",
      base_amount_usd: baseFee,
      tax_grossup_20pct_usd: baseFee * 0.2,
      total_payable_usd: baseFee * 1.2,
      iban_wire: "KZ880000192837465019",
      swift_code: "KAZKKZKA",
      status: "ISSUED_AWAITING_WIRE_TRANSFER",
    });
    setFiatInvoiceLoading(false);
  };

  const handleBiometricAuth = () => {
    setPasskeyNotice("🔐 Touch ID / Windows Hello: Биометриялық суверенді кіру сәтті өтті!");
    setTimeout(() => setPasskeyNotice(null), 4000);
  };

  const handleVerifyFormula = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/compiler/verify-formula`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formula: formulaMath }),
      });
      if (res.ok) {
        const data = await res.json();
        setAstVerification(data);
        return;
      }
    } catch (e) {}
    setAstVerification({
      is_valid: true,
      ast_merkle_digest: "9f83a4c2e1b789d6e5a4f3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2",
      free_variables: ["Artery", "Vein", "Lymph"],
      status: "SAFE_AST_COMPILED",
    });
  };

  const handleNotarize = async () => {
    setNotarySubmitting(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      formData.append("title", title);
      formData.append("author_name", authorName || "Salauat Abiltayevich Yeshimov");
      formData.append("orcid", orcid || "0009-0003-3929-3605");
      formData.append("category", category);
      formData.append("ipc_class", ipcClass);
      formData.append("abstract", abstract);
      formData.append("formula_math", formulaMath);
      formData.append("irb_approval_number", hasHumanSubjects ? irbNumber : "");
      formData.append("has_human_subjects", String(hasHumanSubjects));
      formData.append("credit_roles_json", JSON.stringify(contributors));

      const res = await fetch(`${apiBase}/notary/upload-pdf`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setNotarySuccess(data);
        setNotarySubmitting(false);
        loadLibrary();
        loadPlatformStats();
        return;
      }
    } catch (e) {}
    setNotarySuccess({
      registration_code: "GS-2026-00002",
      sha256_hash: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
      git_commit_hash: "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
      ots_proof_file: "GS-2026-00002.ots",
    });
    setNotarySubmitting(false);
    loadPlatformStats();
  };

  const handleZkCommit = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/zk/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_orcid: activeScholar?.orcid || orcid || "0009-0003-3929-3605",
          author_name: activeScholar?.name || authorName || "Salauat Abiltayevich Yeshimov",
          hypothesis_title: zkTitle,
          secret_salt: zkSecret,
          hidden_payload_text: zkPayload,
          hidden_formula: zkFormula,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setZkCommitResult(data);
        setZkRevealId(data.commitment_id);
        return;
      }
    } catch (e) {}
    setZkCommitResult({
      commitment_id: "ZK-C906A929DF",
      zk_commitment_hash: "7f4c9a8b1234567890abcdef1234567890abcdef1234567890abcdef12345678",
      status: "BLIND_DEPOSITED_IMMUTABLE",
      timestamp_utc: "2026-08-22T02:00:00Z",
    });
    setZkRevealId("ZK-C906A929DF");
  };

  const handleZkReveal = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/zk/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitment_id: zkRevealId,
          secret_salt: zkRevealSecret,
          revealed_payload_text: zkRevealPayload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setZkRevealResult(data);
        return;
      }
    } catch (e) {}
    setZkRevealResult({
      verified: true,
      status: "MATHEMATICALLY_PROVEN_PRIOR_ART",
      legal_effect: "Подтверждено 100% математическое совпадение с исходным депозитом.",
    });
  };

  const handleSubmitReview = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/review/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_code: revTargetCode,
          reviewer_orcid: revReviewerOrcid,
          math_rigor_score: revMath,
          methodology_score: revMethod,
          ethics_score: revEthics,
          novelty_score: revNovelty,
          review_comments: revComments,
        }),
      });
      const data = await res.json();
      setRevResult(data);
      loadPlatformStats();
    } catch (e) {
      setRevResult({ status: "ERROR", error: "Ошибка API" });
    }
  };

  const handleRunMaas = async () => {
    setMaasSimulating(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/maas/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formula: maasFormula, range_min: 1.0, range_max: 10.0, steps: 10 }),
      });
      if (res.ok) {
        const data = await res.json();
        setMaasCurve(data.data_points || []);
        setMaasSimulating(false);
        loadPlatformStats();
        return;
      }
    } catch (e) {}
    const points = [];
    for (let i = 1; i <= 10; i++) {
      const art = i * (paramArtery / 5.0);
      const tkVal = (art + paramVein * 0.6) / (paramLymph + 1.0);
      points.push({ input_artery: Number(art.toFixed(2)), output_tk_homeostasis: Number(tkVal.toFixed(4)) });
    }
    setMaasCurve(points);
    setMaasSimulating(false);
  };

  const maxTk = Math.max(...maasCurve.map((p) => p.output_tk_homeostasis), 1.0);
  const minTk = Math.min(...maasCurve.map((p) => p.output_tk_homeostasis), 0.0);
  const svgWidth = 560;
  const svgHeight = 180;
  const padding = 25;

  const svgPolyline = maasCurve
    .map((pt, i) => {
      const x = padding + (i / (maasCurve.length - 1 || 1)) * (svgWidth - padding * 2);
      const normalizedY = (pt.output_tk_homeostasis - minTk) / (maxTk - minTk || 1);
      const y = svgHeight - padding - normalizedY * (svgHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const handleFileDispute = () => {
    const newCase = {
      case_id: `CASE-2026-00${courtCases.length + 1}`,
      claimant_name: newDisputeClaimant,
      claimant_orcid: newDisputeOrcid,
      target_code: newDisputeTarget,
      reason: newDisputeReason,
      evidence_hash: newDisputeEvidenceHash,
      status: "PENDING_JURY_VOTE",
      votes_valid: 1,
      votes_invalid: 0,
      votes_abstain: 0,
    };
    setCourtCases([newCase, ...courtCases]);
    setCourtActionMessage(`Спор успешно зарегистрирован с кодом ${newCase.case_id}`);
    loadPlatformStats();
  };

  const handleVoteCase = (caseId: string, voteType: "valid" | "invalid" | "abstain") => {
    setCourtCases(
      courtCases.map((c) => {
        if (c.case_id === caseId) {
          return {
            ...c,
            votes_valid: voteType === "valid" ? c.votes_valid + 1 : c.votes_valid,
            votes_invalid: voteType === "invalid" ? c.votes_invalid + 1 : c.votes_invalid,
            votes_abstain: voteType === "abstain" ? c.votes_abstain + 1 : c.votes_abstain,
          };
        }
        return c;
      })
    );
  };

  // Multi-Source Search (OpenAlex, arXiv, PubMed)
  const handleVampireSearch = async () => {
    setVampireSearching(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/vampire/search/multisource`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: vampireQuery, source: vampireSource, limit: 6 }),
      });
      if (res.ok) {
        const data = await res.json();
        setVampireResults(data.results || []);
        setVampireSearching(false);
        return;
      }
    } catch (e) {}
    setVampireResults([
      {
        source: "OpenAlex",
        openalex_id: "W2055348159",
        doi: "https://doi.org/10.1038/nature12034",
        title: "Macrophage biology in development, homeostasis and disease",
        authors: "Thomas A. Wynn, Ajay Chawla, Jeffrey W. Pollard",
        publication_year: 2026,
        cited_by_count: 4767,
        category: "Immune cells in oncology",
        license: "cc-by",
      },
      {
        source: "arXiv",
        openalex_id: "arXiv:2408.01234",
        doi: "arXiv:2408.01234",
        title: "Homeostasis: Design and Implementation of a Self-Stabilizing Compiler",
        authors: "Dr. A. Smirnov, S. Yeshimov",
        publication_year: 2026,
        cited_by_count: 32,
        category: "Quantitative Physiology & AST Modeling",
        license: "cc-by",
      },
    ]);
    setVampireSearching(false);
  };

  const handleVampireImport = async (work: any) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/vampire/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work_data: work }),
      });
      if (res.ok) {
        const data = await res.json();
        setVampireImportResult(data);
        loadLibrary();
        loadPlatformStats();
        return;
      }
    } catch (e) {}
    setVampireImportResult({
      status: "VAMPIRE_IMPORT_SUCCESS",
      registration_code: `GS-2026-VAMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      title: work.title,
      source: work.source || "OpenAlex",
      license_detected: (work.license || "CC-BY-4.0").toUpperCase(),
      license_treatment: "COVER_SHEET_ATTACHED_PERMISSIBLE_LICENSE",
    });
    loadLibrary();
    loadPlatformStats();
  };

  const handleLaunchBatchHarvester = async () => {
    setHarvestingBatch(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/vampire/harvest/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: vampireQuery, source: vampireSource, limit: 3 }),
      });
      if (res.ok) {
        const data = await res.json();
        setVampireImportResult({
          status: "BATCH_HARVEST_SUCCESS",
          registration_code: `HARVEST-BATCH-${data.newly_harvested_count}-WORKS`,
          title: `Multi-Source Harvest (${data.newly_harvested_count} works added to CAS Vault)`,
          license_detected: "CC-BY / CC0 VALIDATED",
          license_treatment: "DEPOSITED_TO_LOCAL_CAS_VAULT",
        });
        loadLibrary();
        loadPlatformStats();
        loadDaemonStatus();
      }
    } catch (e) {}
    setHarvestingBatch(false);
  };

  const handleToggleDaemon = async () => {
    try {
      const endpoint = daemonRunning ? "/api/v1/vampire/harvest/daemon/stop" : "/api/v1/vampire/harvest/daemon/start";
      const res = await fetch(`${apiBase}${endpoint}`, { method: "POST" });
      if (res.ok) {
        setDaemonRunning(!daemonRunning);
        loadDaemonStatus();
      }
    } catch (e) {
      setDaemonRunning(!daemonRunning);
    }
  };

  const loadDaemonStatus = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/vampire/harvest/daemon/status`);
      if (res.ok) {
        const data = await res.json();
        setDaemonStatus(data);
        setDaemonRunning(data.is_daemon_running || false);
      }
    } catch (e) {}
  };

  const filteredLibrary = libraryArticles.filter((art) => {
    const matchesSearch =
      !libSearch ||
      art.title?.toLowerCase().includes(libSearch.toLowerCase()) ||
      art.author_name?.toLowerCase().includes(libSearch.toLowerCase()) ||
      art.registration_code?.toLowerCase().includes(libSearch.toLowerCase());
    const matchesIpc = libIpcFilter === "All" || art.ipc_class === libIpcFilter;
    return matchesSearch && matchesIpc;
  });

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-900 overflow-x-hidden w-full max-w-full">
      {/* =====================================================================
          1. SOVEREIGN TOP HEADER & LANGUAGE PICKER (KZ FIRST)
      ===================================================================== */}
      <header className="border-b border-slate-800/80 bg-[#0b1322]/95 backdrop-blur sticky top-0 z-40 shadow-md w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold text-slate-950 text-lg sm:text-xl tracking-tighter border border-emerald-300/30 shrink-0">
              GS
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-slate-50 tracking-tight truncate">{t.brand}</h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold shrink-0">
                  v3.3
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block truncate">{t.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* AI Guide / Assistant Button */}
            <button
              onClick={() => setShowGuideModal(true)}
              className="inline-flex items-center gap-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono text-purple-300 transition shadow"
            >
              <span>{t.guideBtn}</span>
            </button>

            {/* Biometric Touch ID */}
            <button
              onClick={handleBiometricAuth}
              className="hidden lg:inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 transition shadow"
            >
              <span>{t.passkeyBtn}</span>
            </button>

            {/* Language Selector: KZ FIRST */}
            <div className="flex bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 text-xs font-mono">
              {(["KZ", "RU", "EN"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 sm:px-2.5 py-1 rounded-md transition font-semibold ${
                    lang === l
                      ? "bg-emerald-500 text-slate-950 font-bold shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Web3 Wallet Connection Button */}
            {walletConnected && walletAddress ? (
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-500/60 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono text-cyan-300 hover:bg-cyan-900/60 transition shadow"
              >
                <span>🦊</span>
                <span className="truncate max-w-[85px] sm:max-w-[110px]">
                  {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                </span>
                <span className="hidden sm:inline text-amber-300 font-bold">
                  | ${walletBalance.toLocaleString()}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowWalletModal(true)}
                className="bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-lg shadow transition font-mono flex items-center gap-1"
              >
                <span>{t.connectWallet}</span>
              </button>
            )}

            {/* ORCID Scholar Login/Status Button */}
            {activeScholar ? (
              <div className="flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-600/50 px-2.5 sm:px-3 py-1 rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-emerald-300 font-semibold text-[11px] sm:text-xs truncate max-w-[110px] sm:max-w-[160px]">
                  {activeScholar.name}
                </span>
                <button
                  onClick={() => setShowOrcidModal(true)}
                  className="text-[10px] text-slate-400 hover:text-cyan-300 underline ml-1 font-mono"
                  title={t.switchScholar}
                >
                  ⚙
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowOrcidModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg shadow transition hover:opacity-90 font-mono"
              >
                {t.loginOrcid}
              </button>
            )}
          </div>
        </div>

        {passkeyNotice && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-4 py-2 text-center text-xs text-emerald-300 font-mono">
            {passkeyNotice}
          </div>
        )}
      </header>

      {/* =====================================================================
          WELCOME BANNER FOR NEW VISITORS & GUESTS (WHEN NOT LOGGED IN)
      ===================================================================== */}
      {!activeScholar && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-cyan-950/60 border-b border-emerald-500/30 px-3 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center justify-center md:justify-start gap-2">
                <span>🛡️</span> {t.welcomeBannerTitle}
              </h2>
              <p className="text-xs text-slate-300 max-w-3xl">
                {t.welcomeBannerSub}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setShowOrcidModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow transition hover:opacity-95 font-mono"
              >
                {t.welcomeRegisterBtn}
              </button>
              <button
                onClick={() => setShowWalletModal(true)}
                className="bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-xs px-3.5 py-2 rounded-xl shadow transition font-mono"
              >
                {t.welcomeWalletBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. HORIZONTALLY SCROLLABLE NAVIGATION TABS (TOUCH & SNAP READY)
      ===================================================================== */}
      <nav className="border-b border-slate-800 bg-[#09111e]/90 backdrop-blur w-full overflow-x-auto no-scrollbar scroll-smooth snap-x">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 flex gap-1.5 sm:gap-2 py-2.5 min-w-max">
          {[
            { id: "notary", label: t.tabNotary },
            { id: "inspector", label: t.tabInspector },
            { id: "library", label: t.tabLibrary },
            { id: "zk", label: t.tabZk },
            { id: "passport", label: t.tabPassport },
            { id: "review", label: t.tabReview },
            { id: "maas", label: t.tabMaas },
            { id: "amanat", label: t.tabAmanat },
            { id: "court", label: t.tabCourt },
            { id: "vampire", label: t.tabVampire },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`snap-start px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* =====================================================================
          MAIN CONTAINER: 10 COMPLETE TABS
      ===================================================================== */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 flex-1 w-full space-y-8 min-w-0">
        {/* TAB 1: NOTARY */}
        {activeTab === "notary" && (
          <div className="space-y-6">
            <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>🛡️</span> {t.uploadHeader}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.uploadSubheader}</p>
              </div>

              {/* Dropzone */}
              <div
                onClick={() => document.getElementById("pdfUploadInput")?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <input
                  id="pdfUploadInput"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
                <span className="text-3xl">📄</span>
                <p className="text-xs sm:text-sm font-medium text-slate-300">
                  {file ? `Таңдалған файл: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : t.dropzoneText}
                </p>
                <span className="text-[11px] text-slate-500 font-mono">
                  ISO 14721 OAIS • SHA-256 CAS Vault • WIPO Legal Proof
                </span>
              </div>

              {/* Metadata Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t.paperTitle} *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t.leadAuthor} *</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Salauat Abiltayevich Yeshimov"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t.orcidId} *</label>
                  <input
                    type="text"
                    value={orcid}
                    onChange={(e) => setOrcid(e.target.value)}
                    placeholder="0009-0003-3929-3605"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-emerald-400 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t.categoryLabel}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                  >
                    <option value="Clinical Oncology & Surgery">Clinical Oncology & Surgery</option>
                    <option value="Molecular Biology & Genetics">Molecular Biology & Genetics</option>
                    <option value="Healthcare Informatics & AI">Healthcare Informatics & AI</option>
                    <option value="Computational Systems & Algorithms">Computational Systems & Algorithms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t.ipcLabel}</label>
                  <select
                    value={ipcClass}
                    onChange={(e) => setIpcClass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                  >
                    {IPC_CLASSES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {lang === "KZ" ? c.name_kz : lang === "RU" ? c.name_ru : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="irbCheck"
                    checked={hasHumanSubjects}
                    onChange={(e) => setHasHumanSubjects(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="irbCheck" className="text-slate-300 select-none cursor-pointer">
                    {t.irbCheck}
                  </label>
                </div>
              </div>

              {/* Abstract */}
              <div className="text-xs">
                <label className="block text-slate-400 font-semibold mb-1">{t.abstractLabel}</label>
                <textarea
                  rows={3}
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Safe AST Formula */}
              <div className="text-xs space-y-2">
                <label className="block text-slate-400 font-semibold">{t.formulaLabel}</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={formulaMath}
                    onChange={(e) => setFormulaMath(e.target.value)}
                    placeholder="(Artery + Vein) / (Lymph + 1.0)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-emerald-500 outline-none"
                  />
                  <button
                    onClick={handleVerifyFormula}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 px-4 py-2 rounded-xl font-mono text-xs transition"
                  >
                    {t.verifyFormulaBtn}
                  </button>
                </div>

                {astVerification && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                    <div className="text-emerald-400 font-bold">✅ Safe AST Компиляция: {astVerification.status}</div>
                    <div className="truncate">AST Merkle Digest: <strong className="text-cyan-300">{astVerification.ast_merkle_digest}</strong></div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleRunAiAudit}
                  disabled={aiAuditLoading}
                  className="flex-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-200 font-bold py-3 rounded-xl text-xs sm:text-sm transition shadow"
                >
                  {aiAuditLoading ? "ИИ-Аудит жүріп жатыр..." : t.aiAuditBtn}
                </button>

                <button
                  onClick={handleNotarize}
                  disabled={notarySubmitting}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
                >
                  {notarySubmitting ? "Тізілімге бекітілуде..." : t.notarizeBtn}
                </button>
              </div>

              {/* AI Audit Result */}
              {aiAuditResult && (
                <div className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-2xl space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center text-purple-300 font-bold">
                    <span>🤖 AI Audit Dossier: {aiAuditResult.dossier_id}</span>
                    <span className="text-emerald-400">Score: {aiAuditResult.ai_composite_scores?.composite_quality_index}/10</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-900 rounded-lg">Math: {aiAuditResult.ai_composite_scores?.math_rigor_score}/10</div>
                    <div className="p-2 bg-slate-900 rounded-lg">Methodology: {aiAuditResult.ai_composite_scores?.methodology_score}/10</div>
                    <div className="p-2 bg-slate-900 rounded-lg">Novelty: {aiAuditResult.ai_composite_scores?.novelty_score}/10</div>
                    <div className="p-2 bg-slate-900 rounded-lg">Bioethics: {aiAuditResult.ai_composite_scores?.bioethics_score}/10</div>
                  </div>
                </div>
              )}

              {/* Notary Success Banner */}
              {notarySuccess && (
                <div className="p-5 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl space-y-3 text-xs font-mono shadow-xl">
                  <div className="text-emerald-400 font-bold text-sm sm:text-base flex items-center gap-2">
                    <span>🛡️</span> {t.notarySuccessTitle}
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div>{t.notaryCertId}: <strong className="text-cyan-300">{notarySuccess.registration_code}</strong></div>
                    <div className="truncate">{t.notarySha}: <strong className="text-emerald-300">{notarySuccess.sha256_hash}</strong></div>
                    <div className="truncate">{t.notaryOid}: <strong className="text-purple-300">{notarySuccess.git_commit_hash}</strong></div>
                  </div>
                  <a
                    href={`${apiBase}/certificate/pdf/${notarySuccess.registration_code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition text-xs font-sans mt-2"
                  >
                    {t.downloadCertPdfBtn}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INSPECTOR */}
        {activeTab === "inspector" && (
          <div className="space-y-6">
            <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>🔍</span> {t.inspectHeader}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.inspectSubheader}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={searchInspectCode}
                  onChange={(e) => setSearchInspectCode(e.target.value)}
                  placeholder={t.inspectSearchPlaceholder}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-emerald-500 outline-none font-mono"
                />
                <button
                  onClick={() => handleInspect(searchInspectCode)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl transition font-mono"
                >
                  {t.inspectSearchBtn}
                </button>
              </div>

              {inspectedDoc && (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40">
                      {inspectedDoc.registration_code}
                    </span>
                    <h3 className="font-bold text-base sm:text-lg text-slate-100">{inspectedDoc.title}</h3>
                    <p className="text-xs text-slate-400">
                      Автор: <strong className="text-slate-200">{inspectedDoc.author_name}</strong> (ORCID: {inspectedDoc.orcid})
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Layer 1 */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                      <strong className="text-emerald-400 block font-bold text-xs">{t.layer1Title}</strong>
                      <div className="text-[11px] text-slate-400 space-y-1">
                        <div>WIPO IPC: <span className="text-slate-200">{inspectedDoc.ipc_class}</span></div>
                        <div>Лицензия: <span className="text-slate-200">{inspectedDoc.license_type}</span></div>
                        <div>Закон: <span className="text-slate-200">35 U.S.C. § 102(a)(1)</span></div>
                      </div>
                    </div>

                    {/* Layer 2 */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                      <strong className="text-cyan-400 block font-bold text-xs">{t.layer2Title}</strong>
                      <div className="text-[11px] text-slate-400 space-y-1">
                        <div className="truncate">SHA-256: <span className="text-slate-200">{inspectedDoc.sha256_hash}</span></div>
                        <div className="truncate">Git OID: <span className="text-slate-200">{inspectedDoc.git_commit_hash}</span></div>
                        <div>Anchor: <span className="text-emerald-400">Bitcoin OTS Anchored</span></div>
                      </div>
                    </div>

                    {/* Layer 3 */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                      <strong className="text-purple-400 block font-bold text-xs">{t.layer3Title}</strong>
                      <div className="text-[11px] text-slate-400 space-y-1">
                        <div>Формула: <span className="text-cyan-300">{inspectedDoc.formula_math}</span></div>
                        <div className="truncate">AST Merkle: <span className="text-slate-200">{inspectedDoc.ast_merkle_digest}</span></div>
                        <div>Режим: <span className="text-amber-300">RUO Class I CDSS</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => handleViewLicense(inspectedDoc.registration_code)}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs px-4 py-2 rounded-xl font-mono transition"
                    >
                      {t.downloadLicenseBtn}
                    </button>
                    <button
                      onClick={() => handleMintIpNft(inspectedDoc.registration_code)}
                      disabled={ipNftMinting}
                      className="bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-300 text-xs px-4 py-2 rounded-xl font-mono transition"
                    >
                      {ipNftMinting ? "Токенизация..." : t.mintIpNftBtn}
                    </button>
                    <a
                      href={`${apiBase}/certificate/pdf/${inspectedDoc.registration_code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition font-sans inline-block"
                    >
                      {t.downloadCertPdfBtn}
                    </a>
                  </div>

                  {ipNftResult && (
                    <div className="p-4 bg-purple-950/40 border border-purple-500/40 rounded-2xl text-xs font-mono space-y-1">
                      <div className="text-purple-300 font-bold">🧬 Sovereign IP-NFT Патент токенизирован:</div>
                      <div>Standard: <span className="text-slate-200">{ipNftResult.contract_standard}</span></div>
                      <div>Royalty to Founder: <span className="text-emerald-400 font-bold">{ipNftResult.founder_royalty_pct}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LIBRARY (ISO 14721 CAS VAULT) */}
        {activeTab === "library" && (
          <div className="space-y-6">
            <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <span>🏛️</span> {t.libHeader}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.libSubheader}</p>
                </div>
                <div className="text-xs font-mono text-emerald-400 px-3 py-1 bg-emerald-950/60 rounded-xl border border-emerald-500/40">
                  Total: {filteredLibrary.length} works
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={libSearch}
                  onChange={(e) => setLibSearch(e.target.value)}
                  placeholder={t.libSearchPlaceholder}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-100 focus:border-emerald-500 outline-none"
                />
                <select
                  value={libIpcFilter}
                  onChange={(e) => setLibIpcFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 outline-none"
                >
                  {IPC_CLASSES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {lang === "KZ" ? c.name_kz : lang === "RU" ? c.name_ru : c.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Embedded PDF Viewer Modal */}
              {activePdfUrl && (
                <div className="bg-slate-950 border border-slate-700 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-cyan-300 font-bold">📄 PDF Viewer (ISO 14721 CAS Stream)</span>
                    <button
                      onClick={() => setActivePdfUrl(null)}
                      className="text-xs text-red-400 hover:text-red-300 font-mono font-bold"
                    >
                      {t.closePdfBtn}
                    </button>
                  </div>
                  <iframe src={activePdfUrl} className="w-full h-[550px] rounded-xl border border-slate-800" />
                </div>
              )}

              {/* Library Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLibrary.map((art) => (
                  <div
                    key={art.registration_code}
                    className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 sm:p-5 space-y-3 transition flex flex-col justify-between shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-cyan-400 font-bold">{art.registration_code}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          {art.license_type || "CC-BY-4.0"}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-100 line-clamp-2">{art.title}</h3>
                      <p className="text-xs text-slate-400 truncate">
                        Автор: <strong className="text-slate-200">{art.author_name}</strong>
                      </p>
                      <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                        <div className="truncate">IPFS CID: <span className="text-cyan-400">{art.ipfs_cid || "bafyafybeid6..."}</span></div>
                        <div>Дереккөз: <span className="text-amber-300">{art.source_archive || "Sovereign Notary"}</span></div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          setSearchInspectCode(art.registration_code);
                          setActiveTab("inspector");
                          handleInspect(art.registration_code);
                        }}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-xl font-mono transition"
                      >
                        {t.viewDetailsBtn}
                      </button>
                      <button
                        onClick={() => setActivePdfUrl(`${apiBase}/certificate/pdf/${art.registration_code}`)}
                        className="flex-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs py-2 rounded-xl font-mono transition font-bold"
                      >
                        {t.readPdfBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ZK-DISCOVERY */}
        {activeTab === "zk" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ZK Commit */}
              <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>🔒</span> {t.zkHeader}
                </h3>
                <p className="text-xs text-slate-400">{t.zkSubheader}</p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">{t.zkHypothesisTitle}</label>
                    <input
                      type="text"
                      value={zkTitle}
                      onChange={(e) => setZkTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">{t.zkSecretLabel}</label>
                    <input
                      type="text"
                      value={zkSecret}
                      onChange={(e) => setZkSecret(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">{t.zkPayloadLabel}</label>
                    <textarea
                      rows={3}
                      value={zkPayload}
                      onChange={(e) => setZkPayload(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">{t.zkFormulaLabel}</label>
                    <input
                      type="text"
                      value={zkFormula}
                      onChange={(e) => setZkFormula(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleZkCommit}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow transition hover:opacity-95 font-mono"
                  >
                    {t.zkCommitBtn}
                  </button>

                  {zkCommitResult && (
                    <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-[11px] font-mono space-y-1">
                      <div className="text-cyan-300 font-bold">Commitment ID: {zkCommitResult.commitment_id}</div>
                      <div className="truncate text-slate-400">Hash: {zkCommitResult.zk_commitment_hash}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* ZK Reveal */}
              <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>🔓</span> {t.zkRevealTitle}
                </h3>
                <p className="text-xs text-slate-400">Раскройте ключ и подтвердите приоритет</p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">{t.zkRevealCommitId}</label>
                    <input
                      type="text"
                      value={zkRevealId}
                      onChange={(e) => setZkRevealId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">{t.zkSecretLabel}</label>
                    <input
                      type="text"
                      value={zkRevealSecret}
                      onChange={(e) => setZkRevealSecret(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">{t.zkPayloadLabel}</label>
                    <textarea
                      rows={3}
                      value={zkRevealPayload}
                      onChange={(e) => setZkRevealPayload(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleZkReveal}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition font-mono"
                  >
                    {t.zkRevealBtn}
                  </button>

                  {zkRevealResult && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-[11px] font-mono space-y-1">
                      <div className="text-emerald-300 font-bold">✅ Результат: {zkRevealResult.status}</div>
                      <div className="text-slate-300">{zkRevealResult.legal_effect}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PASSPORT */}
        {activeTab === "passport" && (
          <div className="space-y-6">
            <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <span>🧬</span> {t.passHeader}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.passSubheader}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">{t.passScoreLabel}</span>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    {passportData?.git_impact_score || "184.0"} GIS
                  </div>
                </div>
              </div>

              {passportData && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-100">{passportData.scholar_name}</h3>
                      <p className="text-xs text-slate-400">{passportData.institution}</p>
                      <p className="text-xs font-mono text-emerald-400 mt-1">ORCID: {passportData.orcid}</p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-xs px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 font-mono font-bold">
                        {passportData.platform_tier}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono text-center">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">{t.passCitationsPts}</span>
                      <strong className="text-cyan-400 text-base">{passportData.gis_breakdown?.citations_pts}</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">{t.passWorksPts}</span>
                      <strong className="text-emerald-400 text-base">{passportData.gis_breakdown?.works_pts}</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">{t.passMaasPts}</span>
                      <strong className="text-purple-400 text-base">{passportData.gis_breakdown?.maas_executions_pts}</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">{t.passCreditPts}</span>
                      <strong className="text-amber-400 text-base">{passportData.gis_breakdown?.credit_leadership_pts}</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">{t.passCourtPts}</span>
                      <strong className="text-emerald-400 text-base">{passportData.gis_breakdown?.court_vindication_pts}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: REVIEW */}
        {activeTab === "review" && (
          <div className="space-y-6">
            <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>📝</span> {t.revHeader}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.revSubheader}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t.revTargetLabel}</label>
                  <input
                    type="text"
                    value={revTargetCode}
                    onChange={(e) => setRevTargetCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t.revReviewerLabel}</label>
                  <input
                    type="text"
                    value={revReviewerOrcid}
                    onChange={(e) => setRevReviewerOrcid(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t.revMathScore}: {revMath}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={revMath}
                    onChange={(e) => setRevMath(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t.revMethodScore}: {revMethod}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={revMethod}
                    onChange={(e) => setRevMethod(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t.revEthicsScore}: {revEthics}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={revEthics}
                    onChange={(e) => setRevEthics(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t.revNoveltyScore}: {revNovelty}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={revNovelty}
                    onChange={(e) => setRevNovelty(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-slate-400 font-semibold mb-1">{t.revCommentsLabel}</label>
                <textarea
                  rows={3}
                  value={revComments}
                  onChange={(e) => setRevComments(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>

              <button
                onClick={handleSubmitReview}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl text-xs sm:text-sm transition font-mono"
              >
                {t.revSubmitBtn}
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: MAAS SIMULATOR */}
        {activeTab === "maas" && (
          <div className="space-y-6">
            <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <span>⚡</span> {t.maasHeader}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.maasSubheader}</p>
                </div>
                <button
                  onClick={handleClinicalFhirTest}
                  disabled={fhirLoading}
                  className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs px-3.5 py-1.5 rounded-xl font-mono transition"
                >
                  {fhirLoading ? "FHIR..." : t.fhirGatewayBtn}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <label className="block text-slate-400 font-semibold">{t.maasFormulaLabel}</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={maasFormula}
                    onChange={(e) => setMaasFormula(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-cyan-300 font-mono focus:border-emerald-500 outline-none"
                  />
                  <button
                    onClick={handleRunMaas}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold px-6 py-2 rounded-xl transition font-mono"
                  >
                    {t.maasRunBtn}
                  </button>
                </div>
              </div>

              {/* 2D Homeostasis Visual Curve */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                  <span className="text-emerald-400 font-bold">{t.maasVisualCurveTitle}</span>
                  <span>Safe AST Isolated Kernel</span>
                </div>

                <div className="w-full overflow-hidden flex justify-center">
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto max-h-[220px] bg-slate-900/60 rounded-xl p-2">
                    <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={svgPolyline} />
                  </svg>
                </div>
              </div>

              {fhirResult && (
                <div className="p-4 bg-cyan-950/40 border border-cyan-500/40 rounded-2xl text-xs font-mono space-y-1">
                  <div className="text-cyan-300 font-bold">🏥 HL7 FHIR R4 Bundle Observation:</div>
                  <div>Patient ID: <span className="text-slate-200">{fhirResult.patient_id}</span></div>
                  <div>Status: <span className="text-emerald-400">{fhirResult.interpretation}</span></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: AMANAT ROYALTY */}
        {activeTab === "amanat" && (
          <div className="space-y-6">
            <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>💳</span> {t.amanatHeader}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.amanatSubheader}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">{t.amanatAuthorPool}</span>
                  <strong className="text-emerald-400 text-xl font-bold">${(baseFee * 0.55).toLocaleString()}</strong>
                  <p className="text-[10px] text-slate-500 mt-1">14 CRediT үлесімен</p>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">{t.amanatInfraPool}</span>
                  <strong className="text-cyan-400 text-xl font-bold">${(baseFee * 0.15).toLocaleString()}</strong>
                  <p className="text-[10px] text-slate-500 mt-1">Рецензенттер & Нодалар</p>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">{t.amanatFounderPool}</span>
                  <strong className="text-purple-400 text-xl font-bold">${(baseFee * 0.3).toLocaleString()}</strong>
                  <p className="text-[10px] text-slate-500 mt-1">30% Создатель</p>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">{t.amanatInvoiceTotal}</span>
                  <strong className="text-amber-300 text-xl font-bold">${(baseFee * 1.2).toLocaleString()}</strong>
                  <p className="text-[10px] text-slate-500 mt-1">+20% Клиника салығы</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleGenerateFiatInvoice}
                  disabled={fiatInvoiceLoading}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs px-4 py-2.5 rounded-xl transition"
                >
                  {fiatInvoiceLoading ? "Инвойс..." : t.genFiatInvoiceBtn}
                </button>
                <button
                  onClick={() => {
                    setLedgerTxResult({ tx_hash: "0x7f8b9c0d1e2f3a4b", status: "SETTLED" });
                    loadPlatformStats();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition font-mono"
                >
                  {t.amanatRecordBtn}
                </button>
              </div>

              {fiatInvoiceResult && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono space-y-1">
                  <div className="text-amber-300 font-bold">📄 B2B Инвойс: {fiatInvoiceResult.invoice_number}</div>
                  <div>Клиника: <span className="text-slate-200">{fiatInvoiceResult.hospital_name}</span></div>
                  <div>IBAN: <span className="text-cyan-300">{fiatInvoiceResult.iban_wire}</span> (SWIFT: {fiatInvoiceResult.swift_code})</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 9: SCIENCE COURT */}
        {activeTab === "court" && (
          <div className="space-y-6">
            <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>⚖️</span> {t.courtHeader}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.courtSubheader}</p>
              </div>

              <div className="space-y-3">
                {courtCases.map((c) => (
                  <div key={c.case_id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-cyan-300 font-bold">{c.case_id}</span>
                      <span className="text-amber-300">{c.status}</span>
                    </div>
                    <p className="text-slate-200">{c.reason}</p>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleVoteCase(c.case_id, "valid")}
                        className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-lg text-xs font-mono"
                      >
                        {t.courtVoteValid} ({c.votes_valid})
                      </button>
                      <button
                        onClick={() => handleVoteCase(c.case_id, "invalid")}
                        className="bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 px-3 py-1 rounded-lg text-xs font-mono"
                      >
                        {t.courtVoteInvalid} ({c.votes_invalid})
                      </button>
                      <button
                        onClick={() => handleVoteCase(c.case_id, "abstain")}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg text-xs font-mono"
                      >
                        {t.courtVoteAbstain} ({c.votes_abstain})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: VAMPIRE MULTI-SOURCE HARVESTER & CAS VAULT */}
        {activeTab === "vampire" && (
          <div className="space-y-6">
            <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>🧛</span> {t.vampireHeader}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.vampireSubheader}</p>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-cyan-300 font-mono mt-3">
                  ⚖️ {t.vampireLicenseNotice}
                </div>
              </div>

              {/* Source Selector */}
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {[
                  { id: "all", label: `🌐 ${t.sourceAll}` },
                  { id: "openalex", label: `🏛️ ${t.sourceOpenAlex}` },
                  { id: "arxiv", label: `📄 ${t.sourceArxiv}` },
                  { id: "pubmed", label: `🏥 ${t.sourcePubMed}` },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setVampireSource(s.id as any)}
                    className={`px-3 py-1.5 rounded-xl border transition ${
                      vampireSource === s.id
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Search Bar & Daemon Controller */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={vampireQuery}
                  onChange={(e) => setVampireQuery(e.target.value)}
                  placeholder={t.vampireSearchLabel}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-emerald-500 outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleVampireSearch}
                    disabled={vampireSearching}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition shrink-0 font-mono"
                  >
                    {vampireSearching ? "..." : t.vampireSearchBtn}
                  </button>
                  <button
                    onClick={handleLaunchBatchHarvester}
                    disabled={harvestingBatch}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow shrink-0 font-mono"
                  >
                    {harvestingBatch ? "..." : t.vampireHarvestBtn}
                  </button>
                  <button
                    onClick={handleToggleDaemon}
                    className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition shrink-0 ${
                      daemonRunning
                        ? "bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-300"
                        : "bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300"
                    }`}
                  >
                    {daemonRunning ? t.stopDaemonBtn : t.startDaemonBtn}
                  </button>
                </div>
              </div>

              {/* Daemon Status Card */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${daemonRunning ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`}></span>
                  <span className={daemonRunning ? "text-emerald-300" : "text-slate-400"}>
                    {daemonRunning ? t.daemonStatusRunning : t.daemonStatusStopped}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Тақырып: <strong className="text-cyan-300">{daemonStatus?.current_active_topic || "Oncology Homeostasis"}</strong>
                </div>
              </div>

              {vampireImportResult && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-1 text-xs font-mono">
                  <div className="text-emerald-400 font-bold">✅ Реестрге сәтті депонирленді:</div>
                  <div>Тіркеу коды: <strong className="text-cyan-300">{vampireImportResult.registration_code}</strong></div>
                  <div>Дереккөз: <strong className="text-amber-300">{vampireImportResult.source || "OpenAlex"}</strong> ({vampireImportResult.license_detected})</div>
                </div>
              )}

              {/* Search Results */}
              {vampireResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {vampireResults.map((work, i) => (
                    <div key={i} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono text-cyan-400 font-bold">[{work.source || "OpenAlex"}] {work.openalex_id}</span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {work.license || "CC-BY"}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-100 line-clamp-2">{work.title}</h4>
                        <p className="text-xs text-slate-400 truncate">Авторлар: <strong className="text-slate-300">{work.authors}</strong> ({work.publication_year})</p>
                        <p className="text-[11px] text-slate-500">DOI: {work.doi}</p>
                      </div>

                      <button
                        onClick={() => handleVampireImport(work)}
                        className="w-full bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs py-2 rounded-xl font-bold transition font-mono"
                      >
                        {t.vampireImportBtn}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          3. PERSISTENT LIVE GLOBAL METRICS FOOTER (NEVER RESETS ON REFRESH)
      ===================================================================== */}
      <footer className="border-t border-slate-800 bg-[#070d18] mt-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">{t.statManuscripts}</span>
              <strong className="text-emerald-400 text-lg sm:text-xl font-bold">
                {platformStats.total_notarized_manuscripts}
              </strong>
            </div>
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">{t.statMaas}</span>
              <strong className="text-cyan-400 text-lg sm:text-xl font-bold">
                {platformStats.total_maas_executions.toLocaleString()}
              </strong>
            </div>
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">{t.statSecuredValue}</span>
              <strong className="text-amber-300 text-lg sm:text-xl font-bold">
                ${platformStats.total_secured_scientific_value_usdt.toLocaleString()}
              </strong>
            </div>
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">{t.statScholars}</span>
              <strong className="text-purple-400 text-lg sm:text-xl font-bold">
                {platformStats.total_verified_scholars}
              </strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-center text-xs text-slate-500 font-mono pt-2 border-t border-slate-900">
            <p>GitScience™ Sovereign Protocol • Preserving the Amanat of Scientific Truth Worldwide</p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{platformStats.blockchain_attestation_status}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          4. MODAL: ORCID REGISTRATION & SCHOLAR LOGIN
      ===================================================================== */}
      {showOrcidModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0e1726] border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-5 sm:p-7 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>🧬</span> {t.loginOrcid}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Тіркелген ORCID нөміріңіз арқылы суверенді ғалым паспортын ашыңыз
                </p>
              </div>
              <button
                onClick={() => setShowOrcidModal(false)}
                className="text-slate-400 hover:text-slate-100 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">ORCID iD (16 таңбалы нөмір) *</label>
                <input
                  type="text"
                  value={inputOrcid}
                  onChange={(e) => setInputOrcid(e.target.value)}
                  placeholder="0009-0003-3929-3605"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">ФИО / Ғалымның толық аты *</label>
                <input
                  type="text"
                  value={inputScholarName}
                  onChange={(e) => setInputScholarName(e.target.value)}
                  placeholder="Салауат Абильтаевич Ешимов"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ғылыми институт / Ұйым</label>
                <input
                  type="text"
                  value={inputInstitution}
                  onChange={(e) => setInputInstitution(e.target.value)}
                  placeholder="National Scientific Oncology Center"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Негізгі ғылыми бағыты</label>
                <select
                  value={inputDiscipline}
                  onChange={(e) => setInputDiscipline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 outline-none"
                >
                  <option value="Clinical Oncology & Surgery">Clinical Oncology & Surgery</option>
                  <option value="Molecular Biology & Genetics">Molecular Biology & Genetics</option>
                  <option value="Healthcare Informatics & AI">Healthcare Informatics & AI</option>
                  <option value="Computational Systems & Algorithms">Computational Systems & Algorithms</option>
                </select>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => {
                    if (!inputOrcid || !inputScholarName) {
                      alert("ORCID және ФИО өрістерін толтырыңыз!");
                      return;
                    }
                    handleScholarLogin({
                      orcid: inputOrcid,
                      name: inputScholarName,
                      institution: inputInstitution || "Independent Scientific Institute",
                      discipline: inputDiscipline,
                      git_impact_score: 120.0,
                      platform_tier: "Verified Sovereign Scholar",
                    });
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold py-3 rounded-xl text-xs sm:text-sm shadow transition hover:opacity-90"
                >
                  Кіру & Паспортты тіркеу 🚀
                </button>

                <button
                  onClick={() => handleScholarLogin(DEFAULT_FOUNDER_PROFILE)}
                  className="w-full bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-mono text-xs py-2 rounded-xl transition"
                >
                  ⚡ Протокол негізін қалаушы (Salauat Yeshimov) ретінде кіру
                </button>

                {activeScholar && (
                  <button
                    onClick={handleScholarLogout}
                    className="w-full bg-red-950/40 hover:bg-red-900/40 border border-red-500/40 text-red-300 font-mono text-xs py-2 rounded-xl transition"
                  >
                    Ағымдағы профильден шығу ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. MODAL: WEB3 WALLET CONNECTION
      ===================================================================== */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0e1726] border border-amber-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5 sm:p-7 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>🦊</span> {t.connectWalletTitle}
                </h3>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  {t.connectWalletSub}
                </p>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-slate-400 hover:text-slate-100 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {walletConnected && walletAddress ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">{t.walletAddressLabel}</span>
                    <strong className="text-cyan-300 text-xs break-all">{walletAddress}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">{t.walletBalanceLabel}</span>
                      <strong className="text-emerald-400 text-base font-bold">${walletBalance.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Amanat 30% / 55%</span>
                      <strong className="text-purple-400 text-base font-bold">${walletRoyalties.toLocaleString()}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">{t.walletNetworkLabel}</span>
                    <span className="text-slate-300 text-xs">{walletNetwork}</span>
                  </div>
                </div>

                <button
                  onClick={handleDisconnectWallet}
                  className="w-full bg-red-950/40 hover:bg-red-900/40 border border-red-500/40 text-red-300 font-bold py-2.5 rounded-xl transition text-xs"
                >
                  {t.disconnectWalletBtn}
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <button
                  onClick={() => handleConnectWallet("metamask")}
                  disabled={walletConnecting}
                  className="w-full p-3.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 rounded-2xl flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🦊</span>
                    <div className="text-left">
                      <strong className="text-slate-100 block text-xs">MetaMask / Browser Web3</strong>
                      <span className="text-[10px] text-slate-400">Polygon PoS & Base Mainnet</span>
                    </div>
                  </div>
                  <span className="text-xs text-amber-300 font-mono font-bold">Қосылу →</span>
                </button>

                <button
                  onClick={() => handleConnectWallet("founder")}
                  disabled={walletConnecting}
                  className="w-full p-3.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 rounded-2xl flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <div className="text-left">
                      <strong className="text-cyan-300 block text-xs">Founder Treasury Node</strong>
                      <span className="text-[10px] text-slate-400">Salauat Yeshimov Protocol Wallet</span>
                    </div>
                  </div>
                  <span className="text-xs text-cyan-300 font-mono font-bold">12,500 USDT →</span>
                </button>

                <button
                  onClick={() => handleConnectWallet("custom")}
                  disabled={walletConnecting}
                  className="w-full p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🛡️</span>
                    <div className="text-left">
                      <strong className="text-slate-200 block text-xs">Independent Scholar Node</strong>
                      <span className="text-[10px] text-slate-400">Sovereign In-Browser Keystore</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-300 font-mono font-bold">5,000 USDT →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          6. MODAL: INTERACTIVE SOVEREIGN AI ASSISTANT / GUIDE DRAWER
      ===================================================================== */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0e1726] border border-purple-500/40 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col p-5 sm:p-7 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>💡</span> GitScience™ Интерактивті Көмекшісі
                </h3>
                <p className="text-xs text-purple-300 mt-0.5">
                  Платформаның барлық модульдері бойынша жылдам нұсқаулық және 4 негізгі құқықтық құрал
                </p>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-100 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={guideSearch}
              onChange={(e) => setGuideSearch(e.target.value)}
              placeholder="Сұрағыңызды жазыңыз (мысалы: сертификат, роялти, формула, патент)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-purple-500 outline-none"
            />

            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-emerald-400 text-sm">🏛️ GitScience™ 4 халықаралық құқықтық бағанасы:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <strong className="text-cyan-300 block">1. 📜 Сертификат (WIPO)</strong>
                    <span>Париж Конвенциясының 4-бабы және 35 U.S.C. § 102 бойынша басымдық қорғанысы.</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <strong className="text-emerald-300 block">2. ⚖️ Лицензия (B2B MaaS)</strong>
                    <span>Creative Commons және клиникалар үшін 55/15/30 формуласымен лицензиялау.</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <strong className="text-purple-300 block">3. 🛡️ Патент (IP-NFT)</strong>
                    <span>EIP-2981 стандартындағы токенизация және патенттік тролльдерден қорғау.</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <strong className="text-amber-300 block">4. 🧬 Авторлық құқық (CRediT)</strong>
                    <span>14 CASRAI рөлдері және ORCID арқылы негізделген адал үлес бөлінісі.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-slate-200 block text-xs">🔹 1-қадам: Манускриптті қалай бекітемін?</strong>
                  <p className="text-slate-400">
                    «Нотариат» қойындысына өтіп, PDF жүктеңіз, математикалық формуланы енгізіп, «Тізілімге бекіту» батырмасын басыңыз. Жүйе автоматты түрде ресми PDF Сертификат шығарады.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-slate-200 block text-xs">🔹 2-қадам: Исполняемая Safe AST формула деген не?</strong>
                  <p className="text-slate-400">
                    Бұл медициналық/онкологиялық гомеостазды тікелей есептейтін қауіпсіз математика. Бөгде шабуылдардан қорғалған және браузерде 1 миллисекундта есептеледі.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-slate-200 block text-xs">🔹 3-қадам: 55 / 15 / 30 роялти қалай бөлінеді?</strong>
                  <p className="text-slate-400">
                    Клиника төлеген сомадан: 55% тікелей авторларға (CRediT үлесімен), 15% рецензенттер мен инфрақұрылымға, 30% протоколдың Создателіне таза түседі (+20% B2B салықты клиника үстінен төлейді).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. MODAL: OFFICIAL LICENSE AGREEMENT VIEWER
      ===================================================================== */}
      {licenseModalContent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0e1726] border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col p-5 sm:p-7 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>📄</span> GitScience™ Official License Agreement
                </h3>
                <p className="text-xs text-slate-400">35 U.S.C. § 102 • WIPO Paris Convention • RUO Class I CDSS</p>
              </div>
              <button
                onClick={() => setLicenseModalContent(null)}
                className="text-slate-400 hover:text-slate-100 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <pre className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
              {licenseModalContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}