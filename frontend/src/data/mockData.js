// ============================================================
// Mock Data for Repository Architecture Navigator
// Simulates a parsed React + Node.js repository
// ============================================================

export const mockFileTree = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    expanded: true,
    children: [
      {
        id: 'src/components',
        name: 'components',
        type: 'folder',
        expanded: true,
        children: [
          { id: 'src/components/App.tsx', name: 'App.tsx', type: 'file', heat: 'red', icon: 'react' },
          { id: 'src/components/Header.tsx', name: 'Header.tsx', type: 'file', heat: 'yellow', icon: 'react' },
          { id: 'src/components/Sidebar.tsx', name: 'Sidebar.tsx', type: 'file', heat: 'yellow', icon: 'react' },
          { id: 'src/components/Dashboard.tsx', name: 'Dashboard.tsx', type: 'file', heat: 'red', icon: 'react' },
          { id: 'src/components/AuthGuard.tsx', name: 'AuthGuard.tsx', type: 'file', heat: 'blue', icon: 'react' },
          { id: 'src/components/Modal.tsx', name: 'Modal.tsx', type: 'file', heat: 'grey', icon: 'react' },
          { id: 'src/components/OldBanner.tsx', name: 'OldBanner.tsx', type: 'file', heat: 'hollow', icon: 'react' },
        ],
      },
      {
        id: 'src/hooks',
        name: 'hooks',
        type: 'folder',
        expanded: false,
        children: [
          { id: 'src/hooks/useAuth.ts', name: 'useAuth.ts', type: 'file', heat: 'red', icon: 'hook' },
          { id: 'src/hooks/useApi.ts', name: 'useApi.ts', type: 'file', heat: 'yellow', icon: 'hook' },
          { id: 'src/hooks/useTheme.ts', name: 'useTheme.ts', type: 'file', heat: 'grey', icon: 'hook' },
        ],
      },
      {
        id: 'src/services',
        name: 'services',
        type: 'folder',
        expanded: false,
        children: [
          { id: 'src/services/api.ts', name: 'api.ts', type: 'file', heat: 'red', icon: 'ts' },
          { id: 'src/services/auth.ts', name: 'auth.ts', type: 'file', heat: 'blue', icon: 'ts' },
          { id: 'src/services/analytics.ts', name: 'analytics.ts', type: 'file', heat: 'grey', icon: 'ts' },
          { id: 'src/services/legacy-logger.ts', name: 'legacy-logger.ts', type: 'file', heat: 'hollow', icon: 'ts' },
        ],
      },
      {
        id: 'src/utils',
        name: 'utils',
        type: 'folder',
        expanded: false,
        children: [
          { id: 'src/utils/helpers.ts', name: 'helpers.ts', type: 'file', heat: 'yellow', icon: 'ts' },
          { id: 'src/utils/constants.ts', name: 'constants.ts', type: 'file', heat: 'grey', icon: 'ts' },
          { id: 'src/utils/validators.ts', name: 'validators.ts', type: 'file', heat: 'yellow', icon: 'ts' },
        ],
      },
      {
        id: 'src/pages',
        name: 'pages',
        type: 'folder',
        expanded: false,
        children: [
          { id: 'src/pages/Home.tsx', name: 'Home.tsx', type: 'file', heat: 'red', icon: 'react' },
          { id: 'src/pages/Login.tsx', name: 'Login.tsx', type: 'file', heat: 'blue', icon: 'react' },
          { id: 'src/pages/Settings.tsx', name: 'Settings.tsx', type: 'file', heat: 'yellow', icon: 'react' },
          { id: 'src/pages/NotFound.tsx', name: 'NotFound.tsx', type: 'file', heat: 'grey', icon: 'react' },
        ],
      },
      { id: 'src/main.tsx', name: 'main.tsx', type: 'file', heat: 'blue', icon: 'react' },
      { id: 'src/index.css', name: 'index.css', type: 'file', heat: 'grey', icon: 'css' },
    ],
  },
  {
    id: 'server',
    name: 'server',
    type: 'folder',
    expanded: false,
    children: [
      { id: 'server/index.ts', name: 'index.ts', type: 'file', heat: 'blue', icon: 'ts' },
      { id: 'server/routes.ts', name: 'routes.ts', type: 'file', heat: 'red', icon: 'ts' },
      { id: 'server/middleware.ts', name: 'middleware.ts', type: 'file', heat: 'yellow', icon: 'ts' },
      { id: 'server/db.ts', name: 'db.ts', type: 'file', heat: 'red', icon: 'ts' },
    ],
  },
  { id: 'package.json', name: 'package.json', type: 'file', heat: 'grey', icon: 'json' },
  { id: 'tsconfig.json', name: 'tsconfig.json', type: 'file', heat: 'grey', icon: 'json' },
  { id: 'README.md', name: 'README.md', type: 'file', heat: 'grey', icon: 'md' },
];

// React Flow Graph nodes
export const mockGraphNodes = [
  // Entry Points (blue)
  { id: 'main', position: { x: 50, y: 250 }, data: { label: 'main.tsx', heat: 'blue', type: 'Entry Point', deps: 2, usedBy: 0 }, type: 'custom' },
  { id: 'auth-service', position: { x: 50, y: 450 }, data: { label: 'auth.ts', heat: 'blue', type: 'Service Entry', deps: 1, usedBy: 4 }, type: 'custom' },
  { id: 'server-index', position: { x: 50, y: 650 }, data: { label: 'server/index.ts', heat: 'blue', type: 'Server Entry', deps: 3, usedBy: 0 }, type: 'custom' },

  // High Impact (red)
  { id: 'app', position: { x: 320, y: 200 }, data: { label: 'App.tsx', heat: 'red', type: 'Root Component', deps: 6, usedBy: 1 }, type: 'custom' },
  { id: 'dashboard', position: { x: 600, y: 120 }, data: { label: 'Dashboard.tsx', heat: 'red', type: 'Page Component', deps: 5, usedBy: 1 }, type: 'custom' },
  { id: 'useAuth', position: { x: 320, y: 420 }, data: { label: 'useAuth.ts', heat: 'red', type: 'Auth Hook', deps: 2, usedBy: 6 }, type: 'custom' },
  { id: 'api', position: { x: 600, y: 420 }, data: { label: 'api.ts', heat: 'red', type: 'API Client', deps: 1, usedBy: 5 }, type: 'custom' },
  { id: 'routes', position: { x: 320, y: 650 }, data: { label: 'routes.ts', heat: 'red', type: 'Server Routes', deps: 2, usedBy: 1 }, type: 'custom' },
  { id: 'db', position: { x: 600, y: 650 }, data: { label: 'db.ts', heat: 'red', type: 'Database Layer', deps: 0, usedBy: 3 }, type: 'custom' },
  { id: 'home', position: { x: 600, y: 270 }, data: { label: 'Home.tsx', heat: 'red', type: 'Page', deps: 3, usedBy: 1 }, type: 'custom' },

  // Moderate (yellow)
  { id: 'header', position: { x: 880, y: 100 }, data: { label: 'Header.tsx', heat: 'yellow', type: 'Component', deps: 2, usedBy: 2 }, type: 'custom' },
  { id: 'sidebar', position: { x: 880, y: 250 }, data: { label: 'Sidebar.tsx', heat: 'yellow', type: 'Component', deps: 1, usedBy: 2 }, type: 'custom' },
  { id: 'useApi', position: { x: 880, y: 420 }, data: { label: 'useApi.ts', heat: 'yellow', type: 'Data Hook', deps: 1, usedBy: 3 }, type: 'custom' },
  { id: 'helpers', position: { x: 880, y: 560 }, data: { label: 'helpers.ts', heat: 'yellow', type: 'Utility', deps: 1, usedBy: 4 }, type: 'custom' },
  { id: 'validators', position: { x: 1100, y: 560 }, data: { label: 'validators.ts', heat: 'yellow', type: 'Utility', deps: 0, usedBy: 3 }, type: 'custom' },
  { id: 'settings', position: { x: 1100, y: 250 }, data: { label: 'Settings.tsx', heat: 'yellow', type: 'Page', deps: 2, usedBy: 1 }, type: 'custom' },
  { id: 'middleware', position: { x: 600, y: 780 }, data: { label: 'middleware.ts', heat: 'yellow', type: 'Server Middleware', deps: 1, usedBy: 1 }, type: 'custom' },
  { id: 'login', position: { x: 320, y: 50 }, data: { label: 'Login.tsx', heat: 'blue', type: 'Auth Page', deps: 2, usedBy: 1 }, type: 'custom' },

  // Low Impact (grey)
  { id: 'modal', position: { x: 1100, y: 100 }, data: { label: 'Modal.tsx', heat: 'grey', type: 'UI Component', deps: 0, usedBy: 2 }, type: 'custom' },
  { id: 'useTheme', position: { x: 1100, y: 420 }, data: { label: 'useTheme.ts', heat: 'grey', type: 'Theme Hook', deps: 1, usedBy: 1 }, type: 'custom' },
  { id: 'constants', position: { x: 1320, y: 420 }, data: { label: 'constants.ts', heat: 'grey', type: 'Constants', deps: 0, usedBy: 5 }, type: 'custom' },
  { id: 'analytics', position: { x: 1320, y: 560 }, data: { label: 'analytics.ts', heat: 'grey', type: 'Analytics', deps: 1, usedBy: 1 }, type: 'custom' },
  { id: 'notfound', position: { x: 1320, y: 250 }, data: { label: 'NotFound.tsx', heat: 'grey', type: 'Page', deps: 0, usedBy: 1 }, type: 'custom' },

  // Orphaned (hollow)
  { id: 'old-banner', position: { x: 1320, y: 100 }, data: { label: 'OldBanner.tsx', heat: 'hollow', type: 'Dead Code', deps: 0, usedBy: 0, orphaned: true }, type: 'custom' },
  { id: 'legacy-logger', position: { x: 1320, y: 700 }, data: { label: 'legacy-logger.ts', heat: 'hollow', type: 'Dead Code', deps: 0, usedBy: 0, orphaned: true }, type: 'custom' },
];

export const mockGraphEdges = [
  // Entry → Core
  { id: 'e-main-app', source: 'main', target: 'app', animated: true, style: { stroke: '#60A5FA' } },
  { id: 'e-main-login', source: 'main', target: 'login', animated: true, style: { stroke: '#60A5FA' } },

  // App → Components
  { id: 'e-app-dashboard', source: 'app', target: 'dashboard', style: { stroke: '#6366F1' } },
  { id: 'e-app-header', source: 'app', target: 'header', style: { stroke: '#6366F1' } },
  { id: 'e-app-sidebar', source: 'app', target: 'sidebar', style: { stroke: '#6366F1' } },
  { id: 'e-app-useAuth', source: 'app', target: 'useAuth', style: { stroke: '#6366F1' } },
  { id: 'e-app-home', source: 'app', target: 'home', style: { stroke: '#6366F1' } },
  { id: 'e-app-settings', source: 'app', target: 'settings', style: { stroke: '#6366F1' } },
  { id: 'e-app-notfound', source: 'app', target: 'notfound', style: { stroke: '#4B5563' } },

  // Dashboard dependencies
  { id: 'e-dash-useApi', source: 'dashboard', target: 'useApi', style: { stroke: '#F87171' } },
  { id: 'e-dash-useAuth', source: 'dashboard', target: 'useAuth', style: { stroke: '#F87171' } },
  { id: 'e-dash-helpers', source: 'dashboard', target: 'helpers', style: { stroke: '#FBBF24' } },
  { id: 'e-dash-modal', source: 'dashboard', target: 'modal', style: { stroke: '#4B5563' } },

  // Home dependencies
  { id: 'e-home-useApi', source: 'home', target: 'useApi', style: { stroke: '#F87171' } },
  { id: 'e-home-useAuth', source: 'home', target: 'useAuth', style: { stroke: '#F87171' } },

  // Auth chain
  { id: 'e-useAuth-auth', source: 'useAuth', target: 'auth-service', style: { stroke: '#60A5FA' } },
  { id: 'e-useAuth-api', source: 'useAuth', target: 'api', style: { stroke: '#F87171' } },
  { id: 'e-login-useAuth', source: 'login', target: 'useAuth', style: { stroke: '#60A5FA' } },
  { id: 'e-login-validators', source: 'login', target: 'validators', style: { stroke: '#FBBF24' } },

  // API chain
  { id: 'e-useApi-api', source: 'useApi', target: 'api', style: { stroke: '#F87171' } },
  { id: 'e-api-constants', source: 'api', target: 'constants', style: { stroke: '#4B5563' } },

  // Utility usage
  { id: 'e-helpers-constants', source: 'helpers', target: 'constants', style: { stroke: '#4B5563' } },
  { id: 'e-header-useAuth', source: 'header', target: 'useAuth', style: { stroke: '#FBBF24' } },
  { id: 'e-header-helpers', source: 'header', target: 'helpers', style: { stroke: '#FBBF24' } },
  { id: 'e-settings-useTheme', source: 'settings', target: 'useTheme', style: { stroke: '#4B5563' } },
  { id: 'e-settings-useAuth', source: 'settings', target: 'useAuth', style: { stroke: '#FBBF24' } },
  { id: 'e-useTheme-constants', source: 'useTheme', target: 'constants', style: { stroke: '#4B5563' } },
  { id: 'e-analytics-api', source: 'analytics', target: 'api', style: { stroke: '#4B5563' } },

  // Server
  { id: 'e-server-routes', source: 'server-index', target: 'routes', style: { stroke: '#60A5FA' } },
  { id: 'e-server-middleware', source: 'server-index', target: 'middleware', style: { stroke: '#60A5FA' } },
  { id: 'e-server-db', source: 'server-index', target: 'db', style: { stroke: '#60A5FA' } },
  { id: 'e-routes-db', source: 'routes', target: 'db', style: { stroke: '#F87171' } },
  { id: 'e-routes-validators', source: 'routes', target: 'validators', style: { stroke: '#FBBF24' } },
  { id: 'e-middleware-auth', source: 'middleware', target: 'auth-service', style: { stroke: '#60A5FA' } },
];

// AI Panel mock data per node
export const mockAIData = {
  'app': {
    summary: "The root application component that bootstraps the entire UI. It initializes routing, global providers (Auth, Theme), and renders the main layout skeleton. This is the highest-traffic module — every page transition flows through it.",
    risk: 92,
    dependsOn: ['Dashboard.tsx', 'Header.tsx', 'Sidebar.tsx', 'useAuth.ts', 'Home.tsx', 'Settings.tsx'],
    usedBy: ['main.tsx'],
    keyFunctions: ['AppRouter()', 'AuthProvider wrapper', 'ThemeProvider wrapper', 'ErrorBoundary'],
  },
  'dashboard': {
    summary: "The primary data visualization page. It fetches metrics from the API layer, renders charts and KPI cards, and manages complex state for filters and date ranges. High coupling with the API and auth layers.",
    risk: 85,
    dependsOn: ['useApi.ts', 'useAuth.ts', 'helpers.ts', 'Modal.tsx', 'api.ts'],
    usedBy: ['App.tsx'],
    keyFunctions: ['DashboardView()', 'useMetrics()', 'FilterPanel()', 'ChartGrid()', 'KPICards()'],
  },
  'useAuth': {
    summary: "Core authentication hook managing JWT tokens, user sessions, login/logout flows, and permission checks. Used by 6 modules — modifying this impacts the entire auth flow. Critical path for security.",
    risk: 95,
    dependsOn: ['auth.ts', 'api.ts'],
    usedBy: ['App.tsx', 'Dashboard.tsx', 'Header.tsx', 'Home.tsx', 'Settings.tsx', 'Login.tsx'],
    keyFunctions: ['useAuth()', 'login()', 'logout()', 'refreshToken()', 'checkPermissions()'],
  },
  'api': {
    summary: "Centralized HTTP client wrapping fetch/axios. Handles request interceptors, auth headers, error normalization, and retry logic. All data fetching flows through this module.",
    risk: 88,
    dependsOn: ['constants.ts'],
    usedBy: ['useApi.ts', 'useAuth.ts', 'analytics.ts', 'Dashboard.tsx', 'Home.tsx'],
    keyFunctions: ['apiClient()', 'get()', 'post()', 'handleError()', 'setAuthHeader()'],
  },
  'main': {
    summary: "Application entry point. Mounts the React tree into the DOM, initializes strict mode, and imports global styles. This is the first file executed when the app loads.",
    risk: 40,
    dependsOn: ['App.tsx', 'index.css'],
    usedBy: [],
    keyFunctions: ['ReactDOM.createRoot()', 'App mount'],
  },
  'header': {
    summary: "Top navigation bar component. Displays user avatar, notification bell, and navigation links. Consumes auth state for conditional rendering of login/logout buttons.",
    risk: 55,
    dependsOn: ['useAuth.ts', 'helpers.ts'],
    usedBy: ['App.tsx', 'Dashboard.tsx'],
    keyFunctions: ['Header()', 'NavLinks()', 'UserMenu()', 'NotificationBell()'],
  },
  'sidebar': {
    summary: "Collapsible side navigation panel. Renders navigation items with icons and active-state highlighting. Supports responsive collapse on mobile viewports.",
    risk: 45,
    dependsOn: ['constants.ts'],
    usedBy: ['App.tsx', 'Dashboard.tsx'],
    keyFunctions: ['Sidebar()', 'NavItem()', 'useCollapse()'],
  },
  'auth-service': {
    summary: "Low-level authentication service. Directly interfaces with the auth provider (OAuth/JWT). Manages token storage, refresh cycles, and session validation.",
    risk: 90,
    dependsOn: ['constants.ts'],
    usedBy: ['useAuth.ts', 'middleware.ts', 'Header.tsx', 'Login.tsx'],
    keyFunctions: ['authenticate()', 'refreshSession()', 'validateToken()', 'revokeToken()'],
  },
  'old-banner': {
    summary: "⚠️ DEAD CODE — This component is not imported anywhere in the codebase. It appears to be a legacy promotional banner that was replaced. Safe to delete.",
    risk: 0,
    dependsOn: [],
    usedBy: [],
    keyFunctions: ['OldBanner() — unused'],
  },
  'legacy-logger': {
    summary: "⚠️ DEAD CODE — A legacy logging utility that has been superseded by the analytics service. No active imports found. Candidate for removal.",
    risk: 0,
    dependsOn: [],
    usedBy: [],
    keyFunctions: ['log() — unused', 'warn() — unused'],
  },
  'home': {
    summary: "The landing/home page component that users see after login. Displays a personalized welcome message, recent activity feed, and quick-action cards.",
    risk: 70,
    dependsOn: ['useApi.ts', 'useAuth.ts', 'helpers.ts'],
    usedBy: ['App.tsx'],
    keyFunctions: ['HomePage()', 'ActivityFeed()', 'QuickActions()', 'WelcomeBanner()'],
  },
  'login': {
    summary: "Authentication page with email/password form, OAuth buttons, and form validation. Redirects to home on successful auth. Entry point for unauthenticated users.",
    risk: 65,
    dependsOn: ['useAuth.ts', 'validators.ts'],
    usedBy: ['App.tsx'],
    keyFunctions: ['LoginPage()', 'LoginForm()', 'OAuthButtons()', 'handleSubmit()'],
  },
  'db': {
    summary: "Database abstraction layer. Manages connection pooling, query building, migrations, and transaction management. Critical infrastructure — used by all server-side routes.",
    risk: 93,
    dependsOn: [],
    usedBy: ['routes.ts', 'server/index.ts', 'middleware.ts'],
    keyFunctions: ['createPool()', 'query()', 'transaction()', 'migrate()'],
  },
  'routes': {
    summary: "Express/Fastify route definitions. Maps API endpoints to handler functions. Applies validation middleware and auth checks per route.",
    risk: 82,
    dependsOn: ['db.ts', 'validators.ts'],
    usedBy: ['server/index.ts'],
    keyFunctions: ['registerRoutes()', 'userRoutes()', 'dataRoutes()', 'authRoutes()'],
  },
  'server-index': {
    summary: "Server bootstrap file. Initializes the HTTP server, applies middleware stack, registers routes, and starts listening on the configured port.",
    risk: 60,
    dependsOn: ['routes.ts', 'middleware.ts', 'db.ts'],
    usedBy: [],
    keyFunctions: ['startServer()', 'applyMiddleware()', 'gracefulShutdown()'],
  },
  'helpers': {
    summary: "General-purpose utility functions: date formatting, string manipulation, debounce, and deep merge. Widely used across components.",
    risk: 50,
    dependsOn: ['constants.ts'],
    usedBy: ['Dashboard.tsx', 'Header.tsx', 'Home.tsx', 'Settings.tsx'],
    keyFunctions: ['formatDate()', 'debounce()', 'deepMerge()', 'truncate()'],
  },
  'constants': {
    summary: "Application-wide constants: API URLs, theme tokens, feature flags, and configuration defaults. Pure data module with no side effects.",
    risk: 20,
    dependsOn: [],
    usedBy: ['api.ts', 'helpers.ts', 'useTheme.ts', 'auth.ts', 'analytics.ts'],
    keyFunctions: ['API_BASE_URL', 'THEME_DEFAULTS', 'FEATURE_FLAGS'],
  },
  'validators': {
    summary: "Form validation utilities using schema-based validation. Provides reusable validation rules for email, password strength, and data formats.",
    risk: 35,
    dependsOn: [],
    usedBy: ['Login.tsx', 'routes.ts', 'Settings.tsx'],
    keyFunctions: ['validateEmail()', 'validatePassword()', 'validateSchema()'],
  },
  'useApi': {
    summary: "Data-fetching hook wrapping the API client. Manages loading states, caching, and error handling for component-level data needs.",
    risk: 60,
    dependsOn: ['api.ts'],
    usedBy: ['Dashboard.tsx', 'Home.tsx', 'Settings.tsx'],
    keyFunctions: ['useApi()', 'useFetch()', 'useMutation()'],
  },
  'useTheme': {
    summary: "Theme management hook. Reads user preferences from localStorage, applies CSS variables, and provides toggle functions for dark/light mode.",
    risk: 20,
    dependsOn: ['constants.ts'],
    usedBy: ['Settings.tsx'],
    keyFunctions: ['useTheme()', 'toggleDarkMode()', 'setAccentColor()'],
  },
  'modal': {
    summary: "Reusable modal dialog component with overlay, focus trapping, and escape-key dismissal. Used for confirmations and form overlays.",
    risk: 25,
    dependsOn: [],
    usedBy: ['Dashboard.tsx', 'Settings.tsx'],
    keyFunctions: ['Modal()', 'useModalState()', 'FocusTrap()'],
  },
  'settings': {
    summary: "User settings page with preferences for notifications, theme, account management, and API key configuration. Moderate complexity.",
    risk: 45,
    dependsOn: ['useTheme.ts', 'useAuth.ts'],
    usedBy: ['App.tsx'],
    keyFunctions: ['SettingsPage()', 'PreferencesForm()', 'AccountSection()'],
  },
  'middleware': {
    summary: "Express middleware stack: CORS, rate limiting, request logging, and JWT verification. Applied to all incoming server requests.",
    risk: 65,
    dependsOn: ['auth.ts'],
    usedBy: ['server/index.ts'],
    keyFunctions: ['corsMiddleware()', 'rateLimiter()', 'jwtVerify()', 'requestLogger()'],
  },
  'analytics': {
    summary: "Client-side analytics integration. Sends page views, events, and user actions to the analytics service. Low coupling — only depends on the API client.",
    risk: 15,
    dependsOn: ['api.ts'],
    usedBy: ['App.tsx'],
    keyFunctions: ['trackEvent()', 'trackPageView()', 'identifyUser()'],
  },
  'notfound': {
    summary: "404 page component. Displays a friendly error message with navigation back to home. Simple, isolated component with no external dependencies.",
    risk: 5,
    dependsOn: [],
    usedBy: ['App.tsx'],
    keyFunctions: ['NotFoundPage()'],
  },
};

// Onboarding path — topologically sorted critical reading order
export const mockOnboardingPath = [
  { id: 1, file: 'package.json', desc: 'Understand dependencies & scripts', heat: 'grey', icon: '📦' },
  { id: 2, file: 'tsconfig.json', desc: 'TypeScript configuration', heat: 'grey', icon: '⚙️' },
  { id: 3, file: 'constants.ts', desc: 'Global config & feature flags', heat: 'grey', icon: '🔧' },
  { id: 4, file: 'main.tsx', desc: 'Application entry point', heat: 'blue', icon: '🚀' },
  { id: 5, file: 'App.tsx', desc: 'Root component & routing', heat: 'red', icon: '🏗️' },
  { id: 6, file: 'auth.ts', desc: 'Auth service internals', heat: 'blue', icon: '🔐' },
  { id: 7, file: 'useAuth.ts', desc: 'Auth hook (critical path)', heat: 'red', icon: '🔑' },
  { id: 8, file: 'api.ts', desc: 'HTTP client & interceptors', heat: 'red', icon: '🌐' },
  { id: 9, file: 'useApi.ts', desc: 'Data fetching patterns', heat: 'yellow', icon: '📡' },
  { id: 10, file: 'db.ts', desc: 'Database layer', heat: 'red', icon: '🗄️' },
  { id: 11, file: 'routes.ts', desc: 'API endpoint definitions', heat: 'red', icon: '🛤️' },
  { id: 12, file: 'Dashboard.tsx', desc: 'Main feature page', heat: 'red', icon: '📊' },
  { id: 13, file: 'helpers.ts', desc: 'Shared utilities', heat: 'yellow', icon: '🧰' },
  { id: 14, file: 'validators.ts', desc: 'Validation logic', heat: 'yellow', icon: '✅' },
];

// Loading screen status messages
export const loadingStages = [
  { text: 'Cloning repository...', duration: 800 },
  { text: 'Parsing file structure...', duration: 1000 },
  { text: 'Extracting import graphs...', duration: 1200 },
  { text: 'Computing dependency weights...', duration: 1000 },
  { text: 'Detecting orphaned modules...', duration: 800 },
  { text: 'Building topology map...', duration: 1200 },
  { text: 'Generating AI summaries...', duration: 1500 },
  { text: 'Rendering architecture view...', duration: 800 },
];
