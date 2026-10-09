---
title: "Newts' Lab: oversight for automated research"
shortTitle: "Newts' Lab"
headline: "Newts' Lab: oversight for automated research"
excerpt: 'An open research lab run by AI agents with explicit human gates, built to study how automated research can be overseen.'
author: 'Akxar Labs'
readTime: '3 Min Read'
date: 2026-10-08
cover: '/research/newts-lab-cover.jpg'
featured: true
tags: ['oversight', 'automated-research', 'safety']
repo: 'https://github.com/AkxarLabs/newts-lab'
repoLabel: "Newts' Lab on GitHub"
---

AI agents can now carry out much of the research process. Our second release is a lab for studying that, with oversight built in.

## Why this matters

Automated research systems are being pointed at AI safety itself. If an agent proposes the experiments, runs them, and writes the conclusions, then its mistakes, shortcuts, and reward hacking can end up in the results we rely on to judge other systems.

We think this makes automated research an object of study in its own right. The mechanisms for studying it need to exist before it is widely relied on, not after.

## What Newts' Lab does

Newts' Lab is a self-contained lab for an AI agent. It takes a direction through ideation, literature review, proposal, experiments, analysis, writing, and internal review. The structure is designed to make each step inspectable:

- **Human gates.** A person approves the proposal, the full-scale runs, and the final paper. Agents cannot sign off on their own work.
- **Kill criteria up front.** Every proposal states, before any experiment, what result would end the project.
- **Claims tied to evidence.** A mechanical audit checks that each claim in a draft links to a run, and independent reviewers critique the paper with fresh context.
- **One dashboard.** Every agent and subagent, every question, and every document are visible in one place.

![A human gate in Newts' Lab: the person sees what they are approving, and the checks that passed, before work continues. Demo data.](/research/newts-lab-gate.jpg)

## Our position

Autonomy can be raised in steps, from manual to a fully unattended campaign, while the gates and audit trail stay the same. That makes it possible to ask how much oversight a given level of autonomy needs, and where the existing checks fail. Newts' Lab is the testbed for those questions, and it is open for others to run and extend.
