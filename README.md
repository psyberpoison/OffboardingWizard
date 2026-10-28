# OffboardingWizard
Case Study 2
**Live prototype:** https://psyberpoison.github.io/OffboardingWizard/

This is my redesign of the user offboarding process for the Office admin portal.
None of the test users are real.
The licenses are hard-coded in, not variable. So are their descriptions.
Loading times are simulated.
One of the users (Marcus Lee) starts disabled for the picker testing.
The license removal is designed to fail on the first attempt to show what it looks like.
```mermaid
flowchart TD
    A[Example User page] -->|Launch button| B[Email tab]
    B -->|Next| C{Pickers valid?}
    C -->|No| C2[Error, focus moves to field] --> B
    C -->|Yes| D[OneDrive tab]
    D -->|Next| E{Pickers valid?}
    E -->|No| E2[Error, focus moves to field] --> D
    E -->|Yes| F[Confirmation tab]
    F -->|Confirm| G{Verify box checked?}
    G -->|No| G2[Error on verify box] --> F
    G -->|Yes| H[Start offboarding? popup, Cancel focused]
    H -->|Cancel| F
    H -->|Confirm| I[Progress tab, wizard locked]
    I --> J{Any task failed?}
    J -->|Yes| K[Error message + Retry] -->|Retry| I
    J -->|No| L[All done, launch button disabled]
    B & D & F -.->|X or Escape| M{Any changes?}
    M -->|No| A
    M -->|Yes| N[Discard changes? popup, No focused]
    N -->|No| B
    N -->|Yes, discard| A
```  
