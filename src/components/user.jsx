import TechLayout from "@/components/tech-layout";

export default function User() {
	return (
		<TechLayout
			brandSubtitle="Panel użytkownika"
			title="Zgłoszenia"
			subtitle="Przestrzeń użytkownika"
			sectionTitle="Moje zgłoszenia"
		>
			<div className="tech-placeholder">
				<div>
					<div className="tech-placeholder-icon" aria-hidden="true">✧</div>
					<h3>Brak zgłoszeń do wyświetlenia</h3>
					<p>Lista zgłoszeń pojawi się w tym miejscu.</p>
				</div>
			</div>
		</TechLayout>
	);
}