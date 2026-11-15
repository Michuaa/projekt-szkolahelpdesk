# Konfiguracja aplikacji i PocketBase

## Konfiguracja aplikacji

Skopiuj `.env.example` do `.env.local` i ustaw `NEXT_PUBLIC_POCKETBASE_URL` na
publiczny adres PocketBase. W Coolify ustaw tę zmienną także w czasie buildu
aplikacji Next.js, ponieważ zmienne `NEXT_PUBLIC_` są wstawiane do bundla podczas
budowania. Nie commituj plików `.env`.

## Konfiguracja PocketBase

Aplikacja używa kolekcji `users` typu Auth oraz `issues` typu Base. Kolekcja
`users` musi mieć pole Boolean `czyTechnik`. Kolekcja `issues` musi mieć pola
`tytul` (text), `opis` (text), `uzytkownik` (relacja do `users`), `zdjecie`
(opcjonalny plik), `sala` (text), `kategoria` (select), `priorytet` (select),
`status` (select) i `komentarz` (text). Statusy to `nowe`, `w realizacji`,
`zamknięte`; wartość domyślna `nowe`. Plik `zdjecie` powinien mieć maksymalnie
jeden plik, limit 5242880 bajtów, dozwolone rozszerzenia graficzne i włączoną
opcję plików chronionych. Dostęp do obrazów wymaga uwierzytelnienia i reguły
widoczności rekordu.

Ustaw reguły API kolekcji `issues` w panelu PocketBase. Ograniczają one
bezpośrednie zapytania API, a nie tylko widok w interfejsie:

- List i View: `@request.auth.id != "" && (@request.auth.czyTechnik = true || uzytkownik = @request.auth.id)`
- Create: `@request.auth.id != "" && @request.auth.czyTechnik != true && @request.body.uzytkownik = @request.auth.id`
- Update i Delete: `@request.auth.id != "" && @request.auth.czyTechnik = true`

W kolekcji `users` ustaw Create rule tak, aby nowe konto nie mogło nadać sobie
roli technika: `@request.body.czyTechnik:isset = false || @request.body.czyTechnik = false`.
Ustaw Update rule na
`@request.auth.id != "" && id = @request.auth.id && @request.body.czyTechnik:changed = false`,
aby użytkownik nie mógł zmienić własnej roli.

### Historia zmian

Utwórz w panelu PocketBase kolekcję typu Base `ticket_events` z polami:

- `issue` — wymagana relacja do `issues`, maksymalnie jeden rekord,
- `actor` — wymagana relacja do `users`, maksymalnie jeden rekord,
- `from_status` — wymagany Text,
- `to_status` — wymagany Text.

Pozostaw systemowe pole `created`; PocketBase zapisze w nim czas utworzenia.
Ustaw reguły kolekcji:

- List i View: `@request.auth.id != "" && (@request.auth.czyTechnik = true || issue.uzytkownik = @request.auth.id)`
- Create: `@request.auth.id != "" && @request.auth.czyTechnik = true && actor = @request.auth.id`
- Update i Delete: zablokowane (locked).

Panel technika tworzy wpis po udanej zmianie statusu. Wariant ten zapisuje
historię z przeglądarki: reguła API wymusza, że aktorem jest zalogowany technik,
ale technik może ominąć panel, zmienić zgłoszenie bez wpisu albo sfałszować
poprzedni status. Nie jest to niepodważalny audyt serwerowy.

Subskrypcje realtime podlegają regułom List/View PocketBase. Panel technika
subskrybuje kolekcję `issues`; panel użytkownika otrzymuje wyłącznie zmiany
zgłoszeń, do których ma dostęp API. Serwer PocketBase i wdrożona aplikacja muszą
mieć włączoną obsługę API realtime.

## Trwałość danych w Coolify

W Coolify pozostaw trwały wolumen danych zamontowany pod `/app/pb_data`. Nie
usuwaj tego wolumenu przy redeployu.
