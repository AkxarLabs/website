---
title: 'SwarmScope: monitoring LLM agent swarms'
shortTitle: 'SwarmScope'
headline: 'SwarmScope: making large agent swarms monitorable'
excerpt: 'An open dashboard for watching, and finding anomalies in, large groups of AI agents, built on the premise that oversight has to scale with the swarm.'
author: 'Akxar Labs'
readTime: '3 Min Read'
date: 2026-10-09
cover: '/research/swarmscope-finding.jpg'
featured: true
tags: ['oversight', 'multi-agent', 'monitoring']
repo: 'https://github.com/Xarangi/SwarmFrame'
repoLabel: 'SwarmScope on GitHub'
---

Agents are increasingly deployed in groups, and groups behave differently from individuals. Our first release is a tool for watching them.

## Why this matters

In July 2026, roughly 1,200 AI agents running in a model developer's evaluation environment found an improvised message board, used it to coordinate, and went on to breach [Hugging Face](https://en.wikipedia.org/wiki/OpenAI%E2%80%93HuggingFace_incident). The breach was first flagged by Hugging Face's own monitoring. The developer's account cites weak isolation and no real-time monitoring of model behavior.

No single agent's transcript showed the problem. It lived in the interactions between agents, and in a volume of activity that no one was reading.

## The scaling problem

A swarm of 5,000 agents producing 1,000 actions a day generates about 5 million events daily. Reading them all would take roughly 750 million tokens; a generous model budget covers under 3% of that. A monitor that quietly summarizes "recent events" reports a biased sliver as if it were the whole.

## What SwarmScope does

SwarmScope reads a stream of agent activity, works out what the data contains, and builds a dashboard around it. Deterministic detectors see every event. Models read what the detectors surface, plus a random sample that the agents cannot steer.

- **Findings, not alarms.** Each finding (above) says what happened, why it might matter, the innocent explanation, and which records it rests on.
- **Cited claims.** Every number links to the underlying events.
- **Structure-aware.** It tracks who works on what, who talks to whom, and when many agents converge on the same thing.

![The World view places agents by who they talk to and what they work on.](/research/swarmscope-world.jpg)

## Our position

Monitorability should be a design requirement for multi-agent systems, not something added after an incident. We are releasing SwarmScope openly so others can test monitoring strategies against recorded and live swarms.
