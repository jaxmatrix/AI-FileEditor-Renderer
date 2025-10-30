# Introduction

Welcome to the AI Code Editor Agent documentation!

## What is AI Code Editor Agent?

The AI Code Editor Agent is an intelligent code editing system that uses AI agents to modify single or multiple files within an application instance. The system leverages markdown files containing contextual information and code blocks to facilitate precise code modifications.

Unlike traditional code editors that work with entire documents, this system focuses on editing specific sections or files using contextual markdown files that contain all necessary information for making accurate modifications.

## Key Features

- **Markdown-Driven Editing**: Contextual information stored in markdown files with code blocks
- **Real-Time Chat Interface**: Socket.IO-powered communication between frontend and backend
- **Persistent Chat Storage**: MongoDB-based storage for conversation history
- **AI-Powered Responses**: Gemini-2.5-flash model via OpenRouter for intelligent code assistance
- **Focused Editing**: Single document section editing rather than full-document manipulation

## Architecture Overview

The system consists of:

- **Backend**: Node.js/Express server with TypeScript, MongoDB, Socket.IO, and LangGraph
- **Frontend**: React with TypeScript, Vite, and Socket.IO client
- **AI Agent**: Gemini-2.5-flash model for concise, helpful responses
- **Database**: MongoDB for persistent chat storage and document management

## Getting Started

To get started with the AI Code Editor Agent, proceed to the [Setup](setup.md) chapter.