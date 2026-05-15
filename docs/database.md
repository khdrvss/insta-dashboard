# Database Schema

**ORM:** Prisma 5  
**Dev:** SQLite (zero config, `packages/db/dev.db`)  
**Prod:** PostgreSQL 16  
**Client:** `@instagram-dashboard/db` (internal workspace package)

## Entity Relationship Diagram

```
User (1) ──── (1) InstagramAccount
  │
  ├── (many) Competitor
  │       └── (many) Post
  │               └── (1) VideoAnalysis
  │
  ├── (many) GeneratedScript
  ├── (many) AnalysisJob
  ├── (many) UserPost
  └── (many) AiUsageLog
```

## Models

### User

Core user model. Linked to Clerk authentication via `clerkId`.

| Field                   | Type              | Notes                                  |
| ----------------------- | ----------------- | -------------------------------------- |
| `id`                    | `String` (cuid)   | Primary key                            |
| `clerkId`               | `String` (unique) | Clerk user ID                          |
| `email`                 | `String` (unique) |                                        |
| `instagramHandle`       | `String?`         | Set during onboarding                  |
| `niche`                 | `String?`         | e.g. "construction Tashkent"           |
| `location`              | `String?`         | Target location                        |
| `targetAudience`        | `String?`         |                                        |
| `brandVoice`            | `String?`         | formal / friendly / bold / educational |
| `products`              | `String?`         | Products or services                   |
| `plan`                  | `String`          | Default: `free`, upgraded to `pro`     |
| `onboardingDone`        | `Boolean`         |                                        |
| `metaAccessToken`       | `String?`         | Instagram OAuth token                  |
| `metaAccessTokenExpiry` | `DateTime?`       | Token expiration                       |
| `createdAt`             | `DateTime`        |                                        |
| `updatedAt`             | `DateTime`        |                                        |

**Relations:** InstagramAccount (1:1), Competitors, GeneratedScripts, AnalysisJobs, UserPosts, AiUsageLogs

---

### InstagramAccount

One-to-one with User. Stores cached Instagram profile data.

| Field               | Type                       | Notes                                      |
| ------------------- | -------------------------- | ------------------------------------------ |
| `id`                | `String` (cuid)            | Primary key                                |
| `userId`            | `String` (unique, FK→User) |                                            |
| `igUserId`          | `String`                   | Instagram user ID                          |
| `username`          | `String`                   |                                            |
| `name`              | `String?`                  | Display name                               |
| `biography`         | `String?`                  | Bio text                                   |
| `profilePictureUrl` | `String?`                  |                                            |
| `followersCount`    | `Int`                      |                                            |
| `followsCount`      | `Int`                      |                                            |
| `mediaCount`        | `Int`                      |                                            |
| `avgEngagementRate` | `Float`                    | Calculated from posts                      |
| `avgLikes`          | `Int`                      |                                            |
| `avgComments`       | `Int`                      |                                            |
| `postingFreqPerWk`  | `Float`                    |                                            |
| `topHashtags`       | `String`                   | JSON string array (SQLite limitation)      |
| `contentMix`        | `String`                   | JSON with video/image/carousel percentages |
| `lastSyncedAt`      | `DateTime`                 |                                            |

---

### Competitor

Tracked Instagram competitor accounts.

| Field             | Type               | Notes                                |
| ----------------- | ------------------ | ------------------------------------ |
| `id`              | `String` (cuid)    | Primary key                          |
| `userId`          | `String` (FK→User) |                                      |
| `handle`          | `String`           | Instagram username                   |
| `displayName`     | `String?`          |                                      |
| `profilePicUrl`   | `String?`          |                                      |
| `bio`             | `String?`          |                                      |
| `followersEst`    | `Int?`             | AI-estimated                         |
| `relevanceScore`  | `Int?`             | 0-100                                |
| `confirmed`       | `Boolean`          | User confirmed tracking              |
| `discoverySource` | `String?`          | hashtag_search / ad_library / manual |
| `lastAnalyzedAt`  | `DateTime?`        |                                      |
| `createdAt`       | `DateTime`         |                                      |

**Unique constraint:** `[userId, handle]`  
**Relations:** Posts

---

### Post

Competitor's Instagram posts (up to 30 per competitor).

| Field             | Type                     | Notes                                   |
| ----------------- | ------------------------ | --------------------------------------- |
| `id`              | `String` (cuid)          | Primary key                             |
| `competitorId`    | `String` (FK→Competitor) |                                         |
| `externalId`      | `String`                 | Instagram media ID                      |
| `mediaType`       | `String`                 | IMAGE / VIDEO / CAROUSEL_ALBUM          |
| `caption`         | `String?`                |                                         |
| `hashtags`        | `String?`                | JSON string array                       |
| `videoUrl`        | `String?`                | Download URL (processed then discarded) |
| `thumbnailUrl`    | `String?`                |                                         |
| `likes`           | `Int`                    | Estimated                               |
| `comments`        | `Int`                    | Estimated                               |
| `views`           | `Int?`                   | Estimated                               |
| `shares`          | `Int?`                   | Estimated                               |
| `engagementScore` | `Float?`                 | Calculated                              |
| `durationSecs`    | `Int?`                   | For video posts                         |
| `takenAt`         | `DateTime`               | Post date                               |
| `createdAt`       | `DateTime`               |                                         |

**Relations:** Competitor (parent), VideoAnalysis (1:1)

---

### VideoAnalysis

One-to-one with Post. Stores AI analysis results.

| Field             | Type                       | Notes                                      |
| ----------------- | -------------------------- | ------------------------------------------ |
| `id`              | `String` (cuid)            | Primary key                                |
| `postId`          | `String` (unique, FK→Post) |                                            |
| `transcript`      | `String?`                  | Whisper transcription                      |
| `hookText`        | `String?`                  | Identified hook text                       |
| `hookType`        | `String?`                  | question / statistic / story / problem     |
| `hookDurationS`   | `Int?`                     | Hook section duration                      |
| `valueProp`       | `String?`                  | Identified value proposition               |
| `ctaText`         | `String?`                  | Call to action                             |
| `pacingStyle`     | `String?`                  | fast / moderate / slow                     |
| `audioTrack`      | `String?`                  | Music / voiceover details                  |
| `sentiment`       | `String?`                  | positive / neutral / urgent                |
| `contentFormat`   | `String?`                  | educational / entertaining / inspirational |
| `powerWords`      | `String?`                  | JSON string array                          |
| `embeddingVector` | `String?`                  | Vector embedding (JSON)                    |
| `pineconeId`      | `String?`                  | Pinecone vector ID                         |
| `createdAt`       | `DateTime`                 |                                            |

---

### GeneratedScript

AI-generated script variations.

| Field        | Type               | Notes                                                |
| ------------ | ------------------ | ---------------------------------------------------- |
| `id`         | `String` (cuid)    | Primary key                                          |
| `userId`     | `String` (FK→User) |                                                      |
| `goal`       | `String`           | brand_awareness / direct_sales / lead_generation     |
| `tone`       | `String`           | formal / friendly / bold / educational               |
| `platform`   | `String`           | reels / ads                                          |
| `lengthSecs` | `Int`              | 15 / 30 / 60                                         |
| `niche`      | `String?`          |                                                      |
| `scriptJson` | `String`           | Full script data (JSON — scenes, captions, hashtags) |
| `promptHash` | `String?`          | For caching                                          |
| `modelUsed`  | `String?`          | e.g. "claude-sonnet-4-20250514"                      |
| `tokenCount` | `Int?`             |                                                      |
| `createdAt`  | `DateTime`         |                                                      |

---

### AnalysisJob

Tracks async content analysis jobs.

| Field         | Type               | Notes                             |
| ------------- | ------------------ | --------------------------------- |
| `id`          | `String` (cuid)    | Primary key                       |
| `userId`      | `String` (FK→User) |                                   |
| `type`        | `String`           | "competitor_analysis"             |
| `status`      | `String`           | pending / running / done / failed |
| `progress`    | `Int`              | 0-100                             |
| `metadata`    | `String?`          | JSON with additional info         |
| `errorMsg`    | `String?`          |                                   |
| `startedAt`   | `DateTime?`        |                                   |
| `completedAt` | `DateTime?`        |                                   |
| `createdAt`   | `DateTime`         |                                   |

---

### UserPost

User's own Instagram posts (synced via OAuth).

| Field            | Type               | Notes                          |
| ---------------- | ------------------ | ------------------------------ |
| `id`             | `String` (cuid)    | Primary key                    |
| `userId`         | `String` (FK→User) |                                |
| `igMediaId`      | `String`           | Instagram media ID             |
| `mediaType`      | `String`           | IMAGE / VIDEO / CAROUSEL_ALBUM |
| `caption`        | `String?`          |                                |
| `hashtags`       | `String?`          | JSON string array              |
| `mediaUrl`       | `String?`          |                                |
| `thumbnailUrl`   | `String?`          |                                |
| `permalink`      | `String?`          | Link to Instagram post         |
| `likeCount`      | `Int`              |                                |
| `commentCount`   | `Int`              |                                |
| `reachEst`       | `Int?`             | Estimated                      |
| `impressionsEst` | `Int?`             | Estimated                      |
| `engagementRate` | `Float?`           | Calculated                     |
| `takenAt`        | `DateTime`         |                                |
| `createdAt`      | `DateTime`         |                                |

---

### AiUsageLog

Tracks AI API usage for billing and monitoring.

| Field          | Type               | Notes                                                             |
| -------------- | ------------------ | ----------------------------------------------------------------- |
| `id`           | `String` (cuid)    | Primary key                                                       |
| `userId`       | `String` (FK→User) |                                                                   |
| `model`        | `String`           | claude-sonnet-4-20250514 / whisper-1                              |
| `operation`    | `String`           | analyze_video / generate_script / filter_competitors / transcribe |
| `inputTokens`  | `Int?`             |                                                                   |
| `outputTokens` | `Int?`             |                                                                   |
| `costUsd`      | `Float?`           | Calculated cost                                                   |
| `durationMs`   | `Int?`             |                                                                   |
| `cached`       | `Boolean`          | Whether response was cached                                       |
| `createdAt`    | `DateTime`         |                                                                   |

## SQLite Notes

- Enums are stored as plain `String` (Prisma `String` type)
- Arrays are stored as JSON stringified to `String` columns
- Switch to PostgreSQL (via Supabase) in production for enum + array support
