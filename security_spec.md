# Security Specification: MACH10 Media Portfolio Lock

This document outlines the strict zero-trust data invariants, rogue payloads, and validation requirements for the `/projects/{projectId}` Firestore collections.

## 1. Data Invariants

1. **Read-Only Public Gallery**: Portfolio projects must be universally readable (`allow get, list: if true;`) so that site visitors can dynamically view exhibits without needing authentication.
2. **Restricted Admin Writes**: Creating, updating, or deleting exhibits is strictly restricted to the authorized admin email address (`Besofekad@gmail.com`) with a verified Google account (`request.auth.token.email_verified == true`).
3. **Identifier Sanity**: All document identifiers must meet standard constraints (alphanumeric, hyphens) and never exceed 128 characters to prevent pollution.
4. **Data Size Integrity**: Text descriptions, titles, and image URLs are strictly bounded to prevent Denial of Wallet payload exhaustion.
5. **No Orphaned Schema Keys**: Document keys on creation must be exactly equal to the required project schematic to prevent shadow keys.

## 2. The "Dirty Dozen" Payloads (Zero-Trust Test Deck)

The following payload attempts MUST result in `PERMISSION_DENIED` rejection on write:

### Payload 1: Unauthenticated Creator
Anonymous write attempt to create a custom project.
```json
{
  "id": "proj-exploit-1",
  "title": "Hacked",
  "alias": "hacked",
  "client": "Malicious",
  "category": "Branding",
  "tagline": "Rogue entry",
  "description": "Unauthorized rewrite",
  "heroImage": "http://xsec.org/logo.png",
  "campaignDetails": "Injected text",
  "year": "2026",
  "stats": [],
  "credits": [],
  "gallery": []
}
```

### Payload 2: Spoofed Creator (Wrong Email)
Attempt to write with an authenticated user whose email is not `Besofekad@gmail.com`.
```json
// auth.token.email = "hacker@evil.com", email_verified = true
{
  "id": "proj-exploit-2",
  "title": "Fake Brand Entry",
  "alias": "fake-brand",
  "client": "Malicious",
  "category": "Photography",
  "tagline": "Rogue entry",
  "description": "Unauthorized rewrite",
  "heroImage": "http://xsec.org/logo.png",
  "campaignDetails": "Injected text",
  "year": "2026",
  "stats": [],
  "credits": [],
  "gallery": []
}
```

### Payload 3: Unverified Email Admin Spoof
Attempt to write pretending to be the admin but with `email_verified == false` on the oauth token.
```json
// auth.token.email = "Besofekad@gmail.com", email_verified = false
{
  "id": "proj-exploit-3",
  "title": "Verif Bypass",
  "alias": "verif-bypass",
  "client": "Malicious",
  "category": "Photography",
  "tagline": "Rogue entry",
  "description": "Unauthorized rewrite",
  "heroImage": "http://xsec.org/logo.png",
  "campaignDetails": "Injected text",
  "year": "2026",
  "stats": [],
  "credits": [],
  "gallery": []
}
```

### Payload 4: Sub-resource ID Poisoning
Creating a project with a malicious 1KB junk-character document string.
```json
{
  "id": "proj_invalid_id_$$$_poison_!!!!_repeat_200_times...",
  "title": "Junk ID Campaign",
  "alias": "junk-id",
  "client": "Malicious",
  "category": "Photography"
}
```

### Payload 5: Missing Required Schema Structure (Title Missing)
Attempting to insert a project with missing required properties.
```json
{
  "id": "proj-invalid-5",
  "client": "No Title Client",
  "category": "Fashion",
  "campaignDetails": "text"
}
```

### Payload 6: Rogue Extra Keys (Shadow Injection)
Inserting undocumented property variables to bypass standard state tracking.
```json
{
  "id": "proj-invalid-6",
  "title": "Rogue Field Campaign",
  "alias": "rogue-field",
  "client": "Malicious",
  "category": "Fashion",
  "tagline": "text",
  "description": "text",
  "heroImage": "http://xsec.org/test.png",
  "campaignDetails": "text",
  "year": "2026",
  "stats": [],
  "credits": [],
  "gallery": [],
  "ghostRoleOverride": "ADMIN_FULL"
}
```

### Payload 7: Huge Payload Strings (Wallet Attack)
Extremely bloated description length attempt.
```json
{
  "id": "proj-bloat-7",
  "title": "Bloat Campaign",
  "alias": "bloated-project",
  "client": "Malicious",
  "category": "Fashion",
  "tagline": "text",
  "description": "BLOAT_STRING_REPEATED_1000000_TIMES...",
  "heroImage": "http://xsec.org/test.png",
  "campaignDetails": "text",
  "year": "2026",
  "stats": [],
  "credits": [],
  "gallery": []
}
```

### Payload 8: Wrong Column Type
Attempting to save boolean instead of category enum string.
```json
{
  "id": "proj-type-8",
  "title": "Bloat Campaign",
  "alias": "bloated-project",
  "client": "Malicious",
  "category": true,
  "tagline": "text"
}
```

### Payload 9: Rogue Category Entry
Inserting a categories value that is outside the permitted ProjectCategory list.
```json
{
  "id": "proj-cat-9",
  "title": "Rogue Cat Campaign",
  "alias": "rogue-cat",
  "client": "Malicious",
  "category": "CryptoWeb3Metaverse",
  "tagline": "text"
}
```

### Payload 10: Sibling Time Manipulation
Attempting to create or edit with client-crafted timestamps.
```json
{
  "id": "proj-time-10",
  "title": "Custom Timestamp Campaign",
  "alias": "custom-time",
  "client": "Malicious",
  "category": "Fashion",
  "createdAt": "2020-01-01T00:00:00Z"
}
```

### Payload 11: Immutable Field Swap
Attempting to change a project's `id` or `alias` after creation.
```json
{
  "id": "modified-id",
  "title": "Modified Campaign Title",
  "alias": "different-alias"
}
```

### Payload 12: Unchecked Large Collections (Unbounded Arrays)
Bypassing limits by injecting over 100 stat items in a single document.
```json
{
  "id": "proj-arrays-12",
  "title": "Bloated Lists",
  "stats": [ { "label": "a", "value": "b" }, { "label": "a", "value": "b" }, ... /* 100 elements */ ]
}
```
