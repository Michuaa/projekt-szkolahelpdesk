## Konfiguracja PocketBase dla zgłoszeń

Aplikacja używa kolekcji `issues` oraz kolekcji użytkowników `users`. W `users`
musi istnieć pole Boolean `czyTechnik`, które odróżnia konta techników od kont
użytkowników. W `issues` pozostaw pola używane już przez aplikację:

- `tytul` — tekst,
- `opis` — tekst,
- `uzytkownik` — relacja do `users`,
- `zdjecie` — pole pliku.

Dodaj do `issues` poniższe pola:

| Pole | Typ PocketBase | Konfiguracja |
| --- | --- | --- |
| `sala` | Text | Wymagane; wybór w aplikacji: 5–20, 100–122 oraz 200–222 |
| `kategoria` | Select (pojedynczy wybór) | Wymagane; `sprzęt komputerowy`, `multimedia`, `instalacje`, `inne` |
| `priorytet` | Select (pojedynczy wybór) | Wymagane; `niski`, `średni`, `wysoki` |
| `status` | Select (pojedynczy wybór) | `nowe`, `w realizacji`, `zamknięte`; wartość domyślna: `nowe` |
| `komentarz` | Text | Opcjonalny komentarz technika |

Ustaw pole `zdjecie` jako nieobowiązkowe, z maksymalnie jednym plikiem i limitem
`5242880` bajtów. Ogranicz dozwolone rozszerzenia do formatów graficznych, np.
`jpg`, `jpeg`, `png`, `webp`, `gif` i `bmp`. Sam formularz dodatkowo sprawdza,
czy plik jest obrazem i czy nie przekracza 5 MB.

Reguły dostępu kolekcji `issues` są ważne dla prywatności i muszą być egzekwowane
po stronie PocketBase (samo filtrowanie listy w przeglądarce nie zabezpiecza API):

- List/Search oraz View: `@request.auth.id != "" && (@request.auth.czyTechnik = true || uzytkownik = @request.auth.id)`
- Create: `@request.auth.id != "" && @request.body.uzytkownik = @request.auth.id && @request.auth.czyTechnik != true`
- Update oraz Delete: `@request.auth.id != "" && @request.auth.czyTechnik = true`

Nowe pola trzeba dodać w panelu PocketBase przed wdrożeniem tej wersji. Przy
ustawianiu ich jako wymaganych najpierw uzupełnij dane w istniejących rekordach;
brakujący status aplikacja tymczasowo pokazuje jako `nowe`.
