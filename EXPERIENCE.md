# Experience Report - Aspiration V2 Capstone Project

**Project:** Aspiration V2 - AI-Powered Learning Platform  
**Date:** May 2026  
**Context:** Capstone Project for "Agentic" Hackathon  
**AI Tools Used:** Windsurf, Antigravity

---

## Executive Summary

This report documents the development journey of Aspiration V2, a video-based learning platform built using agentic AI workflows. The project demonstrates the effective use of AI-assisted development through a multi-step iterative approach rather than attempting one-shot generation.

---

## What Worked

### 1. Multi-Step Iterative Development Approach

**Success Factor:** Breaking down the project into 11 focused sprints proved highly effective.

Instead of attempting to generate the entire codebase in a single prompt, the development followed a structured sprint-based approach:

- **Sprint 1:** Firebase & Authentication
- **Sprint 2:** Categories & Skills Seeding
- **Sprint 3:** Design System Corrections
- **Sprint 4:** YouTube Integration
- **Sprint 5:** Notes & Progress
- **Sprint 6:** Firestore Rules
- **Sprint 7:** Admin Experience Audit
- **Sprint 8:** Curated Video Manager
- **Sprint 9:** Edit & Reorder Controls
- **Sprint 10:** Secure Role Mutation
- **Sprint 11:** Admin Feedback Standardization

**Why it worked:**
- Each sprint had a clear, focused objective
- AI could maintain context within a bounded scope
- Iterative testing and validation after each sprint
- Easier to debug and fix issues in smaller chunks
- Natural progression from core features to advanced capabilities

### 2. Comprehensive Context Documentation

**Success Factor:** Maintaining a well-structured `context/` folder as a git submodule.

The context folder provided:
- Clear product vision and requirements
- Domain models and business rules
- Sprint tracking and user stories
- Architecture documentation with ADRs
- Module specifications
- API contracts
- Design system guidelines
- Development guides
- Testing strategy

**Why it worked:**
- AI tools could reference authoritative documentation
- Reduced ambiguity in AI-generated code
- Easy to onboard and understand project structure
- Served as single source of truth for both human and AI

### 3. AI Tool Collaboration: Windsurf & Antigravity

**Windsurf Usage:**
- Primary IDE for development
- Effective for code generation and refactoring
- Strong context awareness with file references
- Good at understanding project structure
- Helpful for debugging and error resolution

**Antigravity Usage:**
- Used for specific architectural decisions
- Helpful for complex problem-solving
- Complemented Windsurf's capabilities
- Provided alternative perspectives on implementation

**Why it worked:**
- Using multiple tools provided diverse approaches
- Each tool had strengths in different areas
- Cross-tool validation improved code quality
- Reduced dependency on a single AI's limitations

### 4. Test-Driven Development (TDD)

**Success Factor:** Writing tests alongside implementation.

- Unit tests with Vitest for business logic
- E2E tests with Playwright for user flows
- Coverage reports to ensure quality
- Tests served as living documentation

**Why it worked:**
- Caught regressions early
- Provided confidence in refactoring
- Documented expected behavior
- AI could generate test code alongside implementation

### 5. Git Submodules for Multi-Repo Structure

**Success Factor:** Using git submodules to separate context documentation from code.

**Why it worked:**
- Clean separation of concerns
- Documentation could evolve independently
- Easier to maintain version control
- Reduced repository bloat

---

## Challenges Faced

### 1. Context Management Across Sprints

**Challenge:** Maintaining consistent context across 11 sprints as the codebase grew.

**Impact:** 
- Occasionally needed to remind AI of previous decisions
- Some redundant code generation in early sprints
- Required careful prompt engineering to maintain continuity

**Mitigation:**
- Comprehensive context documentation
- Regular reference to ADRs (Architecture Decision Records)
- Sprint tracking documents to maintain history
- Explicitly referencing previous implementations

### 2. Firebase Configuration Complexity

**Challenge:** Setting up Firebase with both client and server-side SDKs, especially service account key minification.

**Impact:**
- Initial authentication failures
- Firestore rule deployment issues
- Environment variable formatting problems

**Mitigation:**
- Created detailed FIREBASE_SETUP.md guide
- Documented minification process clearly
- Added troubleshooting section
- AI helped debug specific error messages

### 3. AI Hallucination in Complex Flows

**Challenge:** AI occasionally generated code that looked correct but had logical flaws in complex user flows.

**Impact:**
- Required manual debugging
- Some back-and-forth with AI to correct issues
- Time spent on trial-and-error

**Mitigation:**
- Incremental testing after each change
- E2E tests to validate complete flows
- Code reviews after AI-generated changes
- Breaking down complex features into smaller steps

### 4. Test Mocking Complexity

**Challenge:** Writing effective mocks for Firebase and external APIs in tests.

**Impact:**
- Initial test failures
- Time spent understanding Firebase mock patterns
- Some tests were brittle

**Mitigation:**
- AI helped generate mock implementations
- Reference to testing documentation in context/
- Gradual improvement of test coverage
- Used factory patterns for consistent mocking

### 5. State Management Complexity

**Challenge:** Coordinating state between Zustand (client) and TanStack Query (server) with Firebase.

**Impact:**
- Initial confusion about when to use which
- Some redundant state management
- Sync issues between client and server state

**Mitigation:**
- Clear separation of concerns in documentation
- ADRs documenting state management decisions
- AI helped refactor to proper patterns
- Established clear rules for each state manager

---

## What Didn't Work

### 1. One-Shot Code Generation

**Attempt:** Early on, tried to generate entire features in single prompts.

**Result:** 
- Code was often incomplete
- Missing error handling
- Inconsistent patterns
- Hard to debug

**Lesson:** Break down into smaller, focused tasks. Iterate incrementally.
---

## Key Learnings

### For AI-Assisted Development

1. **Iterative > One-Shot:** Break down complex features into smaller, manageable tasks
2. **Context is King:** Maintain comprehensive, up-to-date documentation
3. **Test Early, Test Often:** Write tests alongside implementation, not after
4. **Human in the Loop:** Review AI-generated code before committing
5. **Multiple Tools:** Use different AI tools to get diverse perspectives

### For Project Structure

1. **Git Submodules Work:** Effective for separating concerns (code vs documentation)
2. **Sprint-Based Development:** Natural fit for AI-assisted development
3. **ADR Pattern:** Architecture Decision Records help maintain consistency
4. **Clear Separation:** Separate domain logic from implementation details

### For Team Collaboration

1. **Documentation as Communication:** Well-documented context reduces miscommunication
2. **Sprint Tracking:** Visible progress tracking helps maintain momentum
3. **Testing as Documentation:** Tests serve as executable documentation

---

## Recommendations

### For Future AI-Assisted Projects

1. **Start with Context:** Invest time in comprehensive context documentation before coding
2. **Use Sprint Structure:** Break project into focused, testable sprints
3. **Establish Patterns:** Define coding patterns early and reference them consistently
4. **Automate Testing:** Set up test automation early to catch regressions
5. **Document Decisions:** Use ADRs to track architectural decisions

### For AI Tool Selection

1. **Use Multiple Tools:** Don't rely on a single AI tool
2. **Leverage Strengths:** Use each tool for what it's best at
3. **Cross-Validate:** Validate AI suggestions across multiple tools
4. **Stay Updated:** AI tools evolve rapidly; keep learning new features

### For Capstone Projects

1. **Scope Realistically:** MVP-focused approach is better than over-engineering
2. **Demonstrate Process:** Show how you used AI tools, not just final code
3. **Be Honest:** Document what didn't work, not just successes
4. **Focus on Learning:** The journey is as important as the destination

---

## Conclusion

The Aspiration V2 project demonstrates that effective AI-assisted development is not about replacing developers, but about augmenting their capabilities through structured, iterative collaboration. The multi-step sprint approach, comprehensive context documentation, and strategic use of multiple AI tools proved to be key success factors.

While challenges existed around context management, configuration complexity, and AI hallucination, these were mitigated through incremental testing, clear documentation, and human oversight. The project successfully delivered a complete MVP with 11 sprints, comprehensive testing, and robust documentation.

The experience reinforces that AI tools are most effective when used as collaborators in a well-structured development process, not as magic bullets that generate perfect code in one shot.

---

## Appendix: Sprint Outcomes

| Sprint | Focus | Status | Key Learnings |
|--------|-------|--------|---------------|
| 1 | Firebase & Auth | ✅ | Authentication setup requires careful configuration |
| 2 | Categories & Skills | ✅ | Seeding data needs proper error handling |
| 3 | Design System | ✅ | Consistent UI patterns improve maintainability |
| 4 | YouTube Integration | ✅ | API caching is essential for rate limits |
| 5 | Notes & Progress | ✅ | User data needs proper ownership rules |
| 6 | Firestore Rules | ✅ | Security rules require thorough testing |
| 7 | Admin Audit | ✅ | UX audit reveals important gaps |
| 8 | Curated Videos | ✅ | Admin tools need intuitive interfaces |
| 9 | Edit & Reorder | ✅ | Drag-and-drop requires careful state management |
| 10 | Secure Role Mutation | ✅ | Security-by-design prevents vulnerabilities |
| 11 | Feedback Standardization | ✅ | Consistent UX patterns improve usability |
