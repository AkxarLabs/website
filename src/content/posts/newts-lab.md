---
title: "Newts' Lab: studying automated research"
shortTitle: "Newts' Lab"
headline: "Newts' Lab: a testbed for overseeing automated research"
excerpt: 'A customizable lab where an AI agent runs research from idea to paper under human gates, built for studying how such systems should be overseen.'
author: 'Akxar Labs'
readTime: '3 Min Read'
date: 2026-10-08
cover: '/research/newts-lab-cover.jpg'
featured: true
tags: ['oversight', 'automated-research', 'safety']
repo: 'https://github.com/AkxarLabs/newts-lab'
repoLabel: "Newts' Lab on GitHub"
---

This is a short release and position note, not a results paper.

## Background

Automated research systems can now take on much of the research process, from generating ideas to writing papers. They are increasingly pointed at AI safety research itself.

## The argument

When an agent proposes experiments, runs them and writes up the conclusions, its mistakes and shortcuts can carry into results that people then use to judge other AI systems. We need better ways to study these systems: what they do when no one is watching, where they cut corners, and which checks actually catch it.

That requires a setting where automated research runs with visible structure rather than as a black box. There is also no reason to expect one oversight design to be right, so the setting should be easy to change.

## Newts' Lab

Newts' Lab is an open lab in which an agent carries a research direction from idea to paper. A person approves it at three gates, each proposal states in advance what result would end the project, and a mechanical audit checks that claims in a draft link back to runs.

The rest is meant to be modified. Stages, procedures, subagent roles, rules and checks are defined in files and can be edited from the dashboard. Only the gates and the safety rules are fixed. The lab can run manually, one stage at a time, or unattended under an approved brief, which makes it possible to compare how much oversight each level of autonomy needs.

![A human gate in Newts' Lab: the person sees what they are approving and which checks passed before work continues. Demo data.](/research/newts-lab-gate.jpg)

We are releasing it early for others to run, change and test.
