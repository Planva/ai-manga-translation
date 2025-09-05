// components/SiteFooter.tsx
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-white font-semibold">AI Manga Translator</h3>
            <p className="mt-3 text-sm text-white/70">
              AI Manga Translator is a professional manga translation tool
              supporting multiple languages.
            </p>

            <div className="mt-5">
              <div className="text-sm font-medium text-white/90">Contact Us</div>
              <div className="mt-3 flex items-center gap-3">
                {/* 圆形社交按钮（占位链接） */}
                <a
                  href="mailto:hello@yourdomain.com"
                  aria-label="Email"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition"
                >
                  {/* mail */}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5Z"/>
                  </svg>
                </a>
                <a href="#" aria-label="GitHub" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition">
                  {/* github */}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M12 2a10 10 0 0 0-3.162 19.492c.5.092.682-.216.682-.48 0-.237-.009-.868-.013-1.705-2.776.604-3.362-1.34-3.362-1.34-.455-1.156-1.111-1.465-1.111-1.465-.908-.62.069-.608.069-.608 1.004.071 1.532 1.032 1.532 1.032.892 1.529 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.338-2.217-.252-4.55-1.108-4.55-4.932 0-1.089.39-1.981 1.029-2.679-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.024A9.564 9.564 0 0 1 12 6.844c.852.004 1.71.115 2.511.337 1.909-1.293 2.748-1.024 2.748-1.024.545 1.377.202 2.394.1 2.647.64.698 1.028 1.59 1.028 2.679 0 3.834-2.337 4.677-4.561 4.924.36.31.68.919.68 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.576.688.477A10.001 10.001 0 0 0 12 2Z"/>
                  </svg>
                </a>
                <a href="#" aria-label="Discord" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition">
                  {/* discord */}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M20.317 4.369A19.791 19.791 0 0 0 16.558 3c-.2.35-.432.82-.592 1.19a18.27 18.27 0 0 0-7.932 0C7.874 3.82 7.642 3.35 7.442 3a19.8 19.8 0 0 0-3.758 1.369C1.66 8.108.932 12.11 1.234 16.063A19.9 19.9 0 0 0 7 18.5c.29-.4.548-.826.769-1.274a12.91 12.91 0 0 1-1.216-.586c.102-.074.203-.152.3-.232 2.35 1.09 4.9 1.09 7.25 0 .099.08.2.158.302.232-.39.21-.8.41-1.22.586.22.448.48.875.77 1.274a19.9 19.9 0 0 0 5.767-2.437c.34-4.39-.49-8.36-2.905-12.06ZM9.35 14.3c-.87 0-1.58-.8-1.58-1.79s.71-1.79 1.58-1.79c.88 0 1.59.8 1.59 1.79s-.71 1.79-1.59 1.79Zm5.3 0c-.88 0-1.59-.8-1.59-1.79s.71-1.79 1.59-1.79c.87 0 1.58.8 1.58 1.79s-.71 1.79-1.58 1.79Z"/>
                  </svg>
                </a>
                <a href="#" aria-label="Telegram" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition">
                  {/* telegram */}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M9.036 15.804 8.9 19.3c.36 0 .516-.154.701-.339l1.68-1.61 3.486 2.56c.64.353 1.093.167 1.268-.59l2.297-10.783c.235-1.094-.418-1.52-1.095-1.253L4.93 9.88c-1.063.41-1.047 1 .185 1.266l3.822.957 8.877-5.604c.418-.28.8-.125.486.156L9.036 15.804Z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Columns */}
          <div>
            <h4 className="text-white font-semibold">About</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li><Link href="/privacy" className="hover:text-white/90">Privacy Policy</Link></li>
              <li><Link href="/Pricing" className="hover:text-white/90">Pricing</Link></li>
              <li><Link href="/refund" className="hover:text-white/90">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold">Links</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li><Link href="#" className="hover:text-white/90">Docs</Link></li>
              <li><Link href="#" className="hover:text-white/90">API</Link></li>
              <li><Link href="#" className="hover:text-white/90">Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold">Blog</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li><Link href="#" className="hover:text-white/90">Online Manga Translator</Link></li>
              <li><Link href="#" className="hover:text-white/90">How to Use Manga Translator</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50">
          <div>© {new Date().getFullYear()} Borderless Translator. All rights reserved.</div>
          
        </div>
      </div>
    </footer>
  );
}
