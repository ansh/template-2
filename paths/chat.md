# SproutFuture App

You are an expert in TypeScript, Next.js App Router, React, and Tailwind. Follow @Next.js docs for Data Fetching, Rendering, and Routing. Use Vercel AI SDK for handling AI interactions and streaming responses. Use Stripe for payment processing and Plaid for connecting to 529/UTMA/UGMA accounts.

Your job is to create the SproutFuture application with the following specific features and key points to implement:

1. Support for different account types:

   - Integrate support for UTMA, UGMA, and 529 accounts.
   - Implement account-specific configurations and API calls for each type.

2. Account type selection:

   - Create a user-friendly form for parents to select the type of account they're setting up (UTMA, UGMA, or 529).
   - Ensure the selected account type is stored in the database and associated with the user's profile.


3. Dashboard interface:

   - Develop a responsive dashboard UI with a summary of account information, contribution history, and generated links.
   - Implement a fixed-position navigation menu for easy access to different sections of the app.
   - Display the user's account details, including balance and growth projections.


4. Link generation and QR codes:

   - Utilize a library like qrcode.react to generate QR codes for donation links.
   - Implement real-time link generation with unique identifiers for each fundraising campaign or event.


5. Comprehensive error handling and loading states:

   - Create informative error messages for various scenarios (e.g., API errors, network issues).
   - Implement loading spinners or skeleton loaders for all asynchronous operations.
   - Add retry mechanisms for failed API calls.


6. API route implementation:

   - Create API routes to support account creation, link generation, and donation processing.
   - Implement logic to route requests to the appropriate services (Stripe, database, etc.).
   - Ensure proper error handling and response formatting for all API endpoints.


7. Contribution history management:

   - Implement a robust system to maintain and display the contribution history correctly.
   - Store contribution history in a database for persistence and reporting.
   - Provide options to filter and sort contribution history.


8. Stripe integration for payments and subscriptions:

   - Utilize Stripe's API for processing one-time donations and setting up recurring contributions.
   - Implement server-side confirmation and webhooks for secure payment processing.

9.  Integration with Stripe API:

   - Implement Stripe API to handle all payment-related operations.
   - Use Stripe's built-in functions for creating payment intents, managing customer data, and processing transactions.


10. Enhanced user experience:

   - Add a "Share" button to easily distribute donation links via email or social media.
   - Implement a calculator to show potential future value of contributions.
   - Add a feature for donors to leave personalized messages with their contributions.

11. User authentication using Firebase Auth

   - Ability to login using firebase authorization


Use the existing Next.js and TypeScript configuration from the codebase. Implement the SproutFuture functionality in new page components for the dashboard, account setup, and donation interfaces. Create all necessary components for the user interface and payment interactions, including but not limited to:

- DashboardInterface component for the main user dashboard
- AccountSummary component to display account information
- LinkGenerator component for creating and managing donation links
- ContributionHistory component to show past donations
- AccountSetupForm component for initial account creation
- DonationForm component for processing contributions
- ErrorDisplay component for showing error messages
- LoadingIndicator component for asynchronous operations

Create new API routes to support account management, link generation, and donation processing, ensuring proper error handling and response formatting for each operation.

Remember to use TypeScript for type safety, including proper type definitions for all components, functions, and API responses. Utilize Tailwind CSS for responsive and consistent styling across the application. Leverage Next.js App Router for efficient routing and data fetching, implementing server-side rendering or static generation where appropriate to optimize performance.

Ensure all financial calculations and transactions are handled securely and accurately, with appropriate measures in place to prevent fraud and maintain compliance with financial regulations.