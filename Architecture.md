# Architecture

## Setup Instructions

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`

## Architecture Explanation

This project is a single-page application built with React and Vite. It uses TanStack Router for routing and TanStack Query for data fetching and caching. The UI is built with Tailwind CSS and shadcn/ui.

The application is structured around routes, with each route having its own component. The main logic for fetching and displaying the package data is located in the `packages.tsx` route. State management for filters is handled with a custom `useLocalStorage` hook to persist the user's selections. API requests are debounced to prevent excessive calls while the user is selecting filters.

## Think Piece 1: Performance with Hundreds of Items

To handle a large list of items efficiently, I would implement virtualization (or "windowing"). This technique renders only the items that are currently visible in the viewport, plus a small buffer. As the user scrolls, items that move out of the viewport are unmounted, and new items are mounted. This significantly reduces the number of DOM nodes, improving rendering performance and memory usage. Libraries like `TanStack Virtual` or `react-window` are excellent for this.

## Think Piece 2: Persistent Filters

There are several ways to implement persistent filters:

1.  **Local Storage**: Store the filter values in the browser's `localStorage`. This is simple to implement and works well for client-side state that doesn't need to be shared across devices.
2.  **URL Query Parameters**: Store the filter values in the URL. This has the advantage of making the filter state shareable. Users can bookmark the URL or share it with others, and the same filters will be applied.
3.  **Server-Side Storage**: Store the filter preferences in a database on the server, associated with the user's account. This is the most robust solution, as it persists the filters across devices and sessions, but it requires a backend and user authentication.

I chose to use **Local Storage** for this project because it's the simplest and most effective solution for the given requirements. The filters are a client-side preference and don't need to be shareable or synced across devices, so the overhead of URL parameters or a server-side solution is unnecessary.

## AI Tooling

This project was developed with the assistance of an AI programming assistant. The assistant helped with boilerplate code generation, debugging, and providing suggestions for implementation details.
