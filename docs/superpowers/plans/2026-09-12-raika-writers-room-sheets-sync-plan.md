# Raika Writers Room Google Sheets Sync Implementation Plan

Plan for synchronizing approved Raika writers-room items with the existing Google Sheet. Drafts remain in Supabase; approved and archived items are upserted by stable item ID so retries do not create duplicates.
