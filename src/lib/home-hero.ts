// Which hero the home page shows.
//  - "launch": grand-opening hero with the welcome offer (BIENVENUE15). It is
//    only used while that promo is active; once it expires the home page falls
//    back to the classic hero on its own.
//  - "classic": the original hero (src/components/home-hero-classic.tsx), kept
//    intact so we can switch back — or to a future seasonal hero — by changing
//    this one line.
export const HOME_HERO_VARIANT: "launch" | "classic" = "launch";
