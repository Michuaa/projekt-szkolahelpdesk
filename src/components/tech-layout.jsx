"use client";

import { useEffect, useSyncExternalStore } from "react";

const THEME_KEY = "helpdesk-theme";
const THEME_EVENT = "helpdesk-theme-change";

function subscribeToTheme(callback) {
	window.addEventListener(THEME_EVENT, callback);
	window.addEventListener("storage", callback);
	return () => {
		window.removeEventListener(THEME_EVENT, callback);
		window.removeEventListener("storage", callback);
	};
}

function getThemeSnapshot() {
	return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot() {
	return "light";
}

export default function TechLayout({
	eyebrow = "Przestrzeń robocza",
	brandSubtitle = "Panel techniczny",
	title,
	subtitle,
	sectionTitle,
	sectionMeta = "Panel roboczy",
	children,
}) {
	const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

	useEffect(() => {
		let savedTheme = "light";
		try {
			savedTheme = localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
		} catch {
			// Motyw nadal działa w bieżącym widoku.
		}
		document.documentElement.dataset.theme = savedTheme;
		window.dispatchEvent(new Event(THEME_EVENT));
	}, []);

	const toggleTheme = () => {
		const nextTheme = theme === "light" ? "dark" : "light";
		document.documentElement.dataset.theme = nextTheme;
		try {
			localStorage.setItem(THEME_KEY, nextTheme);
		} catch {
			// Motyw nadal działa w bieżącym widoku.
		}
		window.dispatchEvent(new Event(THEME_EVENT));
	};

	return (
		<main className="tech-page" data-theme={theme}>
			<style>{`
				.tech-page{--bg:#f4f6fb;--surface:#fff;--text:#192238;--muted:#758096;--line:#e7eaf1;--accent:#655be8;min-height:100vh;padding:28px clamp(18px,5vw,72px);color:var(--text);background:radial-gradient(ellipse at 12% 0%,#e9e7ff 0,transparent 36%),radial-gradient(ellipse at 100% 20%,#e4f5f2 0,transparent 30%),var(--bg);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;transition:background .2s,color .2s}
				.tech-page[data-theme="dark"]{--bg:#10131d;--surface:#1b2030;--text:#f2f4fb;--muted:#9ba5ba;--line:#30374a;--accent:#aaa1ff;background:radial-gradient(ellipse at 12% 0%,#29264c 0,transparent 36%),radial-gradient(ellipse at 100% 20%,#173b3b 0,transparent 30%),var(--bg)}
				.tech-page *{box-sizing:border-box}.tech-shell{max-width:1120px;margin:auto}.tech-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:64px}.tech-brand{display:flex;align-items:center;gap:12px;font-size:15px;font-weight:750}.tech-mark{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;color:white;background:linear-gradient(140deg,#8177f5,#5b52cd);box-shadow:0 8px 20px #655bd944}.tech-brand small{display:block;margin-top:3px;color:var(--muted);font-size:11px;font-weight:500}.tech-toggle{display:flex;align-items:center;gap:9px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;color:var(--text);background:var(--surface);font:600 13px inherit;cursor:pointer}.tech-toggle:hover{border-color:var(--accent)}.tech-heading{margin-bottom:30px}.tech-eyebrow{margin:0 0 9px;color:var(--accent);font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase}.tech-heading h1{margin:0;font-size:clamp(32px,5vw,46px);line-height:1.1;letter-spacing:-1.6px}.tech-subtitle{margin:11px 0 0;color:var(--muted);font-size:14px}.tech-card{overflow:hidden;border:1px solid var(--line);border-radius:18px;background:var(--surface);box-shadow:0 18px 48px #20294b0b}.tech-card-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:21px 24px;border-bottom:1px solid var(--line)}.tech-card-header h2{margin:0;font-size:15px}.tech-card-header span{color:var(--muted);font-size:12px}.tech-content{padding:24px}.tech-placeholder{display:grid;min-height:260px;place-items:center;padding:32px;text-align:center}.tech-placeholder-icon{display:grid;place-items:center;width:48px;height:48px;margin:0 auto 15px;border-radius:15px;color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--surface));font-size:22px}.tech-placeholder h3{margin:0;font-size:15px}.tech-placeholder p{max-width:340px;margin:8px 0 0;color:var(--muted);font-size:13px;line-height:1.6}.tech-form{display:grid;gap:18px;max-width:560px}.tech-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.tech-field{display:grid;gap:8px}.tech-label{color:var(--text);font-size:13px;font-weight:600}.tech-input,.tech-textarea{width:100%;border:1px solid var(--line);border-radius:10px;padding:12px 13px;color:var(--text);background:var(--surface);font:inherit;font-size:14px}.tech-input::placeholder,.tech-textarea::placeholder{color:var(--muted)}.tech-input:focus,.tech-textarea:focus{outline:2px solid color-mix(in srgb,var(--accent) 40%,transparent);outline-offset:1px}.tech-textarea{min-height:120px;resize:vertical}.tech-static-button{width:100%;min-height:44px;border:0;border-radius:10px;padding:11px 16px;color:#fff;background:#655be8;font:600 14px inherit;cursor:default}.tech-form-note{margin:0;color:var(--muted);font-size:13px;line-height:1.6}
				.tech-toggle,.tech-static-button{font-family:inherit;font-weight:600}.tech-toggle{font-size:13px}.tech-static-button{font-size:14px}.tech-link{color:var(--accent);font-weight:600;text-decoration:none}.tech-link:hover{text-decoration:underline}
				@media(max-width:600px){.tech-page{padding:20px 15px 32px}.tech-topbar{margin-bottom:48px}.tech-card-header{padding:17px}.tech-content{padding:18px}.tech-placeholder{min-height:220px}.tech-form-grid{grid-template-columns:1fr}}
			`}</style>
			<div className="tech-shell">
				<header className="tech-topbar">
					<div className="tech-brand"><span className="tech-mark" aria-hidden="true">✦</span><span>Helpdesk<small>{brandSubtitle}</small></span></div>
					<button className="tech-toggle" type="button" onClick={toggleTheme}>
						<span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>{theme === "light" ? "Tryb ciemny" : "Tryb jasny"}
					</button>
				</header>
				<section className="tech-heading">
					<p className="tech-eyebrow">{eyebrow}</p>
					<h1>{title}</h1>
					<p className="tech-subtitle">{subtitle}</p>
				</section>
				<section className="tech-card" aria-label={sectionTitle}>
					<div className="tech-card-header"><h2>{sectionTitle}</h2><span>{sectionMeta}</span></div>
					<div className="tech-content">{children}</div>
				</section>
			</div>
		</main>
	);
}