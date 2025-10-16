# GitHub Package Stats Dashboard

## Objective

Build a web/mobile app (_based on your job role_) for GitHub Package Stats Dashboard to allow a user to check the details of popular packages on GitHub. You're encouraged to use tools like Cursor or GitHub Copilot. But your solution should show architectural decision-making and thoughtful UI/UX integration.

## Guidelines

- **Designs**: Follow [This Figma file](https://www.figma.com/design/b6t5PXTBL1ED8dm2jEN89u/PackageStats?m=auto&t=txd2iWQgE0edoAZe-1) shared with you. Design intent and usability are important aspects.

- **Open APIs**: Fetch the required data from the API - [jsDelivr API](https://www.jsdelivr.com/docs/data.jsdelivr.com#overview).

- **Specific to Web**

  - **Responsiveness**: Large screen support (> 1440px) is sufficient.
  - **UI Libraries**: You can use any component libraries you are familiar with. If you are familiar with Tailwind, Radix UI, or shadcn/ui, that would be plus.

- **Specific to Flutter**

  - Use appropriate state management (e.g., Bloc).
  - Ensure responsiveness (handle different screen sizes).
  - Follow Flutter best practices (widgets reuse, clean architecture).

- **Specific to iOS Native (Swift)**

  - Use SwiftUI or UIKit.
  - Use MVVM architecture.

- **Specific to Android Native (Kotlin)**
  - Use modern Android architecture (MVVM with ViewModel + LiveData/StateFlow).
  - Follow material design guidelines.

## Part 1: Packages List Page

- Fetch the list of top packages and show,
  - Name, Hits(in Billions), Bandwidth(in GBs), Percentage change in Hits compared to previous stats, Percentage change in Bandwidth compared to previous stats.
  - A loading spinner and an error message as needed

### 🧠 Think Piece 1

- How would you structure your package list for performance when working with hundreds of items?

## Part 2: Filters

- Add two filters to filter packages by two parameters.
  - Hits & Bandwidth
  - Time Period
- On change, re-fetch packages with selected filters.
- Filters should be persisted when a user reloads the page.

### 🧠 Think Piece 2

- What are the different ways to implement the "Persistent Filters" feature?
- Why did you choose the one you used?

---

### 🧠 Optimize

- Optimize the code to eliminate unnecessary renders for complex components.
- Create custom hooks wherever required.
- The app should not make API request on each filter selection. It should wait for 500 milliseconds to allow a user to select all necessary filters.

## 📂 Submission

- Push to the assigned repository.
- Create `Architecture.md` file at root level with:
  - **Setup instructions**
  - **Architecture explanation** (1-2 paragraphs)
  - **Answers to Think Pieces** above
  - Mention any use of AI tooling (e.g., Cursor, GitHub Copilot)

## 📝 Evaluation Criteria

Your submission will be evaluated based on the following criteria:

- Think of this as an app you create during day-to-day operations. You should invest more time to make it rightly engineered than submitting it early.
- The use of Typescript is very important for web version. There will be negative points of using `any` as type in the code.
- All the parts should be completed.
- Accuracy of data being displayed, Code quality, Effective handling of API requests and adherence to best practices are important criteria.
