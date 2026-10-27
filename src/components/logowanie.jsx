import TechLayout from "@/components/tech-layout";

export default function Logowanie() {
	return (
		<TechLayout
			brandSubtitle="Dostęp do systemu"
			eyebrow="Witaj ponownie"
			title="Zaloguj się"
			subtitle="Panel szkolnego helpdesku"
			sectionTitle="Dane logowania"
			sectionMeta="Konto użytkownika"
		>
			<div className="tech-form">
				<label className="tech-field">
					<span className="tech-label">Login</span>
					<input className="tech-input" name="login" autoComplete="username" placeholder="Twój login" />
				</label>
				<label className="tech-field">
					<span className="tech-label">Hasło</span>
					<input className="tech-input" name="password" type="password" autoComplete="current-password" placeholder="Wpisz swoje hasło" />
				</label>
				<button className="tech-static-button" type="button">Zaloguj się</button>
				<p className="tech-form-note">Nie masz jeszcze konta? <a className="tech-link" href="/rejestracja">Zarejestruj się</a></p>
			</div>
		</TechLayout>
	);
}