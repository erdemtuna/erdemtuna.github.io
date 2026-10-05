---
title: "The gap between shipping code and understanding it"
description: "When a developer relies on an agent for most of the investigation and implementation, the agent explores the repository, changes the code, runs the tests, and explains what it did."
pubDatetime: 2026-09-18T19:31:50.000+00:00
modDatetime: 2026-09-18T19:32:21.000+00:00
tags: []
sourceUrl: https://www.linkedin.com/pulse/gap-between-shipping-code-understanding-erdem-tuna-yvole
sourceLabel: LinkedIn
ogImage: ./_images/the-gap-between-shipping-code-and-understanding-it/cover.png
cover: ./_images/the-gap-between-shipping-code-and-understanding-it/cover.png
coverAlt: "The gap between shipping code and understanding it"
---

When a developer relies on an agent for most of the investigation and implementation, the agent explores the repository, changes the code, runs the tests, and explains what it did. The developer describes the outcome, checks progress, steers the work, and reviews the result.

The developer remains involved, but much of that involvement happens through conversations with the agent, summaries, and completed changes. The work of discovering constraints and deciding how the pieces fit together increasingly happens on the agent’s side.

This can help developers finish changes faster without giving them an equally clear understanding of what is being built. Two connected problems can follow: the implementation becomes harder to keep up with, and steering the next change requires context the developer may not have gained from the last one.

## Keeping up with the implementation

The first difficulty is staying aware of the implementation as it takes shape: what the agent is changing, why it has chosen that approach, and how each step contributes to the solution. This is not just about reviewing a finished pull request. A diff, a progress summary, and a few questions can report activity without making the reasoning behind it clear.

In theory, the developer could read every change. In practice, the volume makes that difficult, especially when the agent produces changes faster than the developer can examine them.

Even top-tier models can produce suboptimal code, with familiar code smells: duplicated logic, unnecessary abstractions, or new helpers where existing code could have been reused. Unrelated edits and excessive test code can make an otherwise straightforward change even harder to follow.

Following the work then requires separating the steps that serve the requested change from work that is unnecessary or unrelated. That makes it harder to see how the implementation is progressing toward the solution.

As the change grows, the developer can fall back on checking whether the requested behavior works and whether the tests pass. That may catch an obvious failure, but it reveals less about the steps taken to reach the result or the design decisions made along the way. That is before considering the separate question of how well the agent-written tests exercise the intended behavior.

The same difficulty carries into pull-request review, where another developer may face the entire change at once. A working result can be approved without either person gaining much understanding of how it was built. That missing context is also the context needed to direct what happens next.

## Steering with incomplete context

This leads to the second difficulty. An agent can keep the developer involved by pausing, presenting alternatives, and asking which direction to take. But that decision depends on more than the quality of the options as they are explained.

That choice requires an understanding of the existing implementation, the constraints behind it, and what each option would make easier or harder later. Without that context, the developer is mostly judging the explanations the agent provides.

A developer may select a reasonable option without developing a durable understanding of why it was reasonable. When a later question depends on that decision, neither the choice nor the constraint that motivated it may be easy to recall.

The developer is still responsible for steering the implementation. But when the agent does the investigation and coding, reviewing summaries and selecting options can leave out much of the work through which the developer would normally learn the system.

The concern therefore goes beyond verbose or suboptimal code. Even excellent generated code can leave this gap if the developer encounters it mainly as an outcome to accept.

## How the gap becomes comprehension debt

Moving from one agent-implemented change to the next without building the necessary context can leave a developer with **comprehension debt**: a growing gap between the code they help build and the code they can confidently explain, change, and maintain. [Addy Osmani](https://www.linkedin.com/in/addyosmani) [has written about this gap](https://addyosmani.com/blog/comprehension-debt/), and Ahmad \[1\] has studied it in student software projects. The research is still early: the paper calls for ways to measure and validate the concept.

The term makes a cost visible even when the software works. That cost may appear when a developer needs to investigate an unfamiliar failure, challenge a proposed abstraction, or decide which part of the system should change. The missing understanding is then something needed to do the work, not background context that can wait.

This is not about remembering every line or every local implementation choice. It is also about understanding the architecture: where responsibilities sit, how components depend on each other, and why important boundaries exist. A developer might understand a change in isolation without understanding its consequences for the rest of the system.

## Keeping knowledge current, or building it from scratch

For someone who already knows the repository, the challenge is keeping that understanding current. For a newcomer, the challenge is building it in the first place.

A developer who learned the system before relying on agents has a starting point. They know which conventions matter, when an answer sounds suspicious, and what a local change might affect elsewhere. But that knowledge describes a system that is still changing. If the agent handles those changes without the developer following the design, their mental model can become outdated.

A newcomer who joins when agents already do most of the implementation faces a different problem. They have no earlier mental model to draw on. The same way of working that lets the existing developer skip updating their understanding can let the newcomer skip building it.

<figure>

![Conceptual graph of understanding of the current system over time. A developer with prior codebase knowledge starts high, but that understanding becomes less current after agents take on most implementation. A newcomer joins after the shift, starts with little codebase knowledge, and makes limited progress in this scenario.](./_images/the-gap-between-shipping-code-and-understanding-it/inline-1.png)

<figcaption>Existing knowledge needs to stay current as the system changes; a newcomer needs to build that knowledge from scratch</figcaption>
</figure>

### Contribution is only one milestone

Both developers may still be able to complete useful changes with an agent. For the newcomer, the reduction in time to a first contribution can be especially valuable. But that early contribution does not establish that they can judge a later architectural decision independently.

Familiarity can still develop through hands-on investigation, discussion, and experimentation. But the number of pull requests a developer has merged does not establish how well they understand the system.

<figure>

![Graph comparing readiness over time. Contribution with agentic coding reaches the ready line quickly; contribution without agentic coding reaches it later. Each crossing marks a first contribution. Independent architectural judgment while relying on agentic coding develops slowly and plateaus below ready.](./_images/the-gap-between-shipping-code-and-understanding-it/inline-2.png)

<figcaption>Agentic coding can bring the first contribution forward without bringing independent architectural judgment forward at the same pace.</figcaption>
</figure>

## This can become a team problem

The two starting points can coexist within the same team. As more contributions are implemented through agents, existing developers may be struggling to keep their knowledge current while newcomers have yet to build theirs. The team can continue shipping changes even as fewer people are able to explain the current design.

Whether that happens depends on the practices the team uses. Following the implementation, investigating unfamiliar behavior, and discussing design decisions can help. But knowing that understanding matters does not ensure those activities get time when deadlines are tight.

With deadlines to meet and more features to build, there is always another change waiting. Once the current one works, going back to understand its design can feel like work that can wait. If learning the system becomes a separate activity rather than part of contributing to it, it has to compete with that pressure.

That leaves a risk at the architectural level, not just in the details of individual functions. A team may keep adding features while becoming less able to explain how the system fits together or judge what a proposed direction would mean for it.

## Keeping learning inside the work

The two problems suggest two places to preserve active participation: following the solution as it is implemented and preparing to steer the next decision. The aim is not to make developers do every task manually, but to help them understand the steps being taken and the reasoning connecting those steps.

Longer explanations can support that participation, but they are not a replacement for it. Recognizing an idea in a summary is different from using it to predict behavior, investigate a failure, or make a change.

### During implementation: follow how the solution takes shape

Small, coherent steps give the developer a chance to see which part of the system is changing and how it advances the solution. At meaningful points, the agent can connect the current edit to the relevant code path or design constraint, rather than waiting to present a completed block of work.

The developer can then do something with that context: predict a behavior, examine a dependency, or try a representative case against the evolving implementation. This makes following the work an active process rather than watching a stream of status updates. Pull-request review can reinforce that understanding, but it should not be the developer’s first meaningful contact with the implementation.

### Before a decision: build the context needed to compare options

Before asking the developer to choose an architecture or direction, the agent can help trace the relevant behavior across components and identify the constraints behind the current design. The options then have something concrete to be evaluated against.

The important distinction is between choosing the most persuasive explanation and understanding why an option fits this system. Following the affected boundaries and testing an assumption can help make that distinction visible.

### Make room for understanding in everyday development

Neither practice will help consistently if understanding is always postponed until there is less work to do. The implementation process needs room for the developer to investigate and follow the reasoning, not only approve the result.

That does not mean attaching a lesson to every trivial task. In areas a developer already understands, delegation is the point. More active participation matters when the agent is changing an unfamiliar part of the system, introducing a new boundary, or making a decision the developer will later need to defend or revise.

Developers should not have to become strangers to their repositories to gain the speed of agentic coding. When the agent next asks them to choose a direction, they still need to judge the options against the codebase, not just against the explanation in front of them.

## References

1. M. O. Ahmad, “Comprehension debt in GenAI-assisted software engineering projects,” arXiv:2604.13277, 2026, doi: [10.48550/arXiv.2604.13277](https://doi.org/10.48550/arXiv.2604.13277).
