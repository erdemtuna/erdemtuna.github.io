---
title: "How My AI-Assisted Development Practice Evolved"
description: "I recently jotted down a short history of how I have been developing software with AI."
pubDatetime: 2026-09-04T16:30:25.000+00:00
modDatetime: 2026-09-06T14:47:16.000+00:00
tags: []
sourceUrl: https://www.linkedin.com/pulse/how-my-ai-assisted-development-practice-evolved-erdem-tuna-6xyde
sourceLabel: LinkedIn
ogImage: ./_images/how-my-ai-assisted-development-practice-evolved/cover.png
cover: ./_images/how-my-ai-assisted-development-practice-evolved/cover.png
coverAlt: "How My AI-Assisted Development Practice Evolved"
---

_From code completion and chat to phased workflows, visual modeling, and a more deliberate human loop_

I recently jotted down a short history of how I have been developing software with AI. It started with code completion and ad hoc conversations, moved through a structured phased workflow, and eventually led me to maintain my own prompts and build supporting tools around the way I work.

The interesting part for me is not that one approach replaced another. Each stage changed what I expected from the next one. Some practices stayed, some became lighter, and some stopped working for me even though they looked more rigorous on paper.

I can think of three influences behind this change:

- My own expectations changed as I saw where a process helped and where it reduced my involvement or understanding.
- The models changed.
- The tools and harnesses changed, including Copilot CLI itself as it developed over successive releases.

These happened together, so I cannot say exactly how much each one contributed. What I can describe is how my own way of working changed alongside them.

## I started without an established way of working

My early use of AI did not begin with an agent that could inspect a repository and carry a task through by itself. I used GitHub Copilot in VS Code mainly for code completion, while ChatGPT provided a separate conversation for coding questions. I described what I wanted, inspected the response, added whatever appeared to be missing, and tried again.

I later started attaching code files to ChatGPT so the conversation could include more of the implementation. After that, Cursor brought chat and code completion into the editor. Its chat window and tab completion made the interaction more connected to the code than switching between an editor and a separate browser conversation.

Voice was already part of this early practice. Before Handy, I used dictation in ChatGPT and VS Code. Speaking was faster and freer than typing, and it helped me express detailed context, instructions, and reflections more fully.

There was still no established personal workflow behind this. Through these mostly personal and side projects, I gradually formed an informal discuss, plan, implement, and refine loop. Sometimes that meant asking for a plan first or using a plan mode. Sometimes it meant giving a long set of instructions before asking for code. At other times I let the agent start and corrected its direction afterward.

The capabilities of the models and the development harnesses were also more limited than they are now. More of the process had to be stated explicitly. But I did not yet know which instructions were genuinely useful and which ones were only compensating for a particular model, tool, or failed attempt.

Ad hoc prompting was therefore less a prompt-management problem than an absence of an established practice. I was learning how to work with AI while the interaction itself was moving from completion to conversation to editor-integrated assistance.

## PAW gave the work an explicit structure

The next major change was using my colleague Rob's [Phased Agent Workflow](https://github.com/lossyrob/phased-agent-workflow), or PAW.

PAW is an agentic development workflow that divides work into phases such as specification, research, implementation planning, implementation, and review. Each phase saves its output as Markdown so later agent work can continue from the context produced earlier.

Those files could be read and reviewed by a person, but their main purpose in my use was to carry context for the agent. A later phase did not have to reconstruct everything from the original conversation. It could work from the specification, research, plan, and decisions already recorded in the repository.

For larger features, that was really useful. I later created a Discovery workflow as an extension to PAW so I could produce roadmaps for relatively large bodies of work. Instead of improvising the next instruction each time, I had a process that could preserve context and move the work forward in recognizable stages.

Several parts of this way of working later entered my own prompts:

- Investigate before implementation when the problem or codebase is not yet understood.
- Make planning explicit instead of letting implementation begin from an unclear goal.
- Review important boundaries before the next piece of work depends on them.
- Preserve important decisions outside the immediate conversation.

## Eventually I stopped reading much of what the process produced

The difficulty appeared gradually.

The workflow produced specifications, research documents, plans, progress artifacts, and reviews. As I became more accustomed to the process, I did not always read those files closely. Sometimes I scanned them. Sometimes I trusted that the process and its reviews had covered what mattered and waited for the implementation.

There is a broader behavior behind this. I am much less willing to read a long document generated by AI than a long document written by a person. If a colleague has written several pages, I assume they made deliberate choices about what to include and how to express it. AI can produce the same amount of text almost immediately, so length does not carry the same signal.

I see the same issue in pull requests and code reviews. A long AI-generated pull request description can obscure the actual change. A long AI-generated review can bury useful findings inside repetitive or mechanically structured commentary. In both cases, I am likely to skim instead of reading the description or review closely enough to understand the change.

This affected more than the documents. I still tested the completed behavior manually, so I was not relying only on the agent saying that the implementation was finished. But proving that a feature worked was not the same as understanding how it had been built. When I did not follow the implementation carefully, I started losing familiarity with the codebase. The agent could continue from the accumulated context, but I could not always explain the result without returning to the generated material or asking the agent again.

The agent knew more about the recent work than I did. That was not how I wanted to develop software.

## How the prompts changed

### Several prompts for different jobs

The structured PAW process had already helped me identify several kinds of instructions that were repeatedly useful. Instead of always using the complete workflow, I began maintaining separate prompts for different purposes:

- Investigating a feature direction, technical problem, design question, or unfamiliar area of a codebase.
- Creating an implementation plan after the goal and context were understood.
- Reviewing pull requests.
- Preparing for a main merge to sync branches.

This gave me a different way to reuse parts of the practice. I could investigate a technical problem without first creating a complete feature specification. I could ask for an implementation plan after a discussion that had already established the goal. I could run a focused review without making it one formal phase in a larger workflow.

### Less default orchestration

The early versions of these prompts still carried a lot of orchestration and ceremony. One implementation planning prompt said:

> Design the plan for fleet execution by {{model}} implementation agents. Break the work into waves, and for each wave include: ...

Fleet execution meant delegating separate parts of the plan to multiple subagents. For every wave, the plan had to define its goal, agent scope, frontend or backend ownership, dependencies, expected output, tests, risks, and a review gate. The prompt did more than ask for a plan. It prescribed much of the route the agent should take.

As I revised the prompts, their content changed in several ways:

- Earlier investigation and review prompts routinely delegated different parts or perspectives to multiple subagents. Later versions reserved that delegation for genuinely independent work.
- Earlier planning prompts required the full wave, ownership, risk, validation, and review structure. Later versions applied that structure only when the size, dependencies, or risk of the task justified it.
- Earlier review prompts routinely required several reviewing agents, different perspectives, and a holistic pass. Later versions made review breadth depend on the selected focus and allowed a concise general review when additional perspectives were unnecessary.

### More visual technical analysis

Other parts of the prompts became more detailed. One of them was Deep Analysis, a prompt I used to investigate a technical question or design before deciding what to implement. Its earliest version did not ask the agent to generate diagrams. Later versions broadly suggested sequence, state, and activity diagrams when they communicated a design better than prose.

The current version lets me select among diagrams for system architecture, interface states, state transitions, runtime interactions, workflows, and data flow. I do not request all of them for every task. I choose the type that helps answer the technical question I am working through.

This is not simply a new technique for working with AI. It continues practices we used as developers before AI, such as architecture sketches, sequence diagrams, state models, workflows, and data-flow views that helped us understand a system before or alongside implementation. AI can produce code quickly, but I still need a mental model of what is being built. Diagrams help me form and retain that model.

The way I presented these analyses changed as well. My prompts first demanded Markdown reports. I later moved to HTML because it could present visual technical material more clearly. The instructions gradually required reports to begin with a concise conclusion or synthesis and selected diagrams to be rendered, captioned, and checked.

These changes made long analyses easier to navigate and diagrams easier to interpret. I now choose between conversation and an HTML report according to the work. The choice to generate a diagram depends on the technical question, not on whether the response appears in conversation or in a report.

## Prompt Bank became the tool around the prompts

Once I was maintaining these prompts, I built [Prompt Bank](https://github.com/erdemtuna/prompt-bank) as a personal tool for storing and using them. Feedback from my colleagues later helped move it toward a standalone public application.

Prompt Bank keeps the prompts as local Markdown files. It presents the parts that can vary as controls, composes the selected text, and copies it into whichever AI tool I am using. It supports the prompt practice, but it does not run the workflow or call the model itself.

## Voice for input, visual tools for review

The workflow is not just about the model, prompt, and harness. The effort required to provide input and review output also affects how I work.

I moved to [Handy](https://github.com/cjpais/Handy) for voice transcription. The tool changed, but the practice did not. Speaking detailed instructions, explanations, and feedback is still easier for me than typing everything, and it lets me give an AI tool richer context.

Reviewing generated documents created a different problem. Referring to specific paragraphs and sentences in chat was slow and imprecise. I found Peter Yang's [Human Review](https://github.com/petergyang/human-review) and forked it as [Doc Review](https://github.com/erdemtuna/doc-review) to add the behavior I wanted. It opens rendered Markdown, HTML, or a local web page in the browser, lets me edit or comment on the content directly, and sends the feedback back to the agent as a batch.

Handy improves the input side of the interaction. Doc Review improves the feedback side. Both help me stay involved without making communication with the agent the most laborious part of the work.

## The surrounding tools changed what the prompts needed to do

Some instructions that helped with earlier models may be redundant or restrictive with later ones. I was not running controlled comparisons, so I cannot confidently attribute a particular prompt change to model capability.

Using Copilot CLI more heavily in my daily work changed the interaction more visibly. In the terminal, the agent can inspect the repository, run commands, edit files, validate the result, and ask for a decision in the same flow. I can respond to what is happening instead of describing every future step in a large prompt or workflow document.

Copilot CLI also changed across its own releases. Its evolving capabilities may have changed how much orchestration I needed to write into the prompts. I cannot separate that influence cleanly from model improvements or from my own changing preferences.

When the skills framework for agents became available, I also created and used several skills. A skill packages knowledge or a process that the agent can load for a particular kind of work. I now actively use very few of them. I mainly reach for a skill when it provides niche knowledge or a process the default agent does not already know.

## What I pay attention to now

I still use purpose-specific prompts, generated artifacts, diagrams, subagents, and occasional skills alongside the default agent. Their roles are now narrower:

- Retaining enough understanding to maintain and change the implementation later.
- Choosing the diagram that helps me comprehend the relevant part of the system.
- Improving generated output for human readability and comprehension.
- Removing orchestration and ceremony when they do not help the work.
- Loading a skill only when it adds niche knowledge or a process the default agent lacks.
- Continuing to adapt the prompts as the models and Copilot CLI evolve.
- Using voice input and visual document review to reduce the friction of communicating with the agent.

Passing tests and completing my manual checks tell me that the behavior works. I also want to understand the design and code well enough to explain it, maintain it, and change it later.

The agent can now do more of the implementation than it could before. I do not need to reproduce every step myself, but I still want enough understanding to remain responsible for what is built after the conversation ends.
