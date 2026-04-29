import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const client = new Anthropic();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory storage (replace with database in production)
const users = new Map();
const interviews = new Map();
let interviewCounter = 0;

// Mock user data structure
const createUser = (email) => ({
  id: Math.random().toString(36).substr(2, 9),
  email,
  isPremium: false,
  interviewsThisMonth: 0,
  createdAt: new Date(),
  interviews: []
});

// Question Bank
const questionBank = {
  behavioral: [
    {
      id: 'b1',
      question: 'Tell me about a time when you had to work with a difficult team member. How did you handle it?',
      category: 'teamwork',
      difficulty: 'medium'
    },
    {
      id: 'b2',
      question: 'Describe a situation where you failed. What did you learn from it?',
      category: 'resilience',
      difficulty: 'hard'
    },
    {
      id: 'b3',
      question: 'Give an example of when you went above and beyond in your role.',
      category: 'ownership',
      difficulty: 'medium'
    },
    {
      id: 'b4',
      question: 'Tell me about a time you had to learn something new quickly.',
      category: 'learning',
      difficulty: 'easy'
    },
    {
      id: 'b5',
      question: 'Describe a time when you had to manage multiple priorities. How did you organize your work?',
      category: 'prioritization',
      difficulty: 'medium'
    },
    {
      id: 'b6',
      question: 'Tell me about a project you led and what made it successful.',
      category: 'leadership',
      difficulty: 'hard'
    },
    {
      id: 'b7',
      question: 'Give an example of when you received critical feedback. How did you respond?',
      category: 'feedback',
      difficulty: 'hard'
    },
    {
      id: 'b8',
      question: 'Tell me about a time you made a mistake at work. How did you fix it?',
      category: 'accountability',
      difficulty: 'medium'
    }
  ],
  technical: [
    {
      id: 't1',
      question: 'Explain the difference between SQL and NoSQL databases. When would you use each?',
      category: 'databases',
      difficulty: 'medium'
    },
    {
      id: 't2',
      question: 'What are the main principles of object-oriented programming?',
      category: 'fundamentals',
      difficulty: 'easy'
    },
    {
      id: 't3',
      question: 'How does the event loop work in JavaScript?',
      category: 'javascript',
      difficulty: 'hard'
    },
    {
      id: 't4',
      question: 'Explain the concept of RESTful APIs and why they\'re useful.',
      category: 'apis',
      difficulty: 'medium'
    },
    {
      id: 't5',
      question: 'What is the difference between var, let, and const in JavaScript?',
      category: 'javascript',
      difficulty: 'easy'
    },
    {
      id: 't6',
      question: 'Design a system to handle 1 million concurrent users. What would you consider?',
      category: 'system-design',
      difficulty: 'hard'
    },
    {
      id: 't7',
      question: 'Explain what caching is and why it matters for application performance.',
      category: 'performance',
      difficulty: 'medium'
    },
    {
      id: 't8',
      question: 'What is the difference between authentication and authorization?',
      category: 'security',
      difficulty: 'medium'
    }
  ]
};

// Routes

// Get interview questions
app.get('/api/questions/:type', (req, res) => {
  const { type } = req.params;
  const questions = questionBank[type] || [];
  res.json(questions);
});

// Generate AI feedback
app.post('/api/interview/feedback', async (req, res) => {
  try {
    const { question, answer, type } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Missing question or answer' });
    }

    let prompt = '';

    if (type === 'behavioral') {
      prompt = `You are an expert interview coach. A candidate was asked: "${question}"

They answered: "${answer}"

Provide constructive feedback on their answer using the STAR method (Situation, Task, Action, Result). Rate their response 1-10 and explain:
1. What they did well
2. What could be improved
3. Specific suggestions for next time

Format your response as JSON with keys: score, strengths, improvements, suggestions`;
    } else {
      prompt = `You are a senior technical interviewer. A candidate was asked: "${question}"

They answered: "${answer}"

Evaluate their technical answer on:
1. Correctness and accuracy
2. Completeness and depth
3. Communication clarity

Rate 1-10 and provide structured feedback. Format as JSON with keys: score, correctness, depth, clarity, improvements`;
    }

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const feedbackText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Try to parse JSON from response
    let feedback;
    try {
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
      feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: feedbackText };
    } catch {
      feedback = { raw: feedbackText };
    }

    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({ error: 'Failed to generate feedback', details: error.message });
  }
});

// Save interview
app.post('/api/interview/save', (req, res) => {
  try {
    const { userId, question, answer, feedback, type } = req.body;

    const interview = {
      id: ++interviewCounter,
      userId,
      question,
      answer,
      feedback,
      type,
      timestamp: new Date(),
      score: feedback?.score || 0
    };

    if (!interviews.has(userId)) {
      interviews.set(userId, []);
    }
    interviews.get(userId).push(interview);

    // Track monthly limit
    if (users.has(userId)) {
      const user = users.get(userId);
      user.interviewsThisMonth++;
    }

    res.json({ success: true, interviewId: interview.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save interview' });
  }
});

// Get user interviews
app.get('/api/user/:userId/interviews', (req, res) => {
  const { userId } = req.params;
  const userInterviews = interviews.get(userId) || [];
  res.json(userInterviews);
});

// Create/login user
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  let user = Array.from(users.values()).find(u => u.email === email);

  if (!user) {
    user = createUser(email);
    users.set(user.id, user);
  }

  res.json({ success: true, user });
});

// Check interview limit
app.get('/api/user/:userId/limit', (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const canInterview = user.isPremium || user.interviewsThisMonth < 5;
  const remaining = user.isPremium ? Infinity : Math.max(0, 5 - user.interviewsThisMonth);

  res.json({ canInterview, remaining, isPremium: user.isPremium });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
