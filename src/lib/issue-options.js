export const ISSUE_ROOMS = [
    ...Array.from({ length: 16 }, (_, index) => index + 5),
    ...Array.from({ length: 23 }, (_, index) => index + 100),
    ...Array.from({ length: 23 }, (_, index) => index + 200),
];

export const ISSUE_CATEGORIES = [
    "sprzęt komputerowy",
    "multimedia",
    "instalacje",
    "inne",
];

export const ISSUE_PRIORITIES = ["niski", "średni", "wysoki"];
export const ISSUE_STATUSES = ["nowe", "w realizacji", "zamknięte"];
export const ISSUE_STATUS_LABELS = {
    nowe: "Nowe",
    "w realizacji": "W realizacji",
    "zamknięte": "Zamknięte",
};
