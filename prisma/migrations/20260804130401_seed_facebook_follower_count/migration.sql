-- Sets the real Facebook page + follower count now that the client gave
-- us the number (8.3k). getStoreSettings() lazily creates the singleton
-- StoreSettings row on first read, so by the time this migration runs in
-- an already-live environment the row exists; this is a no-op otherwise.
UPDATE "StoreSettings"
SET "facebookUrl" = 'https://www.facebook.com/ReptilesConcept',
    "facebookFollowerCount" = 8300
WHERE id = 'singleton';
