import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── Backend URL ──────────────────────────────────────────────────────────────
const ORACLE_URL = "https://functions.poehali.dev/87a15039-8803-4553-80e8-3819a6e7a050";

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "genomics", icon: "Dna", label: "Геномодификация", tag: "CRISPR / СИНТЕТИЧЕСКАЯ БИОЛОГИЯ", color: "cyan", description: "CRISPR-Cas9, редактирование генома, терапия старения на уровне ДНК. Отключение генов CDKN2A, активация теломеразы.", status: "Активные испытания", progress: 72 },
  { id: "neuro", icon: "Brain", label: "Нейромодификация", tag: "BCI / НЕЙРОИНТЕРФЕЙСЫ", color: "gold", description: "Нейральные имплантаты, Brain-Computer Interface (Neuralink, BrainGate), усиление когнитивных функций.", status: "Клинические тесты", progress: 45 },
  { id: "implants", icon: "Cpu", label: "Биоимплантаты", tag: "КИБОРГИЗАЦИЯ / АУГМЕНТАЦИЯ", color: "crimson", description: "Бионические органы, нанороботы в кровотоке, экзоскелеты, искусственные кости и хрящи.", status: "Коммерчески доступно", progress: 68 },
  { id: "science", icon: "FlaskConical", label: "Наука о Старении", tag: "ГЕРОНТОЛОГИЯ / LONGEVITY", color: "sage", description: "Сенолитики, NAD+, рапамицин, метформин, факторы Яманака, перепрограммирование клеток.", status: "Продвинутые исследования", progress: 81 },
  { id: "cryo", icon: "Snowflake", label: "Крионика", tag: "КРИКОСОХРАНЕНИЕ / ВИТРИФИКАЦИЯ", color: "cyan", description: "Витрификация тела после смерти, хранение при -196°C, Alcor Life Extension.", status: "Действующая практика", progress: 35 },
  { id: "nano", icon: "Atom", label: "Нанотехнологии", tag: "НАНОМЕДИЦИНА / САМОСБОРКА", color: "gold", description: "Наноботы-врачи, самособирающиеся структуры, целевая доставка лекарств.", status: "Ранние разработки", progress: 28 },
  { id: "folk", icon: "Leaf", label: "Народная Медицина", tag: "ФИТОТЕРАПИЯ / АДАПТОГЕНЫ", color: "sage", description: "Ашваганда, женьшень, родиола, астрагал, куркумин, ресвератрол, интервальное голодание.", status: "Доказательная база растёт", progress: 60 },
  { id: "upload", icon: "Cloud", label: "Загрузка Сознания", tag: "ЦИФРОВОЕ БЕССМЕРТИЕ", color: "crimson", description: "Эмуляция мозга, цифровые копии личности, Whole Brain Emulation, постбиологическое существование.", status: "Теоретическая стадия", progress: 12 },
];

const IMMORTALITY_PATH = [
  { phase: "I", title: "Биологическая Оптимизация", desc: "Диета, физ. нагрузки, НАД+, сенолитики, гормональная коррекция", years: "0–5 лет", color: "sage" },
  { phase: "II", title: "Геномная Коррекция", desc: "CRISPR-терапия, активация теломеразы, эпигенетическое перепрограммирование по протоколу OSK", years: "5–15 лет", color: "cyan" },
  { phase: "III", title: "Кибернетическая Интеграция", desc: "Нейроимплантаты, бионические органы, усиление сенсоров, BCI-интерфейсы", years: "15–30 лет", color: "gold" },
  { phase: "IV", title: "Наноремонт", desc: "Постоянный ремонт клеток нанороботами, устранение повреждений ДНК в реальном времени", years: "30–50 лет", color: "crimson" },
  { phase: "V", title: "Цифровое Бессмертие", desc: "Перенос сознания в субстрат, постбиологическое существование, слияние с ИИ", years: "50+ лет", color: "gold" },
];

const AI_RESPONSES = [
  "Анализирую последние публикации PubMed по теломеразной активности...",
  "Найдено 2847 научных работ по сенолитической терапии за 2024 год...",
  "Протокол Яманака: in vivo перепрограммирование показало +30% к продолжительности жизни мышей...",
  "CRISPR-атаки на ген p16INK4a: 3 активных клинических испытания Phase II...",
  "Neuralink: зафиксирован первый случай телепатической коммуникации человек-машина...",
  "Rapamycin: ингибитор mTOR продлевает жизнь на 25% в исследованиях на млекопитающих...",
];

const colorMap: Record<string, { border: string; text: string; bg: string; pill: string }> = {
  cyan:    { border: "border-cyan-500/30",    text: "text-cyan-400",    bg: "bg-cyan-500/10",    pill: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" },
  gold:    { border: "border-yellow-500/30",  text: "text-yellow-400",  bg: "bg-yellow-500/10",  pill: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" },
  crimson: { border: "border-red-600/30",     text: "text-red-400",     bg: "bg-red-600/10",     pill: "bg-red-600/20 text-red-300 border border-red-600/30" },
  sage:    { border: "border-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500/10", pill: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Article {
  id: number;
  title: string;
  content: string;
  tags: string | null;
  source: string | null;
  created_at: string;
}

// ─── Particles ────────────────────────────────────────────────────────────────

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; gold: boolean }[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 - 0.05, r: Math.random() * 1.5 + 0.3, a: Math.random(), gold: Math.random() > 0.6 });
    }
    let raf: number;
    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold ? `rgba(212,175,55,${p.a * 0.6})` : `rgba(130,200,220,${p.a * 0.4})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        p.a += (Math.random() - 0.5) * 0.02;
        if (p.a < 0.1) p.a = 0.1; if (p.a > 0.9) p.a = 0.9;
        if (p.x < 0) p.x = canvas!.width; if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height; if (p.y > canvas!.height) p.y = 0;
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} id="particles-canvas" />;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ value, color }: { value: number; color: string }) {
  const colors: Record<string, string> = { cyan: "from-cyan-500 to-cyan-300", gold: "from-yellow-600 to-yellow-400", crimson: "from-red-700 to-red-400", sage: "from-emerald-700 to-emerald-400" };
  return (
    <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${colors[color]} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }} />
    </div>
  );
}

function CategoryCard({ cat, onClick, active }: { cat: typeof CATEGORIES[0]; onClick: () => void; active: boolean }) {
  const c = colorMap[cat.color];
  return (
    <div onClick={onClick} className={`hover-lift cursor-pointer rounded-sm p-4 transition-all duration-300 border ${active ? `${c.border} ${c.bg}` : "border-white/5 bg-white/2 hover:border-white/10"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-sm ${c.bg} ${c.border} border`}><Icon name={cat.icon} size={16} className={c.text} /></div>
        <span className={`pill text-[10px] ${c.pill}`}>{cat.status}</span>
      </div>
      <h3 className="font-display text-base font-semibold text-white/90 mb-1">{cat.label}</h3>
      <p className="section-tag mb-3" style={{ fontSize: "0.6rem" }}>{cat.tag}</p>
      <p className="text-xs text-white/40 leading-relaxed mb-3 line-clamp-2">{cat.description}</p>
      <div className="flex items-center gap-2">
        <ProgressBar value={cat.progress} color={cat.color} />
        <span className={`text-[10px] font-mono ${c.text} w-8 text-right`}>{cat.progress}%</span>
      </div>
    </div>
  );
}

// ─── AI Chat Component ────────────────────────────────────────────────────────

function AiChat({ section, placeholder, accentColor }: { section: string; placeholder: string; accentColor: string }) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ask = useCallback(async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setResponse("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(ORACLE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, section }),
      });
      const data = await res.json();
      if (data.answer) {
        setResponse(data.answer);
      } else {
        setError("Нет ответа от ИИ");
      }
    } catch {
      setError("Ошибка соединения с ИИ");
    } finally {
      setLoading(false);
    }
  }, [input, loading, section]);

  const borderColor = accentColor === "gold" ? "border-yellow-500/30 focus:border-yellow-500/50" : accentColor === "sage" ? "border-emerald-500/30 focus:border-emerald-500/50" : accentColor === "cyan" ? "border-cyan-500/30 focus:border-cyan-500/50" : "border-red-500/30";
  const btnClass = accentColor === "gold" ? "btn-primary" : accentColor === "sage" ? "bg-emerald-700 hover:bg-emerald-600 text-white font-title tracking-widest uppercase text-xs px-4 py-1.5 rounded-sm transition-all" : "bg-cyan-700 hover:bg-cyan-600 text-white font-title tracking-widest uppercase text-xs px-4 py-1.5 rounded-sm transition-all";
  const textColor = accentColor === "gold" ? "text-yellow-300" : accentColor === "sage" ? "text-emerald-300" : accentColor === "cyan" ? "text-cyan-300" : "text-red-300";
  const borderLeft = accentColor === "gold" ? "border-l-yellow-400" : accentColor === "sage" ? "border-l-emerald-400" : "border-l-cyan-400";

  return (
    <div className="mt-4">
      <div className="relative mb-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}
          placeholder={placeholder}
          rows={2}
          className={`w-full bg-white/3 border ${borderColor} rounded-sm px-4 py-3 pr-32 text-sm text-white/75 placeholder:text-white/20 focus:outline-none resize-none transition-all`}
        />
        <button onClick={ask} disabled={loading} className={`absolute bottom-2.5 right-2.5 ${btnClass} ${loading ? "opacity-40 cursor-not-allowed" : ""}`}>
          {loading ? "..." : "Спросить"}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
      {(response || loading) && (
        <div className={`ai-response rounded-sm p-4 border-l-2 ${borderLeft} animate-fade-in-up`}>
          <div className={`section-tag mb-2 ${textColor}`} style={{ fontSize: "0.55rem" }}>ОТВЕТ ИИ</div>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ color: "currentColor" }} />
              <span className="text-white/40 text-xs animate-pulse">ИИ анализирует...</span>
            </div>
          ) : (
            <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{response}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Knowledge Section ────────────────────────────────────────────────────────

function KnowledgeSection({ section, title, subtitle, icon, accentColor, chatPlaceholder, generatePrompt }: {
  section: string; title: string; subtitle: string; icon: string;
  accentColor: string; chatPlaceholder: string; generatePrompt: string;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addInput, setAddInput] = useState("");
  const [showAddManual, setShowAddManual] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  const c = colorMap[accentColor] || colorMap.cyan;

  const loadArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch(`${ORACLE_URL}?action=articles&section=${section}`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch {
      // silent
    } finally {
      setLoadingArticles(false);
    }
  }, [section]);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  const generateArticle = async () => {
    if (!genTopic.trim() || generating) return;
    setGenerating(true);
    try {
      const res = await fetch(ORACLE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: genTopic, section, save: true }),
      });
      const data = await res.json();
      if (data.saved) {
        setGenTopic("");
        loadArticles();
      }
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  };

  const saveManual = async () => {
    if (!addInput.trim() || savingManual) return;
    setSavingManual(true);
    try {
      const res = await fetch(ORACLE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: addInput, section, save: true }),
      });
      const data = await res.json();
      if (data.saved) {
        setAddInput("");
        setShowAddManual(false);
        loadArticles();
      }
    } catch {
      // silent
    } finally {
      setSavingManual(false);
    }
  };

  const deleteArticle = async (id: number) => {
    try {
      await fetch(ORACLE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", article_id: id, section }),
      });
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silent
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="ornament-divider mb-6">
        <span className="font-display text-2xl text-white/65 italic">{title}</span>
      </div>
      <p className="text-white/35 text-sm text-center mb-8">{subtitle}</p>

      {/* Generate with AI */}
      <div className={`rounded-sm p-5 border ${c.border} ${c.bg} mb-6`}>
        <div className={`section-tag mb-2 ${c.text}`} style={{ fontSize: "0.6rem" }}>
          <Icon name="Sparkles" size={10} className="inline mr-1" />
          ИИ СОЗДАЁТ И СОХРАНЯЕТ МАТЕРИАЛ
        </div>
        <p className="text-white/40 text-xs mb-3">{generatePrompt}</p>
        <div className="flex gap-2">
          <input
            value={genTopic}
            onChange={(e) => setGenTopic(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") generateArticle(); }}
            placeholder="Введи тему — ИИ напишет и сохранит статью..."
            className={`flex-1 bg-white/3 border ${c.border} rounded-sm px-3 py-2 text-sm text-white/75 placeholder:text-white/20 focus:outline-none transition-all`}
          />
          <button
            onClick={generateArticle}
            disabled={generating}
            className={`px-4 py-2 rounded-sm font-title uppercase tracking-widest text-xs transition-all ${c.bg} border ${c.border} ${c.text} hover:opacity-80 ${generating ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {generating ? <span className="animate-pulse">Пишу...</span> : "Создать"}
          </button>
        </div>
      </div>

      {/* Manual add */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddManual(!showAddManual)}
          className="flex items-center gap-2 btn-ghost px-4 py-2 rounded-sm text-xs"
        >
          <Icon name="Plus" size={13} />
          Добавить запись вручную
        </button>
        {showAddManual && (
          <div className="mt-3 flex gap-2 animate-fade-in-up">
            <textarea
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              placeholder="Опишите тему или рецепт — ИИ структурирует и добавит в базу..."
              rows={2}
              className="flex-1 bg-white/3 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/75 placeholder:text-white/20 focus:outline-none resize-none"
            />
            <button onClick={saveManual} disabled={savingManual} className="btn-primary px-4 py-2 rounded-sm text-xs relative overflow-hidden">
              <span className="relative z-10">{savingManual ? "..." : "Добавить"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Articles list */}
      {loadingArticles ? (
        <div className="text-center py-12">
          <div className={`text-2xl mb-2 ${c.text} animate-pulse`}><Icon name={icon} size={32} className="inline" /></div>
          <p className="text-white/30 text-sm">Загрузка базы знаний...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 border border-white/5 rounded-sm">
          <Icon name={icon} size={40} className={`${c.text} opacity-30 mx-auto mb-3`} />
          <p className="text-white/25 text-sm mb-1">База знаний пуста</p>
          <p className="text-white/15 text-xs">Попроси ИИ создать первую статью</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {articles.map((article) => (
            <div key={article.id} className={`rounded-sm border ${expandedId === article.id ? `${c.border} ${c.bg}` : "border-white/5 bg-white/2"} transition-all duration-300`}>
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-white/85 text-base leading-tight truncate">{article.title}</h3>
                  <p className="text-white/25 text-xs mt-0.5">{new Date(article.created_at).toLocaleDateString("ru-RU")}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteArticle(article.id); }}
                    className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded"
                  >
                    <Icon name="Trash2" size={13} />
                  </button>
                  <Icon name={expandedId === article.id ? "ChevronUp" : "ChevronDown"} size={15} className="text-white/30" />
                </div>
              </div>
              {expandedId === article.id && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 animate-fade-in-up">
                  <div className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{article.content}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chat for this section */}
      <div className={`rounded-sm border ${c.border} p-5`}>
        <div className={`section-tag mb-1 ${c.text}`} style={{ fontSize: "0.55rem" }}>
          <Icon name="MessageSquare" size={10} className="inline mr-1" />
          ЧАТ С ИИ ПО РАЗДЕЛУ
        </div>
        <p className="text-white/25 text-xs mb-2">Задай вопрос — ИИ найдёт информацию в этой области</p>
        <AiChat section={section} placeholder={chatPlaceholder} accentColor={accentColor} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [aiText, setAiText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiIndex, setAiIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"search" | "plan" | "oracle" | "immortality" | "folk" | "official">("search");
  const [oracleInput, setOracleInput] = useState("");
  const [oracleResponse, setOracleResponse] = useState("");
  const [isOracleTyping, setIsOracleTyping] = useState(false);
  const [oracleError, setOracleError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const text = AI_RESPONSES[aiIndex % AI_RESPONSES.length];
      setAiText(""); setIsTyping(true);
      let i = 0;
      const typer = setInterval(() => {
        setAiText(text.slice(0, i)); i++;
        if (i > text.length) { clearInterval(typer); setIsTyping(false); setAiIndex((n) => n + 1); }
      }, 35);
      return () => clearInterval(typer);
    }, 4500);
    return () => clearInterval(timer);
  }, [aiIndex]);

  const activeCat = CATEGORIES.find((c) => c.id === activeCategory);

  const askOracle = async () => {
    if (!oracleInput.trim() || isOracleTyping) return;
    const q = oracleInput;
    setOracleInput(""); setOracleResponse(""); setOracleError(""); setIsOracleTyping(true);
    try {
      const res = await fetch(ORACLE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, section: "oracle" }),
      });
      const data = await res.json();
      if (data.answer) setOracleResponse(data.answer);
      else setOracleError("Нет ответа от Оракула");
    } catch {
      setOracleError("Ошибка соединения с Оракулом");
    } finally {
      setIsOracleTyping(false);
    }
  };

  type Tab = "search" | "plan" | "oracle" | "immortality" | "folk" | "official";
  const NAV_TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "search", label: "Исследования", icon: "Search" },
    { id: "plan", label: "План", icon: "Map" },
    { id: "oracle", label: "Оракул", icon: "Sparkles" },
    { id: "immortality", label: "Бессмертие", icon: "Infinity" },
    { id: "folk", label: "Народная", icon: "Leaf" },
    { id: "official", label: "Медицина", icon: "Stethoscope" },
  ];

  return (
    <div className="min-h-screen hex-bg relative">
      <ParticleCanvas />
      <div className="relative z-10">

        {/* NAVBAR */}
        <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-black/60">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border border-yellow-500/40 animate-rotate-slow" />
                <div className="absolute inset-1.5 rounded-full border border-cyan-500/25" />
                <div className="absolute inset-0 flex items-center justify-center text-yellow-400 text-base">⚚</div>
              </div>
              <div className="hidden sm:block">
                <div className="font-display text-lg font-bold glow-gold text-yellow-400 tracking-widest leading-none">ÆTERNUM</div>
                <div className="section-tag leading-none" style={{ fontSize: "0.5rem" }}>ИИ ОРАКУЛ БЕССМЕРТИЯ</div>
              </div>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {NAV_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-title uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === t.id
                      ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                      : "text-white/35 hover:text-white/60 border border-transparent hover:border-white/10"
                  }`}
                >
                  <Icon name={t.icon} size={11} />
                  <span className="hidden md:inline">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-title text-[10px] text-white/35 tracking-widest uppercase hidden sm:inline">Live ИИ</span>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="relative overflow-hidden min-h-[60vh] flex items-center">
          <div className="absolute inset-0">
            <img src="https://cdn.poehali.dev/projects/c6855e81-3df9-4181-94ae-a4ac24b5c2f8/files/d045f787-a8cd-4e0a-ba73-fe2b35c6df9f.jpg" className="w-full h-full object-cover opacity-15" alt="" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 py-20 text-center w-full">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/5">
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <span className="section-tag" style={{ fontSize: "0.6rem" }}>ЖИВОЙ ИИ АКТИВЕН · ПОИСК В РЕАЛЬНОМ ВРЕМЕНИ</span>
            </div>
            <h1 className="font-display font-bold mb-4 leading-none" style={{ fontSize: "clamp(3.5rem,10vw,7rem)" }}>
              <span className="shimmer-text">ПОБЕДИ</span><br />
              <span className="text-white/90 glow-white">СМЕРТЬ</span>
            </h1>
            <p className="text-white/45 text-lg font-display italic mb-2">«Смерть — не конец. Это задача без решения, которое ещё не найдено»</p>
            <p className="text-white/28 text-sm mb-10 max-w-xl mx-auto leading-relaxed">ИИ-система анализирует тысячи источников — от CRISPR до народной медицины — и составляет твой персональный путь к условному бессмертию</p>
            <div className="terminal-box inline-flex items-center gap-3 px-5 py-3 rounded-sm border border-cyan-500/20 bg-cyan-500/5 max-w-2xl mx-auto mb-10 text-left w-full">
              <div className="flex-shrink-0 w-6 h-6 rounded-sm bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Icon name="Activity" size={11} className="text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="section-tag mb-0.5" style={{ fontSize: "0.55rem" }}>ПОИСК В РЕАЛЬНОМ ВРЕМЕНИ</div>
                <p className="text-cyan-300 text-xs font-mono truncate">{aiText || "Инициализация системы..."}{isTyping && <span className="cursor-blink">▌</span>}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("oracle")} className="btn-primary px-8 py-3 rounded-sm relative overflow-hidden">
                <span className="relative z-10">⚚ Спросить Оракула</span>
              </button>
              <button onClick={() => setActiveTab("immortality")} className="btn-ghost px-6 py-3 rounded-sm">Раздел Бессмертия</button>
              <button onClick={() => setActiveTab("folk")} className="btn-ghost px-6 py-3 rounded-sm">Народная Медицина</button>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="max-w-7xl mx-auto px-6 pb-24">

          {/* ── SEARCH TAB ── */}
          {activeTab === "search" && (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 relative">
                  <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по категориям..." className="w-full bg-white/3 border border-white/8 rounded-sm pl-9 pr-4 py-2.5 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-yellow-500/30 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {CATEGORIES.filter((c) => !query || c.label.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase())).map((cat) => (
                  <CategoryCard key={cat.id} cat={cat} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)} active={activeCategory === cat.id} />
                ))}
              </div>
              {activeCat && (
                <div className={`animate-fade-in-up rounded-sm p-6 border ${colorMap[activeCat.color].border} ${colorMap[activeCat.color].bg}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div><div className="section-tag mb-1">{activeCat.tag}</div><h2 className="font-display text-3xl text-white/90">{activeCat.label}</h2></div>
                    <button onClick={() => setActiveCategory(null)} className="text-white/30 hover:text-white/60 p-1"><Icon name="X" size={16} /></button>
                  </div>
                  <p className="text-white/55 leading-relaxed mb-4 text-sm">{activeCat.description}</p>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {["Уровень готовности","Статус","Риск"].map((label, i) => (
                      <div key={label} className="text-center">
                        <div className={`text-xl font-display font-bold mb-1 ${colorMap[activeCat.color].text}`}>{i === 0 ? `${activeCat.progress}%` : i === 1 ? activeCat.status : "Умеренный"}</div>
                        <div className="section-tag" style={{ fontSize: "0.55rem" }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <ProgressBar value={activeCat.progress} color={activeCat.color} />
                </div>
              )}
            </div>
          )}

          {/* ── PLAN TAB ── */}
          {activeTab === "plan" && (
            <div className="animate-fade-in-up">
              <div className="ornament-divider mb-8"><span className="font-display text-2xl text-white/65 italic">Протокол Условного Бессмертия</span></div>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="card-reaper rounded-sm p-5">
                  <div className="section-tag mb-2">ЖНЕЦ ГОВОРИТ</div>
                  <p className="font-display text-lg text-white/75 italic leading-relaxed">«Я не враг твой. Я — дедлайн. Именно я заставляю тебя действовать. Каждый, кто победит меня, сделает это в союзе со мной.»</p>
                </div>
                <div className="card-mage rounded-sm p-5">
                  <div className="section-tag mb-2" style={{ color: "hsl(195 80% 60%)" }}>БЕЛЫЙ МАГ ГОВОРИТ</div>
                  <p className="font-display text-lg text-white/75 italic leading-relaxed">«Знание — первое бессмертие. Разум, понимающий механизм смерти, уже делает первый шаг к её преодолению.»</p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-yellow-500/50 via-cyan-500/30 to-transparent" />
                <div className="space-y-4">
                  {IMMORTALITY_PATH.map((step, i) => {
                    const c = colorMap[step.color];
                    return (
                      <div key={i} className="relative pl-16">
                        <div className={`absolute left-0 w-12 h-12 rounded-sm border ${c.border} ${c.bg} flex flex-col items-center justify-center`}>
                          <span className={`font-title text-[9px] ${c.text} font-bold tracking-widest`}>ФАЗ</span>
                          <span className={`font-display text-xl font-bold ${c.text} leading-none`}>{step.phase}</span>
                        </div>
                        <div className={`rounded-sm p-4 border ${c.border} bg-white/2 hover-lift`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <h3 className="font-display text-lg text-white/88">{step.title}</h3>
                            <span className={`pill ${c.pill}`}>{step.years}</span>
                          </div>
                          <p className="text-white/42 text-sm leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-8 card-gold rounded-sm p-6 text-center">
                <div className="section-tag mb-2">КОНЕЧНАЯ ЦЕЛЬ</div>
                <h2 className="font-display text-4xl glow-gold text-yellow-400 mb-2">Условное Бессмертие</h2>
                <p className="text-white/38 text-sm max-w-lg mx-auto">Через синтез всех пяти фаз — достижение Longevity Escape Velocity</p>
              </div>
            </div>
          )}

          {/* ── ORACLE TAB ── */}
          {activeTab === "oracle" && (
            <div className="animate-fade-in-up">
              <div className="ornament-divider mb-8"><span className="font-display text-2xl text-white/65 italic">Оракул Æternum — Живой ИИ</span></div>
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-center mb-8">
                  <div className="relative w-28 h-28">
                    <div className="absolute inset-0 rounded-full border border-yellow-500/25 animate-rotate-slow" />
                    <div className="absolute inset-3 rounded-full border border-cyan-500/20 animate-breathe" />
                    <div className="absolute inset-6 rounded-full border border-yellow-500/35" />
                    <div className="absolute inset-0 flex items-center justify-center text-4xl animate-breathe">⚚</div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 mx-auto flex">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="section-tag text-emerald-400" style={{ fontSize: "0.55rem" }}>РЕАЛЬНЫЙ ИИ ПОДКЛЮЧЁН · OPENROUTER</span>
                </div>

                <div className="section-tag text-center mb-5" style={{ fontSize: "0.6rem" }}>ВВЕДИ ВОПРОС · ИИ АНАЛИЗИРУЕТ ТЫСЯЧИ ИСТОЧНИКОВ · ENTER ДЛЯ ОТПРАВКИ</div>

                <div className="relative mb-4">
                  <textarea
                    value={oracleInput}
                    onChange={(e) => setOracleInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askOracle(); } }}
                    placeholder="Как замедлить старение? Что такое CRISPR? Составь план нейромодификации..."
                    rows={3}
                    className="w-full bg-white/3 border border-yellow-500/20 rounded-sm px-4 py-3 text-sm text-white/75 placeholder:text-white/18 focus:outline-none focus:border-yellow-500/40 resize-none transition-all"
                  />
                  <button onClick={askOracle} disabled={isOracleTyping} className={`absolute bottom-3 right-3 btn-primary px-4 py-1.5 rounded-sm text-xs relative overflow-hidden ${isOracleTyping ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <span className="relative z-10">{isOracleTyping ? "Анализирую..." : "⚚ Спросить"}</span>
                  </button>
                </div>

                {oracleError && <p className="text-red-400 text-xs mb-4 text-center">{oracleError}</p>}

                {(oracleResponse || isOracleTyping) && (
                  <div className="ai-response rounded-sm p-5 mb-6 animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-sm bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center"><Icon name="Brain" size={11} className="text-cyan-400" /></div>
                      <div className="section-tag text-cyan-400" style={{ fontSize: "0.55rem" }}>ОРАКУЛ ÆTERNUM · ЖИВОЙ ОТВЕТ</div>
                    </div>
                    {isOracleTyping ? (
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
                        <span className="text-white/35 text-xs">ИИ ищет и анализирует...</span>
                      </div>
                    ) : (
                      <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{oracleResponse}</div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-6">
                  {["Как работает теломераза?", "Протокол НАД+ терапии", "CRISPR и старение", "Что такое сенолитики?", "Методы крионики", "Нейроимплантаты будущего"].map((q) => (
                    <button key={q} onClick={() => { setOracleInput(q); }} className="px-3 py-2 text-xs text-white/40 border border-white/8 rounded-sm hover:border-yellow-500/30 hover:text-yellow-400/70 transition-all text-left">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── IMMORTALITY TAB ── */}
          {activeTab === "immortality" && (
            <KnowledgeSection
              section="immortality"
              title="База Знаний: Бессмертие"
              subtitle="ИИ собирает, структурирует и сохраняет всё о науке бессмертия — ты можешь добавлять темы и задавать вопросы"
              icon="Infinity"
              accentColor="gold"
              chatPlaceholder="Спроси про технологии бессмертия, загрузку сознания, Longevity Escape Velocity..."
              generatePrompt="Укажи тему — ИИ создаст подробный материал о технологиях и науке бессмертия"
            />
          )}

          {/* ── FOLK TAB ── */}
          {activeTab === "folk" && (
            <KnowledgeSection
              section="folk"
              title="Народная Медицина"
              subtitle="ИИ записывает рецепты, планы лечения и методы поддержания здоровья из народной и альтернативной медицины"
              icon="Leaf"
              accentColor="sage"
              chatPlaceholder="Спроси про лечение травами, адаптогены, народные рецепты от конкретных болезней..."
              generatePrompt="Укажи болезнь или тему — ИИ напишет рецепт, план лечения и сохранит в базу"
            />
          )}

          {/* ── OFFICIAL TAB ── */}
          {activeTab === "official" && (
            <KnowledgeSection
              section="official"
              title="Официальная Медицина"
              subtitle="ИИ ищет официальные протоколы, клинические рекомендации и доказательную медицину, систематизирует по главам"
              icon="Stethoscope"
              accentColor="cyan"
              chatPlaceholder="Спроси про официальные протоколы лечения, клинические рекомендации, лекарства..."
              generatePrompt="Укажи заболевание или тему — ИИ найдёт официальные протоколы и создаст главу"
            />
          )}

        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/5 py-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="font-display text-white/20 text-sm italic">«Смерть — последний враг, и мы его победим»</div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="section-tag text-white/20" style={{ fontSize: "0.55rem" }}>ÆTERNUM · ЖИВОЙ ИИ · OPENROUTER</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
