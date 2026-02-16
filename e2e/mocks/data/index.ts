/**
 * Mock data for E2E tests
 * All data follows the actual API response structures
 */

export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  emailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockSession = {
  id: "test-session-id",
  userId: mockUser.id,
  token: "test-session-token-e2e",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockStreams = [
  {
    id: "stream-1",
    name: "Tech News",
    description: "Latest technology news and updates",
    userId: mockUser.id,
    categories: ["news", "videos"],
    keywords: ["technology", "AI", "software"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMilkedAt: new Date().toISOString(),
  },
  {
    id: "stream-2",
    name: "Design Inspiration",
    description: "UI/UX design trends and inspiration",
    userId: mockUser.id,
    categories: ["social", "videos"],
    keywords: ["design", "UI", "UX"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMilkedAt: null,
  },
];

export const mockFeedItems = [
  {
    id: "item-1",
    title: "The Future of AI in Software Development",
    url: "https://example.com/ai-future",
    description: "How AI is transforming the way we build software",
    imageUrl: "https://example.com/images/ai.jpg",
    source: "Tech Blog",
    category: "news",
    author: "John Doe",
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    batchId: "batch-1",
    fetchedAt: new Date().toISOString(),
    isCustomItem: false,
    isEdited: false,
    streamId: "stream-1",
    metadata: null,
  },
  {
    id: "item-2",
    title: "Introduction to React 19",
    url: "https://example.com/react-19",
    description: "What's new in React 19",
    imageUrl: "https://example.com/images/react.jpg",
    source: "React Blog",
    category: "news",
    author: "Jane Smith",
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    batchId: "batch-1",
    fetchedAt: new Date().toISOString(),
    isCustomItem: false,
    isEdited: false,
    streamId: "stream-1",
    metadata: null,
  },
  {
    id: "item-3",
    title: "My Custom Article",
    url: "https://myblog.com/article",
    description: "A custom item I added",
    imageUrl: null,
    source: "My Blog",
    category: "custom",
    author: "Me",
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    batchId: null,
    fetchedAt: new Date().toISOString(),
    isCustomItem: true,
    isEdited: false,
    streamId: "stream-1",
    metadata: null,
  },
];

export const mockMklySource = `--- meta
title: Weekly Digest

--- use: newsletter

--- style
accent: #64748b
primary: #2563eb
tone: professional

--- newsletter/category
heading: Top News
category: news
maxItems: 5
style: detailed

--- newsletter/category
heading: Featured Videos
category: videos
maxItems: 3
style: brief`;

export const mockTemplates = [
  {
    id: "template-1",
    name: "Weekly Digest",
    streamId: "stream-1",
    linkedStreamId: null,
    isActive: true,
    mklySource: mockMklySource,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockNewsletters = [
  {
    id: "newsletter-1",
    title: "Weekly Tech Digest - January 2025",
    content: "<h1>Weekly Tech Digest</h1><p>This week in tech...</p>",
    status: "draft",
    streamId: "stream-1",
    linkedStreamId: null,
    streamName: "Tech News",
    templateId: "template-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
  },
];

// Subscription data matches the structure expected by both useSubscription hook and Pricing page
// Includes both flat tier/status (for Pricing page) and nested structure (for Subscription page)
export const mockSubscription = {
  // Flat properties for Pricing page compatibility
  tier: "professional" as const,
  status: "active" as const,
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  cancelAtPeriodEnd: false,
  // Nested structure for Subscription page
  subscription: {
    id: "sub-1",
    tier: "professional" as const,
    status: "active" as const,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
  },
  usage: {
    refreshesUsed: 5,
    aiCreditsUsed: 20,
    streamCount: 2,
    periodStart: new Date().toISOString(),
    periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  limits: {
    maxStreams: 10,
    aiCredits: 300,
    refreshes: 100,
    linkedStreams: true,
    allowCustomItems: true,
  },
  features: ["10 streams", "300 AI credits/month", "Linked streams"],
  snapshotedAt: null,
  fromSnapshot: false,
  freeTierStatus: {
    periodExpired: false,
    canRenew: true,
    active: true,
    message: null,
  },
};

export const mockLinkedStreams = [
  {
    id: "linked-stream-1",
    name: "Combined Tech Feed",
    description: "Tech news from multiple sources",
    userId: mockUser.id,
    streams: [mockStreams[0], mockStreams[1]],
    hasStreamTemplates: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockGeneratedContent = {
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Weekly Tech Digest</h1>
      <p>Welcome to this week's edition of our tech newsletter!</p>

      <h2>Top News</h2>
      <div style="margin-bottom: 20px;">
        <h3>The Future of AI in Software Development</h3>
        <p>How AI is transforming the way we build software...</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3>Introduction to React 19</h3>
        <p>What's new in React 19...</p>
      </div>

      <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">You received this newsletter because you subscribed to Tech News.</p>
      </footer>
    </div>
  `,
  title: "Weekly Tech Digest - January 2025",
};
