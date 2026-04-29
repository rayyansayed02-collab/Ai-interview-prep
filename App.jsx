import React, { useState, useEffect } from 'react';
import { Zap, Brain, TrendingUp, LogOut, BarChart3, MessageCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function InterviewPrepApp() {
  const [currentScreen, setCurrentScreen] = useState('landing'); // landing, login, home, interview, feedback
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [interviewType, setInterviewType] = useState('behavioral');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [questionsData, setQuestionsData] = useState([]);
  const [interviewLimit, setInterviewLimit] = useState(null);
  const [userInterviews, setUserInterviews] = useState([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Load questions on mount
  useEffect(() => {
    if (user) {
      fetchQuestions('behavioral');
      fetchInterviewLimit();
      fetchUserInterviews();
    }
  }, [user]);

  const fetchQuestions = async (type) => {
    try {
      const res = await fetch(`${API_URL}/api/questions/${type}`);
      const data = await res.json();
      setQuestionsData(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchInterviewLimit = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/user/${user.id}/limit`);
      const data = await res.json();
      setInterviewLimit(data);
    } catch (error) {
      console.error('Error fetching limit:', error);
    }
  };

  const fetchUserInterviews = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/user/${user.id}/interviews`);
      const data = await res.json();
      setUserInterviews(data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    }
  };

  const handleLogin = async () => {
    if (!email) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setCurrentScreen('home');
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  const selectRandomQuestion = () => {
    if (questionsData.length > 0) {
      const random = questionsData[Math.floor(Math.random() * questionsData.length)];
      setCurrentQuestion(random);
      setUserAnswer('');
      setFeedback(null);
    }
  };

  const handleStartInterview = async (type) => {
    if (!interviewLimit?.canInterview) {
      setShowPremiumModal(true);
      return;
    }

    setInterviewType(type);
    await fetchQuestions(type);
    setCurrentScreen('interview');

    // Set a small delay to ensure questions are loaded
    setTimeout(() => {
      selectRandomQuestion();
    }, 100);
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !currentQuestion) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/interview/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: userAnswer,
          type: interviewType
        })
      });

      const data = await res.json();
      if (data.success) {
        setFeedback(data.feedback);
        setCurrentScreen('feedback');

        // Save interview
        await fetch(`${API_URL}/api/interview/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            question: currentQuestion.question,
            answer: userAnswer,
            feedback: data.feedback,
            type: interviewType
          })
        });

        // Refresh data
        await fetchInterviewLimit();
        await fetchUserInterviews();
      }
    } catch (error) {
      alert('Error generating feedback: ' + error.message);
    }
    setIsLoading(false);
  };

  const handleNextQuestion = () => {
    selectRandomQuestion();
    setCurrentScreen('interview');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('landing');
    setEmail('');
  };

  // Landing Page
  if (currentScreen === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        {/* Navigation */}
        <nav className="flex justify-between items-center px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-amber-400" />
            <span className="text-2xl font-bold tracking-tight">InterviewAI</span>
          </div>
          <button
            onClick={() => setCurrentScreen('login')}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-all"
          >
            Get Started
          </button>
        </nav>

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center space-y-8">
            <h1 className="text-6xl font-bold tracking-tight leading-tight">
              Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Every Interview</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Practice with AI-powered mock interviews. Get instant feedback on behavioral and technical questions. Build confidence for your next big opportunity.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setCurrentScreen('login')}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-all text-lg"
              >
                Start Free Trial
              </button>
              <button className="px-8 py-3 border-2 border-slate-400 hover:border-white text-white font-bold rounded-lg transition-all text-lg">
                Learn More
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-24">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-4 hover:border-amber-500/50 transition-all">
              <Brain className="w-12 h-12 text-amber-400" />
              <h3 className="text-xl font-bold">AI Mock Interviewer</h3>
              <p className="text-slate-300">Practice real interviews with an AI that understands context and provides thoughtful feedback.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-4 hover:border-amber-500/50 transition-all">
              <MessageCircle className="w-12 h-12 text-amber-400" />
              <h3 className="text-xl font-bold">Behavioral & Technical</h3>
              <p className="text-slate-300">Master both STAR method responses and technical deep dives with curated question banks.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-4 hover:border-amber-500/50 transition-all">
              <TrendingUp className="w-12 h-12 text-amber-400" />
              <h3 className="text-xl font-bold">Track Progress</h3>
              <p className="text-slate-300">See your improvement over time with detailed analytics and performance insights.</p>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mt-32 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-6">
              <h3 className="text-2xl font-bold">Free</h3>
              <p className="text-slate-300">Perfect for getting started</p>
              <div className="text-3xl font-bold text-amber-400">$0</div>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> 5 mock interviews/month</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> Basic AI feedback</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> 50+ questions</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500 rounded-xl p-8 space-y-6">
              <h3 className="text-2xl font-bold">Premium</h3>
              <p className="text-slate-300">For serious prep</p>
              <div className="text-3xl font-bold text-amber-400">$9.99<span className="text-lg">/mo</span></div>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> Unlimited interviews</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> Detailed feedback & scoring</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> Company-specific prep</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-400 rounded-full"></span> Performance analytics</li>
              </ul>
              <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-lg transition-all">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login Page
  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Welcome Back</h1>
              <p className="text-slate-400">Start your interview prep journey</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={!email}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-950 font-bold rounded-lg transition-all"
              >
                Continue
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentScreen('landing')}
                className="text-slate-400 hover:text-white transition-all"
              >
                ← Back to home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Home Page
  if (currentScreen === 'home') {
    const avgScore = userInterviews.length > 0
      ? Math.round(userInterviews.reduce((sum, i) => sum + (i.feedback?.score || 0), 0) / userInterviews.length)
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        {/* Navigation */}
        <nav className="flex justify-between items-center px-6 py-4 border-b border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-amber-400" />
            <span className="text-2xl font-bold">InterviewAI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <p className="text-slate-400 text-sm mb-2">Interviews Completed</p>
              <p className="text-4xl font-bold text-amber-400">{userInterviews.length}</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <p className="text-slate-400 text-sm mb-2">Average Score</p>
              <p className="text-4xl font-bold text-amber-400">{avgScore}/10</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <p className="text-slate-400 text-sm mb-2">This Month</p>
              <p className="text-4xl font-bold text-amber-400">{interviewLimit?.remaining || 0}/5 left</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="space-y-6 mb-12">
            <h2 className="text-4xl font-bold">Ready to Practice?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => handleStartInterview('behavioral')}
                className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl p-8 text-left transition-all group"
              >
                <h3 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">Behavioral Interview</h3>
                <p className="text-blue-100">Master STAR method responses and teamwork questions</p>
              </button>

              <button
                onClick={() => handleStartInterview('technical')}
                className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl p-8 text-left transition-all group"
              >
                <h3 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">Technical Interview</h3>
                <p className="text-purple-100">Practice system design, algorithms, and code questions</p>
              </button>
            </div>
          </div>

          {/* Recent Interviews */}
          {userInterviews.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Recent Practice</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {userInterviews.slice(-5).reverse().map((interview) => (
                  <div key={interview.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <p className="text-sm text-slate-400 mb-2">{new Date(interview.timestamp).toLocaleDateString()}</p>
                    <p className="text-white font-medium mb-2">{interview.question}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-slate-700 px-3 py-1 rounded-full text-slate-300">
                        {interview.type === 'behavioral' ? '💬 Behavioral' : '💻 Technical'}
                      </span>
                      <span className="text-amber-400 font-bold">{interview.feedback?.score || 'N/A'}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Interview Page
  if (currentScreen === 'interview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <nav className="flex justify-between items-center px-6 py-4 border-b border-slate-700/50 bg-slate-900/50">
          <button
            onClick={() => setCurrentScreen('home')}
            className="text-slate-400 hover:text-white transition-all"
          >
            ← Back
          </button>
          <span className="font-semibold">
            {interviewType === 'behavioral' ? '💬 Behavioral' : '💻 Technical'} Interview
          </span>
        </nav>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-8">
            {currentQuestion ? (
              <>
                <div className="space-y-4">
                  <p className="text-slate-400 text-sm">Question</p>
                  <p className="text-2xl font-bold leading-relaxed">{currentQuestion.question}</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium">Your Answer</label>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your response here. Take your time and think out loud..."
                    className="w-full h-40 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-all resize-none"
                  />
                  <p className="text-xs text-slate-500">{userAnswer.length} characters</p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim() || isLoading}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-950 font-bold rounded-lg transition-all"
                  >
                    {isLoading ? 'Getting Feedback...' : 'Submit Answer'}
                  </button>
                  <button
                    onClick={selectRandomQuestion}
                    className="px-6 py-3 border border-slate-600 hover:border-slate-400 text-white font-semibold rounded-lg transition-all"
                  >
                    New Question
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-slate-400">Loading question...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Feedback Page
  if (currentScreen === 'feedback' && feedback) {
    const score = feedback.score || feedback.raw?.split('\n')[0] || 'N/A';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <nav className="flex justify-between items-center px-6 py-4 border-b border-slate-700/50 bg-slate-900/50">
          <button
            onClick={() => setCurrentScreen('home')}
            className="text-slate-400 hover:text-white transition-all"
          >
            ← Home
          </button>
        </nav>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-8">
            {/* Score */}
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-lg p-6 text-center">
              <p className="text-slate-400 text-sm mb-2">Your Score</p>
              <p className="text-6xl font-bold text-amber-400">{score}/10</p>
            </div>

            {/* Feedback Content */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3 text-green-400">✓ Strengths</h3>
                <p className="text-slate-300 leading-relaxed">
                  {feedback.strengths || feedback.correctness || 'Good attempt! Focus on being more specific with examples.'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3 text-blue-400">→ Areas to Improve</h3>
                <p className="text-slate-300 leading-relaxed">
                  {feedback.improvements || feedback.depth || 'Consider adding more detail and specific examples from your experience.'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3 text-purple-400">💡 Next Steps</h3>
                <p className="text-slate-300 leading-relaxed">
                  {feedback.suggestions || 'Practice this question again with the feedback in mind. Focus on structure and clarity.'}
                </p>
              </div>
            </div>

            {/* Original Q&A */}
            <div className="bg-slate-900/50 rounded-lg p-4 space-y-3 border border-slate-700">
              <div>
                <p className="text-xs text-slate-500 mb-1">Question</p>
                <p className="text-white">{currentQuestion?.question}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Your Answer</p>
                <p className="text-slate-300 text-sm max-h-24 overflow-y-auto">{userAnswer}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleNextQuestion}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-all"
              >
                Practice Another Question
              </button>
              <button
                onClick={() => setCurrentScreen('home')}
                className="px-6 py-3 border border-slate-600 hover:border-slate-400 text-white font-semibold rounded-lg transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
