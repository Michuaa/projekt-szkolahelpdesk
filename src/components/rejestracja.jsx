import TechLayout from "@/components/tech-layout";
import Link from "next/link";

export default function Rejestracja() {
	return (
		<TechLayout
			brandSubtitle="Dostęp do systemu"
			eyebrow="Dołącz do nas"
			title="Utwórz konto"
			subtitle="Panel szkolnego helpdesku"
			sectionTitle="Dane konta"
			sectionMeta="Nowy użytkownik"
		>
			<div className="tech-form">
				<label className="tech-field">
					<span className="tech-label">Imię i nazwisko</span>
					<input className="tech-input" name="name" autoComplete="name" placeholder="Jan Kowalski" />
				</label>
				<label className="tech-field">
					<span className="tech-label">E-mail</span>
					<input className="tech-input" name="email" type="email" autoComplete="email" placeholder="imie.nazwisko@zs1mm.edu.pl" />
				</label>
				<div className="tech-form-grid">
					<label className="tech-field">
						<span className="tech-label">Login</span>
						<input className="tech-input" name="login" autoComplete="username" placeholder="Login" />
					</label>
					<label className="tech-field">
						<span className="tech-label">Hasło</span>
						<input className="tech-input" name="password" type="password" autoComplete="new-password" placeholder="Hasło" />
					</label>
					<label className="tech-field">
						<span className="tech-label">Powtórz hasło</span>
						<input className="tech-input" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Wpisz hasło ponownie" />
					</label>
				</div>
				<button className="tech-static-button" type="button">Utwórz konto</button>
				<p className="tech-form-note">Masz już konto? <Link className="tech-link" href="/">Zaloguj się</Link></p>
			</div>
		</TechLayout>
	);
}