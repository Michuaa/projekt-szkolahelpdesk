export const NUMERY_SAL = [
    ...Array.from({ length: 15 }, (_, index) => index + 5),
    ...Array.from({ length: 22 }, (_, index) => index + 100),
    ...Array.from({ length: 22 }, (_, index) => index + 200),
];

export const KATEGORIE_ZGLOSZEN = [
    "sprzęt komputerowy",
    "multimedia",
    "instalacje",
    "inne",
];

export const PRIORYTETY_ZGLOSZEN = ["niski", "średni", "wysoki"];
export const STATUSY_ZGLOSZEN = ["nowe", "w realizacji", "zamknięte"];
export const ETYKIETY_STATUSOW = {
    nowe: "Nowe",
    "w realizacji": "W realizacji",
    "zamknięte": "Zamknięte",
};
