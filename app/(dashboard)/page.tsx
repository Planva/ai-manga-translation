'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* ===== 顶部演示：保持你的样式 ===== */
function TranslateReveal({
  before = '/demo/panel-original.webp',
  after = '/demo/panel-translated.webp',
  height = 560,
  showDivider = true,
}: {
  before?: string;
  after?: string;
  height?: number;
  showDivider?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pct, setPct] = useState(50);
  const updateFromX = useCallback((clientX: number) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - r.left, r.width));
    setPct(Math.round((x / r.width) * 100));
  }, []);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onMove = (e: PointerEvent) => updateFromX(e.clientX);
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, [updateFromX]);
  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-[28px] shadow-2xl"
      style={{ height }}
      onPointerDown={(e) => updateFromX(e.clientX)}
      onPointerMove={(e) => updateFromX(e.clientX)}
      onTouchMove={(e) => updateFromX((e.touches?.[0] || e.changedTouches?.[0] || { clientX: 0 }).clientX)}
    >
      <div className="absolute inset-0 bg-center bg-no-repeat bg-cover" style={{ backgroundImage: `url(${before})` }} />
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-cover will-change-transform"
        style={{ backgroundImage: `url(${after})`, clipPath: `inset(0 ${100 - pct}% 0 0)` }}
      />
      {showDivider && (
        <div className="pointer-events-none absolute inset-y-0 z-10" style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}>
          <div className="h-full w-[4px] md:w-[6px] bg-indigo-400/90 shadow-[0_0_16px_rgba(129,140,248,0.95)]" />
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 h-6 w-6 md:h-7 md:w-7 rounded-full bg-white/95 border border-indigo-300 shadow" />
        </div>
      )}
    </div>
  );
}

/* 简洁 Feature 卡片（中间居中） */
function FeatureCard({ icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="group h-full flex flex-col items-center text-center rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur hover:bg-white/[0.08] transition">
      <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-pink-300 ring-1 ring-white/10">
        <span className="text-2xl leading-none">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold mb-2 leading-snug">{title}</h3>
      <p className="text-sm opacity-80 leading-relaxed mx-auto max-w-[28ch] sm:max-w-[34ch]">{desc}</p>
    </div>
  );
}

/* 简洁 FAQ 卡片 */
function FaqCard({ q, a, linkText, href = '#' }: { q: string; a: any; linkText?: string; href?: string }) {
  return (
    <div className="group h-full rounded-2xl border border-white/10 bg-white/5 p-6 md:p-7 backdrop-blur hover:bg-white/[0.08] transition">
      <h3 className="text-lg font-semibold mb-3">{q}</h3>
      <div className="text-sm opacity-80 leading-relaxed space-y-2">{a}</div>
      {linkText && (
        <a href={href} className="mt-4 inline-block text-[13px] text-pink-300 hover:text-pink-200">
          {linkText} →
        </a>
      )}
    </div>
  );
}

/* ===== 下拉选项 ===== */
const LANGUAGE_ITEMS = [
  { label: 'English (ENG)', value: 'ENG' },
  { label: 'Japanese (JPN)', value: 'JPN' },
  { label: 'Chinese Simplified (CHS)', value: 'CHS' },
  { label: 'Chinese Traditional (CHT)', value: 'CHT' },
  { label: 'Korean (KOR)', value: 'KOR' },
  { label: 'French (FRA)', value: 'FRA' },
  { label: 'German (DEU)', value: 'DEU' },
  { label: 'Spanish (SPA)', value: 'SPA' },
  { label: 'Portuguese (POR)', value: 'POR' },
  { label: 'Italian (ITA)', value: 'ITA' },
  { label: 'Russian (RUS)', value: 'RUS' },
  { label: 'Arabic (ARA)', value: 'ARA' },
  { label: 'Dutch (NLD)', value: 'NLD' },
  { label: 'Polish (POL)', value: 'POL' },
  { label: 'Turkish (TUR)', value: 'TUR' },
  { label: 'Vietnamese (VIE)', value: 'VIE' },
  { label: 'Thai (THA)', value: 'THA' },
  { label: 'Indonesian (IND)', value: 'IND' },
  { label: 'Malay (MSA)', value: 'MSA' },
  { label: 'Hindi (HIN)', value: 'HIN' },
  { label: 'Ukrainian (UKR)', value: 'UKR' },
  { label: 'Czech (CES)', value: 'CES' },
  { label: 'Hungarian (HUN)', value: 'HUN' },
  { label: 'Romanian (RON)', value: 'RON' },
  { label: 'Serbian (SRP)', value: 'SRP' },
];

const MODEL_ITEMS = [
  { label: 'Offline (auto-select)', value: 'offline' },
  { label: 'OpenAI (ChatGPT)', value: 'chatgpt' },
  { label: 'DeepL', value: 'deepl' },
  //{ label: 'Youdao', value: 'youdao' },
  //{ label: 'Papago', value: 'papago' },
  //{ label: 'Caiyun', value: 'caiyun' },
  { label: 'SugoiCT2 (JPN↔ENG)', value: 'sugoi' },
  { label: 'NLLB', value: 'nllb' },
  { label: 'NLLB Big', value: 'nllb_big' },
  { label: 'M2M100', value: 'm2m100' },
  { label: 'M2M100 Big', value: 'm2m100_big' },
  { label: 'mBART-50', value: 'mbart50' },
  { label: 'Qwen2', value: 'qwen2' },
  { label: 'Qwen2 Big', value: 'qwen2_big' },
  { label: 'Keep Original (debug)', value: 'original' },
];

const DIR_ITEMS: { label: string; value: 'auto' | 'horizontal' | 'vertical' }[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Horizontal (LTR)', value: 'horizontal' },
  { label: 'Vertical', value: 'vertical' },
];

const OCR_ITEMS = [
  { label: 'mOCR (recommended)', value: 'mocr' },
  { label: '48px (legacy)', value: '48px' },
] as const;

/* ===== 工具函数 ===== */
function toDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader(); r.onerror = reject;
    r.onload = () => resolve(String(r.result)); r.readAsDataURL(file);
  });
}
async function compressDataUrl(dataUrl: string, maxDim = 2000, quality = 0.9): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
  const { width: w, height: h } = img;
  const r = Math.min(1, maxDim / Math.max(w, h));
  if (r >= 1) return dataUrl;
  const nw = Math.round(w * r), nh = Math.round(h * r);
  const c = document.createElement('canvas'); c.width = nw; c.height = nh;
  const g = c.getContext('2d')!; g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, nw, nh);
  return c.toDataURL('image/jpeg', quality);
}
async function makeThumbnail(dataUrl: string, maxW = 320, maxH = 320, quality = 0.86) {
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
  let { width: w, height: h } = img;
  const r = Math.min(maxW / w, maxH / h, 1);
  const nw = Math.max(1, Math.round(w * r));
  const nh = Math.max(1, Math.round(h * r));
  const c = document.createElement('canvas'); c.width = nw; c.height = nh;
  const g = c.getContext('2d')!; g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, nw, nh);
  return c.toDataURL('image/jpeg', quality);
}

/** UI → v1.6+ input.config（含 OCR 与方向） */
function buildConfigFromUI(verticalMode: 'auto'|'horizontal'|'vertical', ocr: 'mocr'|'48px') {
  const direction =
    verticalMode === 'horizontal' ? 'horizontal' :
    verticalMode === 'vertical'   ? 'vertical'   : 'auto';
  return {
    render: {
      renderer: 'manga2eng',
      alignment: 'center',
      direction,
      font_size_minimum: 9,
      font_size_offset: 0,
      line_spacing: 0,
    },
    detector: {
      detector: 'default',
      detection_size: 2560,
      unclip_ratio: 2.3,
      box_threshold: 0.70,
    },
    ocr: {
      ocr,
      use_mocr_merge: false,
      min_text_length: 0,
    },
    mask_dilation_offset: 24,
  };
}

function downloadDataUrl(src: string, name = 'translated.png') { const a = document.createElement('a'); a.href = src; a.download = name; a.click(); }
function downloadUrl(url: string, name = 'translated.pdf') { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); }
/* 只读取 PDF 页数（不渲染，速度快） */
async function countPdfPagesQuick(file: File): Promise<number> {
  const pdfjs: any = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const n = doc.numPages;
  (doc as any).destroy?.();
  return n;
}

/* PDF → 图片 */
async function pdfToImages(file: File, scale = 1.5) {
  const pdfjs: any = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: { dataUrl: string; width: number; height: number }[] = [];
  const MAX_DIM = 2400;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    let viewport = page.getViewport({ scale });
    const clamp = Math.min(1, MAX_DIM / Math.max(viewport.width, viewport.height));
    if (clamp < 1) viewport = page.getViewport({ scale: scale * clamp });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    pages.push({ dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height });
  }
  return pages;
}
async function countPdfPagesFast(file: File) {
  const pdfjs: any = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  return doc.numPages as number;
}

/* 图片数组 → 合成 PDF */
async function imagesToPdf(pages: { dataUrl: string; width: number; height: number }[]) {
  const { jsPDF } = await import('jspdf');
  const first = pages[0];
  const pdf = new jsPDF({ unit: 'px', format: [first.width, first.height] });
  const add = (img: string, w: number, h: number, first: boolean) => {
    if (!first) pdf.addPage([w, h], 'portrait');
    (pdf as any).addImage(img, 'PNG', 0, 0, w, h, undefined, 'FAST');
  };
  add(first.dataUrl, first.width, first.height, true);
  for (let i = 1; i < pages.length; i++) {
    const p = pages[i]; add(p.dataUrl, p.width, p.height, false);
  }
  return URL.createObjectURL(pdf.output('blob'));
}

/* 并发控制 */
async function mapLimit<T, U>(arr: T[], limit: number, iter: (item: T, idx: number) => Promise<U>): Promise<U[]> {
  const ret = new Array<U>(arr.length);
  let i = 0;
  async function worker() {
    while (true) {
      const my = i++; if (my >= arr.length) break;
      ret[my] = await iter(arr[my], my);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, worker));
  return ret;
}



type JobKind = 'image' | 'pdf';
type Job = {
  id: string;
  kind: 'image' | 'pdf';
  name?: string;
  preview?: string;
  thumb?: string;
  full?: string;
  status: Stage;
  error?: string;
  totalPages?: number;
  donePages?: number;
  pdfUrl?: string;
  local?: { file?: File; url?: string };
  /** 每个任务占用的额度：图片=1；PDF=页数 */
  units?: number; // 👈 新增
};
type Stage = 'uploading' | 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed';


// ===== 统一状态标签（支持 PDF 进度）======
const STATUS_LABEL: Record<Stage, string> = {
  uploading:  'Uploading',
  uploaded:   'Uploaded',
  queued:     'In Queue',
  processing: 'Translating',
  completed:  'Completed',
  failed:     'Failed',
};

const STATUS_STYLE: Record<Stage, string> = {
  uploading:  'bg-sky-500/90 ring-sky-300/40',
  uploaded:   'bg-emerald-500/90 ring-emerald-300/40',
  queued:     'bg-amber-500/90 ring-amber-300/40',
  processing: 'bg-indigo-500/90 ring-indigo-300/40',
  completed:  'bg-emerald-600/90 ring-emerald-300/40',
  failed:     'bg-rose-600/90 ring-rose-300/40',
};

function StatusPill({
  status,
  kind,
  done,
  total,
}: {
  status: Stage;
  kind?: JobKind;
  done?: number;
  total?: number;
}) {
  const text =
    status === 'processing' && kind === 'pdf' && total
      ? `Translating ${done ?? 0}/${total}`
      : STATUS_LABEL[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ring-1 ${STATUS_STYLE[status]} shadow backdrop-blur`}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/90" />
      {text}
    </span>
  );
}


const IMG_CONCURRENCY = 2;
const PDF_PAGE_CONCURRENCY = 2;
const POLL_INTERVAL_MS = 1200;
const POLL_TIMEOUT_MS = 180000;


/* ===== 页面 ===== */
export default function Page() {
    // 免费额度
    const [quota, setQuota] = useState<{ limit: number; used: number; remaining: number } | null>(null);
    const [wallet, setWallet] = useState<{ balance: number; loggedIn?: boolean } | null>(null);
    const [selectedUnits, setSelectedUnits] = useState<number>(0); // 选中的总“张数”（图片=1，PDF=页数）
    const refreshWallet = useCallback(() => {
      fetch('/api/wallet/summary')
        .then(r => r.json())
        .then(j => setWallet({ balance: Number(j?.balance ?? 0), loggedIn: !!j?.loggedIn }))
        .catch(() => {});
    }, []);
    
    // 强制确保拿到今日额度；失败时兜底为 10
    async function ensureQuota() {
      // 已经有了就直接返回
      if (quota) return quota;

      try {
        const r = await fetch('/api/quota/remaining', { method: 'GET', cache: 'no-store' });
        if (!r.ok) throw new Error('non-200');
        const j = await r.json();
        const q = {
          limit: Number(j?.limit ?? 10),
          used: Number(j?.used ?? 0),
          remaining: Number(j?.remaining ?? 10),
        };
        setQuota(q);
        return q;
      } catch {
        // 接口异常时，不阻断用户；给 10 次兜底
        const fallback = { limit: 10, used: 0, remaining: 10 };
        setQuota(fallback);
        return fallback;
      }
    }

    useEffect(() => {
      fetch('/api/quota/remaining')
        .then(r => r.json())
        .then(j => setQuota(j))
        .catch(() => setQuota({ limit: 10, used: 0, remaining: 10 })); // 兜底
    }, []);
    useEffect(() => {
      fetch('/api/wallet/summary')
        .then(r => r.json())
        .then(j => setWallet({ balance: Number(j?.balance ?? 0), loggedIn: !!j?.loggedIn }))
        .catch(() => setWallet({ balance: 0, loggedIn: false }));
    }, []);
    
  
  // 控制面板
  const [language, setLanguage] = useState('ENG');
  const [model, setModel] = useState('offline');
  const [verticalMode, setVerticalMode] = useState<'auto'|'horizontal'|'vertical'>('auto');
  const [ocr, setOcr] = useState<'mocr' | '48px'>('mocr');

  // 上传与反馈
  const [files, setFiles] = useState<File[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hover, setHover] = useState(false);

  // 结果与预览
  const [jobs, setJobs] = useState<Job[]>([]);
  const [lightbox, setLightbox] = useState<{ src: string; name?: string } | null>(null);
  // 放在 Page 组件内部（在 useState 们后面）
  const removeJob = (jobId: string) => {
    setJobs(prev => {
      const job = prev.find(j => j.id === jobId);
  
      if (job?.local?.file) {
        setFiles(old => old.filter(f => f !== job.local!.file));
      }
      const dec = (job as any)?.units ?? (job?.kind === 'pdf' ? (job?.totalPages || 1) : 1);
      setSelectedUnits(v => Math.max(0, v - (dec || 0)));
  
      return prev.filter(j => j.id !== jobId);
    });
  };
  

  // 结果区定位（只在结果区出现后再滚动）
  const resultsWrapRef = useRef<HTMLDivElement | null>(null);
  // ===== 滚动到结果区（带偏移量）=====
  const SCROLL_OFFSET = 650; // 你可以微调：260~340 都可以，数值越大=停得越靠上

  function scrollToResults() {
    const el = resultsWrapRef.current;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  useEffect(() => {
    if (jobs.length > 0) {
      const t = setTimeout(() => {
        scrollToResults();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [jobs.length]);



  /* 选择文件 */
  const onDrop = async (list: FileList | null) => {
    if (!list || !list.length) return;
  
    const arr = Array.from(list);
  
    // 逐个文件计算 units，并立刻写入到 job 上
    let totalUnits = 0;
    for (const f of arr) {
      const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
      const fileUnits = isPdf ? await countPdfPagesQuick(f) : 1;
      totalUnits += fileUnits;
  
      const id = (crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2);
      const kind: JobKind = isPdf ? 'pdf' : 'image';
  
      // 先插入占位卡片，并写入 units
      setJobs(prev => [
        ...prev,
        { id, kind, name: f.name, status: 'uploading', local: { file: f }, units: fileUnits },
      ]);
  
      try {
        if (kind === 'image') {
          const raw = await toDataURL(f);
          const thumb = await makeThumbnail(raw, 320, 320, 0.86);
          setJobs(prev => prev.map(j => j.id === id ? ({ ...j, preview: raw, thumb, status: 'uploaded' }) : j));
        } else {
          // PDF 先不渲染，标记为已上传
          setJobs(prev => prev.map(j => j.id === id ? ({ ...j, status: 'uploaded' }) : j));
        }
      } catch {
        setJobs(prev => prev.map(j => j.id === id ? ({ ...j, status: 'failed', error: 'Preview failed' }) : j));
      }
    }
  
    setSelectedUnits(totalUnits);
  
    if (quota && totalUnits > quota.remaining) {
      setErr(`You selected ${totalUnits} pages/images, which exceeds your remaining free quota (${quota.remaining}). You can still preview, but translating will require a plan.`);
    } else {
      setErr(null);
    }
  
    // 滚到结果区
    setTimeout(() => { scrollToResults(); }, 80);
  
    setFiles(arr);
    setImageUrl('');
  };
  
  

  /* ========== RunPod 异步：提交与轮询（保持 v1.3 路由，仅加 config） ========== */
  const OUTPUT_FORMAT: 'png' | 'webp' = 'png';

  async function submitRunPod(
    img: string,
    translator: any,
    vMode: 'auto' | 'horizontal' | 'vertical',
  ) {
    const cfg = buildConfigFromUI(vMode, ocr); // ✅ 这里生成 config

    const r = await fetch('/api/translate/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: img,
        translator,
        verticalMode: vMode,       // 兼容旧后端的 rendering 映射
        output_format: OUTPUT_FORMAT,
        config: cfg,               // ✅ 传递整段 config 给后端
      }),
    });

    const text = await r.text();
    let j: any = null; try { j = JSON.parse(text); } catch {}
    if (!r.ok || !j?.jobId) throw new Error(j?.error || text || `Failed to start job (HTTP ${r.status})`);
    return j.jobId as string;
  }


  async function waitForJob(jobId: string): Promise<{ image_b64: string }> {
    const started = Date.now();
    while (true) {
      await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS));
      const r = await fetch(`/api/translate/status?id=${encodeURIComponent(jobId)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Status error');
      if (j.status === 'COMPLETED' && j.image_b64) return { image_b64: j.image_b64 };
      if (j.status === 'FAILED') throw new Error(j?.error || 'RunPod FAILED');
      if (Date.now() - started > POLL_TIMEOUT_MS) throw new Error('Polling timeout');
    }
  }

  /* ========== 主流程：批量并发（图片/每页）+ 压缩 + 轮询 ========== */
  const onTranslate = async () => {
    try {
      setErr(null);
      setLoading(true);
      let units = 0;
      for (const f of files) {
        const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
        if (isPdf) units += await countPdfPagesFast(f);
        else units += 1;
      }
      setSelectedUnits(units);

      if (!quota) {
        setErr('Fetching your free quota failed. Please try again.');
        return;
      }
      if (units === 0 && !imageUrl) {
        setErr('Please choose files or paste an image URL.');
        return;
      }
      if (units > quota.remaining) {
        setErr(`You need ${units - quota.remaining} more free credits. Please subscribe or recharge.`);
        return;
      }
      // ===== 预检：统计本次将消耗的总张数 =====
      let needUnits = 0;

      // 1) 普通图片数
      const imageFiles = files.filter(
        f => !(f.type === 'application/pdf' || /\.pdf$/i.test(f.name))
      );
      needUnits += imageFiles.length;

      // 2) URL 图片（如果填写了）
      if (imageUrl.trim()) needUnits += 1;

      // 3) PDF 总页数
      const pdfFiles = files.filter(
        f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
      );
      let pdfPagesTotal = 0;
      for (const f of pdfFiles) {
        // 只读页数，不渲染
        const n = await countPdfPagesQuick(f);
        pdfPagesTotal += n;
      }
      needUnits += pdfPagesTotal;
      // 4) 向后端查询今日剩余额度（匿名也可查）
      try {
        const qr = await fetch('/api/quota/remaining', { method: 'GET' });
        const qj = await qr.json();

        // 付费用户：直接通过
        if (!qj?.isPaid) {
          const remaining = Number(qj?.remaining ?? 0);
          if (needUnits > remaining) {
            setLoading(false);
            setErr(
              `超出今日免费额度：本次需要 ${needUnits} 张，剩余 ${remaining} 张。` +
              `请登录/升级套餐或分批提交（每日上限 ${qj?.limit ?? 10} 张）。`
            );
            return; // ❗️直接拦截，不再继续发任务
          }
        }
      } catch (e) {
        // 查询失败时不阻断（后端 /start 还有兜底），仅做提示
        console.warn('quota check failed', e);
      }

      // —— 收集需要处理的任务：优先 files，其次 imageUrl ——
      const imageTasks: { id: string; name: string; file?: File; src?: string }[] = [];
      const pdfTasks:   { id: string; name: string; file: File }[] = [];

      if (files.length > 0) {
        for (const f of files) {
          // 先判断类型
          const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
          const kind: JobKind = isPdf ? 'pdf' : 'image';

          // 尝试找出 onDrop 时就生成的卡片
          const existed = jobs.find((j) => j.local?.file === f);

          // 无论是否已存在，都构造一个“确定存在”的 Job 对象（避免 TS 报 undefined）
          const ensured: Job = existed ?? {
            id: (crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2),
            kind,
            name: f.name,
            status: 'uploaded',
            local: { file: f },
          };

          // 如果是新建的，占位卡片补到 UI
          if (!existed) {
            setJobs((prev) => [...prev, ensured]);
          }

          // 根据类型放入待处理列表
          if (ensured.kind === 'image') {
            imageTasks.push({ id: ensured.id, name: f.name, file: f });
          } else {
            pdfTasks.push({ id: ensured.id, name: f.name, file: f });
          }
        }
      } else if (imageUrl.trim()) {
        const id = (crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2);
        // URL 也放一张卡片（作为“已上传”）
        setJobs((prev) => [
          ...prev,
          {
            id,
            kind: 'image',
            name: 'url',
            status: 'uploaded',
            preview: imageUrl.trim(),
            thumb: imageUrl.trim(),
            local: { url: imageUrl.trim() },
          },
        ]);
        imageTasks.push({ id, name: 'url', src: imageUrl.trim() });
      } else {
        setErr('Please choose files or paste an image URL.');
        return;
      }

  
      
  
      // —— 图片：并发处理（不新增卡片，只更新现有卡片状态） ——
      await mapLimit(imageTasks, IMG_CONCURRENCY, async (t) => {
        setJobs((prev) => prev.map((j) => (j.id === t.id ? { ...j, status: 'queued' } : j)));
  
        const inputImg = t.src
          ? t.src
          : await compressDataUrl(await toDataURL(t.file!), 2000, 0.9);
  
          const jobId = await submitRunPod(
            inputImg,
            { translator: model, target_lang: language, device: 'cuda', compute_type: 'float16' },
            verticalMode,
          );
  
        setJobs((prev) => prev.map((j) => (j.id === t.id ? { ...j, status: 'processing' } : j)));
        const out = await waitForJob(jobId);
        // ✅ 成功 1 张后再扣 1
        try {
          const r = await fetch('/api/quota/consume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 1 }),
          });
          if (r.ok) {
            const q = await r.json();
            setQuota(q); // 同步 UI 额度
          } else {
            // 理论上不会到这里（前面已校验），容错即可
            // 也可以 setErr('Quota consume failed after success.');
          }
        } catch { /* 忽略网络抖动 */ }
        refreshWallet();
        const full = 'data:image/png;base64,' + out.image_b64;
        const thumb = await makeThumbnail(full, 320, 320, 0.86);
        setJobs((prev) =>
          prev.map((j) => (j.id === t.id ? { ...j, full, thumb, status: 'completed' } : j))
        );
      });
  
      // —— PDF：外层串行，内层按页并发；把第一页图补到卡片上 ——
      for (const t of pdfTasks) {
        setJobs((prev) => prev.map((j) => (j.id === t.id ? { ...j, status: 'queued' } : j)));
  
        const pages = await pdfToImages(t.file);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === t.id
              ? { ...j, preview: pages[0]?.dataUrl, totalPages: pages.length, donePages: 0 }
              : j
          )
        );
  
        let done = 0;
        const translated = await mapLimit(pages, PDF_PAGE_CONCURRENCY, async (p, idx) => {
          const pageInput = await compressDataUrl(p.dataUrl, 1800, 0.88);
  
          const jobId = await submitRunPod(
            pageInput,
            { translator: model, target_lang: language, device: 'cuda', compute_type: 'float16' },
            verticalMode
          );
          
  
          setJobs((prev) => prev.map((j) => (j.id === t.id ? { ...j, status: 'processing' } : j)));
          const out = await waitForJob(jobId);
          const pageImg = 'data:image/png;base64,' + out.image_b64;
          // ✅ 每页成功后扣 1
          try {
            const r = await fetch('/api/quota/consume', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: 1 }),
            });
            if (r.ok) {
              const q = await r.json();
              setQuota(q);
            }
          } catch {}
          refreshWallet();
          if (idx === 0) {
            const thumb = await makeThumbnail(pageImg, 320, 320, 0.86);
            setJobs((prev) => prev.map((j) => (j.id === t.id ? { ...j, thumb } : j)));
          }
  
          done += 1;
          setJobs((prev) => prev.map((j) => (j.id === t.id ? { ...j, donePages: done } : j)));
          return { dataUrl: pageImg, width: p.width, height: p.height };
        });
  
        const pdfUrl = await imagesToPdf(translated);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === t.id
              ? { ...j, pdfUrl, full: translated[0]?.dataUrl, status: 'completed' }
              : j
          )
        );
      }
  
      // 成功后滚到结果
      setTimeout(() => {
        resultsWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.scrollBy({ top: -16, behavior: 'smooth' });
      }, 50);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <main className="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-6 text-white">
    
      {/* 标题 & 演示 */}
      <div className="text-center">
        {/* H1：两行主标题，保持网站渐变样式 */}
        <h1 className="hero-title hero-gradient-text inline-block leading-tight pb-1 font-extrabold tracking-tight text-5xl sm:text-4xl">
          <span className="block">AI manga translation — understand the original in seconds</span>
          <span className="block">Context-aware & faithful — translate into any language</span>
        </h1>

        {/* 副标题（不变） */}
        <p className="mt-4 text-white/90 text-base sm:text-lg max-w-3xl mx-auto">
          AI-powered manga translation that preserves context and layout — fast, faithful, and multilingual.
        </p>

        {/* 新增：主次分明的两个按钮 */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#uploader"
            className="inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold
                      bg-indigo-500 hover:bg-indigo-400 text-white shadow"
          >
            Get Started
          </a>
          <a
            href="#how-to"
            className="inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold
                      bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur"
          >
            How to use
          </a>
        </div>

        {/* 数据亮点：三项简洁卡片（与站点风格一致） —— 保留原有内容 */}
        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 sm:p-4 backdrop-blur">
            <div className="text-2xl sm:text-4xl font-extrabold text-blue-300">100,000+</div>
            <div className="text-[11px] sm:text-xs opacity-80">Translations Completed</div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 sm:p-4 backdrop-blur">
            <div className="text-2xl sm:text-4xl font-extrabold text-blue-300">50+</div>
            <div className="text-[11px] sm:text-xs opacity-80">Supported Languages</div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 sm:p-4 backdrop-blur">
            <div className="text-2xl sm:text-4xl font-extrabold text-blue-300">99%</div>
            <div className="text-[11px] sm:text-xs opacity-80">Translation Accuracy*</div>
          </div>
        </div>

        <p className="mt-2 text-[11px] opacity-60">* Internal benchmark on curated manga set.</p>
      </div>


      
      <div className="mt-16 rounded-2xl p-4 md:p-6 bg-white/5 backdrop-blur border border-white/10">
        <TranslateReveal />
      </div>

      {/* 控制面板 */}
      <section id="uploader" className="mt-16 rounded-2xl p-4 md:p-6 bg-white/5 backdrop-blur border border-white/10">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-sm opacity-80">Translation language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-xl bg-white/10 backdrop-blur px-3 py-2 outline-none border border-white/15 focus:border-indigo-300/70 transition">
              {LANGUAGE_ITEMS.map(it => <option key={it.value} value={it.value}>{it.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm opacity-80">Language Model</span>
            <select value={model} onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded-xl bg-white/10 backdrop-blur px-3 py-2 outline-none border border-white/15 focus:border-indigo-300/70 transition">
              {MODEL_ITEMS.map(it => <option key={it.value} value={it.value}>{it.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm opacity-80">Text layout / direction</span>
            <select value={verticalMode} onChange={(e) => setVerticalMode(e.target.value as any)}
                    className="w-full rounded-xl bg-white/10 backdrop-blur px-3 py-2 outline-none border border-white/15 focus:border-indigo-300/70 transition">
              {DIR_ITEMS.map(it => <option key={it.value} value={it.value}>{it.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm opacity-80">OCR model</span>
            <select value={ocr} onChange={(e) => setOcr(e.target.value as 'mocr' | '48px')}
                    className="w-full rounded-xl bg-white/10 backdrop-blur px-3 py-2 outline-none border border-white/15 focus:border-indigo-300/70 transition">
              {OCR_ITEMS.map(it => <option key={it.value} value={it.value}>{it.label}</option>)}
            </select>
          </label>
        </div>
        {/* —— 额度徽章：放到选择区与上传框之间 —— */}
        {quota && (
          <div className="mt-8 mb-4 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="inline-flex items-center rounded-full px-3 py-1 bg-white/10 border border-white/15">
              Free uses left today: <b className="ml-1">{quota.remaining}</b> / {quota.limit}
            </span>

            {wallet && (
              <span className="inline-flex items-center rounded-full px-3 py-1 bg-white/10 border border-white/15">
                Purchased credits: <b className="ml-1">{wallet.balance}</b>
              </span>
            )}

            <a
              href="/pricing"
              className="inline-flex items-center rounded-full px-3 py-1 bg-indigo-500 hover:bg-indigo-400 text-white border border-transparent"
            >
              Buy credits
            </a>

            {selectedUnits > 0 && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 border ${
                  selectedUnits > (quota?.remaining ?? 0)
                    ? 'bg-rose-500/15 border-rose-300/30 text-rose-200'
                    : 'bg-emerald-500/15 border-emerald-300/30 text-emerald-200'
                }`}
              >
                Selected units: <b className="ml-1">{selectedUnits}</b>
              </span>
            )}
          </div>
        )}


        {/* 上传区 */}
        <div
          className={`mt-8 rounded-2xl p-10 text-center border-2 border-dashed ${hover ? 'border-indigo-300 bg-[rgba(2,6,23,.62)]' : 'border-indigo-400/70 bg-[rgba(2,6,23,.45)]'} text-[color:var(--c-text)] backdrop-blur transition-colors`}
          onDragOver={(e) => { e.preventDefault(); setHover(true); }}
          onDragLeave={() => setHover(false)}
          onDrop={(e) => { e.preventDefault(); setHover(false); onDrop(e.dataTransfer.files); }}
        >
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--c-text)]" fill="currentColor"><path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-6 14h12v2H6v-2z" /></svg>
          </div>
          <p className="text-lg">
            Drag &amp; drop images/PDF here, or{' '}
            <label className="underline cursor-pointer">click to upload
              <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            </label>
          </p>
          <p className="mt-3 text-sm opacity-75">Supports JPG / JPEG / PNG / PDF</p>
          {files.length > 0 && <p className="mt-4 text-sm opacity-85">Selected: <b>{files.length === 1 ? files[0].name : `${files.length} files`}</b></p>}

          <div className="mt-6 max-w-xl mx-auto">
            <input type="url" value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); if (e.target.value) setFiles([]); }}
                   placeholder="Or paste a public image URL (e.g. from R2/S3/CDN)"
                   className="w-full rounded-xl bg-white/10 backdrop-blur px-3 py-2 outline-none border border-white/15 focus:border-indigo-300/70 transition"/>
            {imageUrl && <p className="mt-1 text-xs opacity-70">URL will be used instead of the uploaded files.</p>}
          </div>

          <button onClick={onTranslate} disabled={loading || (files.length === 0 && !imageUrl)}
                  className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50">
            {loading ? 'Translating…' : 'Translate'}
          </button>

          {err && <pre className="mt-4 whitespace-pre-wrap break-words text-left text-red-300 text-xs max-h-60 overflow-auto">{err}</pre>}
        </div>
      </section>

      

      {/* 结果展示 */}
      {jobs.length > 0 && (
        <section ref={resultsWrapRef} className="mt-10">
          <div className="mb-3 text-sm opacity-70">Results (click a thumbnail to view the original / download from the top-right)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {jobs.map(job => (
              <div key={job.id} className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur">
                <div className="absolute left-2 top-2 z-10">
                  <StatusPill
                    status={job.status}
                    kind={job.kind}
                    done={job.donePages}
                    total={job.totalPages}
                  />
                </div>
                {/* 删除按钮 */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeJob(job.id); }}
                  title="Remove"
                  className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full
                            bg-rose-600/80 hover:bg-rose-500 text-white shadow-md"
                >
                  ×
                </button>

                {(job.thumb || job.preview) ? (
                  <img
                    src={job.thumb || job.preview}
                    className="w-full h-[260px] object-contain cursor-zoom-in bg-black/20"
                    onClick={() => (job.full || job.preview) && setLightbox({ src: job.full || job.preview!, name: job.name })}
                    alt={job.name || 'result'}
                  />
                ) : (<div className="h-[260px] bg-white/10" />)}

                <div className="flex items-center justify-between px-3 py-2 text-xs bg-black/30">
                  <div className="truncate">{job.name || 'file'}{job.kind === 'pdf' && job.totalPages ? ` · ${job.totalPages} pages` : ''}</div>
                  <div className="flex items-center gap-2">
                    {job.kind === 'image' && job.full && (
                      <button className="rounded-md px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/10"
                              onClick={() => downloadDataUrl(job.full!, (job.name || 'translated') + '.png')}>
                        Download
                      </button>
                    )}
                    {job.kind === 'pdf' && job.pdfUrl && (
                      <button className="rounded-md px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/10"
                              onClick={() => downloadUrl(job.pdfUrl!, (job.name?.replace(/\.pdf$/i, '') || 'translated') + '.pdf')}>
                        Download PDF
                      </button>
                    )}
                  </div>
                </div>

                {job.error && <div className="px-3 pb-2 text-[11px] text-red-300">{job.error}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox 预览 */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 md:p-8" onClick={() => setLightbox(null)}>
          <img src={lightbox.src} alt="full" className="mx-auto max-h-[90vh] w-auto rounded-xl shadow-2xl" />
          <div className="mt-4 flex justify-center gap-3">
            <button className="rounded-full px-4 py-2 bg-emerald-500 hover:bg-emerald-400"
                    onClick={(e) => { e.stopPropagation(); downloadDataUrl(lightbox.src, (lightbox.name || 'translated') + '.png'); }}>
              Download original
            </button>
            <button className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20" onClick={() => setLightbox(null)}>Close</button>
          </div>
        </div>
      )}
      {/* Tips card — place this right before your "How to Use" section */}
    <section
      className="
        mt-8 sm:mt-10               /* 增加与上一块的间距 */
        rounded-2xl border border-white/10 bg-white/5 backdrop-blur
        shadow-[0_10px_30px_rgba(0,0,0,.35)] p-4 sm:p-6
      "
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <span aria-hidden className="text-base">💡</span>
        Quick Tips
      </h2>

      <ul className="mt-3 space-y-3 text-sm text-white/85">
        <li className="flex items-start gap-3">
          <span aria-hidden className="mt-0.5 text-base leading-5">🔎</span>
          <span>
            If the translation comes back in the <em>same language</em> as your upload,
            try switching the <span className="font-medium">OCR model</span>.
          </span>
        </li>

        <li className="flex items-start gap-3">
          <span aria-hidden className="mt-0.5 text-base leading-5">🤖</span>
          <span>
            If the translation quality isn’t what you expect, switch to a different
            <span className="font-medium"> language model</span>.
          </span>
        </li>

        <li className="flex items-start gap-3">
          <span aria-hidden className="mt-0.5 text-base leading-5">↔️</span>
          <span>
            If the layout looks off, change the <span className="font-medium">text direction</span> (from left to right/top to bottom).
          </span>
        </li>
      </ul>
    </section>



      {/* How to Use */}
      <section id="how-to" className="mt-24">
        <div className="text-center">
          <h2
            className="inline-block text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(240deg, #ffffff 0%, var(--c-text) 40%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            How to Use
          </h2>
          <p className="mt-3 text-white/80">
            Three quick steps to get high-fidelity manga translations.
          </p>
        </div>

        {/* Step 01 */}
        <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center">
          {/* Text */}
          <div className="md:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] bg-pink-500/15 text-pink-200 ring-1 ring-pink-300/30 mb-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-300/90" />
              01
            </div>
            <h3 className="text-2xl font-bold">Upload Files</h3>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Two ways to add pages: <b>drag &amp; drop</b> directly into the uploader,
              or click <b>“click to upload”</b> and choose images/PDFs from your device.
              We accept JPG/JPEG/PNG and full PDFs. (Each image ≤ 5&nbsp;MB; PDF ≤ your plan’s limit.)
            </p>
          </div>
          {/* Media */}
          <div className="md:col-span-7">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur">
              <img
                src="/how-to-use/add-files.webp"
                alt="Add files by drag & drop or click to upload"
                className="w-full h-auto block"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Step 02 */}
        <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center">
          {/* Media (swap order on desktop for rhythm) */}
          <div className="md:col-span-7 md:order-1">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur">
              <img
                src="/how-to-use/select-model.webp"
                alt="Select language, model, OCR and text direction"
                className="w-full h-auto block"
                loading="lazy"
              />
            </div>
          </div>
          {/* Text */}
          <div className="md:col-span-5 md:order-2">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-300/30 mb-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-300/90" />
              02
            </div>
            <h3 className="text-2xl font-bold">Choose Language &amp; Model</h3>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Pick your <b>target language</b> and keep other options on <b>defaults</b> for
              a great start. If the output isn’t ideal, try switching <b>OCR</b> (mOCR / 48px),
              changing the <b>Language Model</b> (Offline/Sugoi/NLLB/M2M100/…),
              or adjusting <b>text direction</b> (Auto / Vertical / Horizontal).
            </p>
          </div>
        </div>

        {/* Step 03 */}
        <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center">
          {/* Text */}
          <div className="md:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-300/30 mb-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300/90" />
              03
            </div>
            <h3 className="text-2xl font-bold">Review &amp; Download</h3>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Thumbnails appear under the uploader with clear status badges
              (Uploading / Uploaded / In Queue / Translating / Completed).
              Click a card to zoom; in the viewer you can <b>Download original</b> or <b>Close</b>.
            </p>
          </div>
          {/* Media */}
          <div className="md:col-span-7">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur">
              <img
                src="/how-to-use/result.webp"
                alt="Results preview and download"
                className="w-full h-auto block"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why" className="mt-24">
        <div className="text-center">
          <h2
            className="inline-block text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-transparent"
            style={{
              backgroundImage: 'linear-gradient(240deg, #ffffff 0%, var(--c-text) 40%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            Why Choose Us
          </h2>
          <p className="mt-3 text-white/80">
            A full-stack AIGC solution for manga translation: high-fidelity output, controllable layout, full-volume PDFs—one drag-and-drop does it all.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <FeatureCard icon="🤖" title="AI-Powered · Understands Your Context" desc="Combines offline and cloud LLMs; preserves context consistency and character voice to retain the original tone and jokes." />
          <FeatureCard icon="🔀" title="Seamless Multi-Model Switching" desc="offline / Sugoi / NLLB / M2M100 / mBART / Qwen / ChatGPT / DeepSeek / Groq / Gemini… one-click switching to match languages and scenarios." />
          <FeatureCard icon="🧾" title="Smart Typesetting · Visual Fidelity" desc="Auto-detects vertical/horizontal text; font size, line spacing, and bubble areas adapt to match the original layout." />
          <FeatureCard icon="🧠" title="Semantic Awareness · Faithfully Recreates the Plot" desc="Fine-grained handling of honorifics, catchphrases, onomatopoeia, and context to reduce mistranslations and literalness, ensuring coherent scenes." />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <FeatureCard icon="📚" title="Translate an Entire PDF in One Go" desc="Drag in a whole PDF; pages are processed in parallel and merged automatically; per-page dimensions are preserved for readers." />
          <FeatureCard icon="⚡" title="GPU Acceleration & Warm Starts" desc="CUDA + float16 inference with warmed workers cuts latency and cost in sustained batches." />
          <FeatureCard icon="🖼️" title="Real Thumbnails & Original Downloads" desc="Front-end Canvas generates crisp thumbnails; click to zoom the original and one-click download translated assets." />
          <FeatureCard icon="🔒" title="Privacy Control" desc="Short-lived processing by default with no retention; optional fully offline path for intranet/private deployments." />
          <FeatureCard icon="📈" title="Visible Progress & Observability" desc="Queue/in-progress/done statuses; error logs and retries help pinpoint issues quickly." />
          <FeatureCard icon="🧩" title="Developer-Friendly" desc="Async APIs (run + status), batch concurrency, rich optional params; easy to extend and integrate across front- and back-end." />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mt-24">
        <div className="text-center">
          <h2
            className="inline-block text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-transparent"
            style={{
              backgroundImage: 'linear-gradient(240deg, #ffffff 0%, var(--c-text) 40%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-white/80">Find quick answers about usage, plans, and privacy.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 auto-rows-fr">
          <FaqCard
            q="Can I use it for free?"
            a={<p>Each translation consumes compute credits. We provide a <b>free weekly quota</b> for light use. Need more? Upgrade to a paid plan at any time—credits roll over within the billing cycle.</p>}
            linkText="View pricing"
            href="/pricing"
          />
          <FaqCard
            q="Which languages are supported?"
            a={<><p>We support all languages covered by our models. Most popular: <b>ENG / JPN / CHS / CHT / KOR</b>, plus major European and Southeast Asian languages.</p><p>You can switch models per task to match language and style.</p></>}
            linkText="See language list"
            href="#uploader"
          />
          <FaqCard
            q="Can I edit the translation result?"
            a={<p>We plan to add in-browser editing. You can't edit directly yet. You can rerun with a different model or target language to compare the output. We won't keep the original images.</p>}
            
          />
          <FaqCard
            q="How do I translate a whole PDF?"
            a={<p>Drag a PDF into the uploader—pages are processed in parallel and merged back automatically. Page size and reading order are preserved. Very large PDFs are chunked to keep the queue stable.</p>}
            linkText="How to use PDF mode"
            href="#how-to"
          />
          <FaqCard
            q="How to cancel or change my plan?"
            a={<p>You can cancel at any time through your account profile.</p>}
            linkText="Open account portal"
            href="/dashboard"
          />
          <FaqCard
            q="What about privacy & data retention?"
            a={<p>Jobs are processed short-lived by default; results are kept temporarily for download and then purged. An <b>offline-only</b> path is available for private deployments.</p>}
            linkText="Read privacy policy"
            href="/privacy"
          />
        </div>
      </section>
    </main>
  );
}
